import BigNumber from 'bignumber.js';
import onOptionsChanged from 'src/shared/onOptionsChanged';
import getOptions from 'src/shared/getOptions';
import ports from '../ports';
import methods from './methods';
import actors from './actors';
import encoder from './encoder';
import decoder from './decoder';
import signer from './signer';

const gasLimit = 20000000;
const nblocksincl = 2;

class Lotus {
  static async create() {
    const lotus = new Lotus();
    await lotus.initialize();
    return lotus;
  }

  id = 0;

  paymentChannelsInfo = {};

  async initialize() {
    await this.updateOptions();
    onOptionsChanged(this.handleOptionsChange);
  }

  async updateOptions() {
    const { lotusEndpoint, lotusToken, wallet, privateKey } = await getOptions();
    this.lotusEndpoint = lotusEndpoint;
    this.lotusToken = lotusToken;
    this.wallet = wallet;
    this.privateKey = signer.getPrivateKey(privateKey);
  }

  handleOptionsChange = async changes => {
    if (
      changes['lotusEndpoint'] ||
      changes['lotusToken'] ||
      changes['wallet'] ||
      changes['privateKey']
    ) {
      try {
        await this.updateOptions();
      } catch (error) {
        console.error(error);
        ports.postLog(`ERROR: update lotus failed: ${error.message}`);
      }
    }
  };

  async signAndPostMessage(message) {
    const [gasPrice, nonce] = await Promise.all([this.getGasPrice(), this.getNextNonce()]);

    message.GasLimit = gasLimit;
    message.GasPrice = gasPrice;
    message.Nonce = nonce;

    const signedMessage = await signer.signMessage(message, this.privateKey);
    return this.post('Filecoin.MpoolPush', [signedMessage]);
  }

  async post(method, params = []) {
    const response = await fetch(this.lotusEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.lotusToken}` },
      body: JSON.stringify({ jsonrpc: '2.0', method, params, id: this.id++ }),
    });

    const { error, result } = await response.json();

    if (error) {
      throw new Error(`Lotus ${method} failed: ${error.message}`);
    }

    return result;
  }

  async getGasPrice() {
    const gasPrice = await this.post('Filecoin.MpoolEstimateGasPrice', [
      nblocksincl,
      this.wallet,
      gasLimit,
      null,
    ]);

    return new BigNumber(gasPrice);
  }

  async getNextNonce() {
    try {
      return await this.post('Filecoin.MpoolGetNonce', [this.wallet]);
    } catch (error) {
      if (error.message.includes('resolution lookup failed')) {
        // not sure this should still be happening: https://github.com/filecoin-project/lotus/issues/1907
        return 0;
      }

      throw error;
    }
  }

  // TODO: change default confidence to 5 after we make it work
  async waitForMessage(messageLink, confidence = 1) {
    const result = this.post('Filecoin.StateWaitMsg', [messageLink, confidence]);

    if (result.Receipt.ExitCode === 0) {
      ports.postLog(`INFO: message accepted on the chain: ${messageLink['/']}`);
    } else {
      throw new Error(`Message failed to get on the chain (exit code: ${result.Receipt.ExitCode})`);
    }

    return result;
  }

  async getOrCreatePaymentChannel(to, value) {
    // TODO: recycle existing channel
    const isTestnet = this.wallet[0] === 't';

    const messageLink = await this.signAndPostMessage({
      To: actors.init.address(isTestnet),
      From: this.wallet,
      Value: value,
      Method: methods.init.exec,
      Params: encoder.encodePaymentChannelParams(this.wallet, to).toString('base64'),
    });

    const result = await this.waitForMessage(messageLink);

    const paymentChannel = decoder.decodePaymentChannelAddressFromReceipt(
      result.Receipt.Return,
      isTestnet,
    );

    this.paymentChannelsInfo[paymentChannel] = {
      nextLane: 0,
      lanesNextNonce: {},
    };

    return paymentChannel;
  }

  async allocateLane(paymentChannel) {
    const lane = this.paymentChannelsInfo[paymentChannel].nextLane++;
    this.paymentChannelsInfo[paymentChannel].lanesNextNonce[lane] = 0;
    return lane;
  }

  async createPaymentVoucher(paymentChannel, lane, amount) {
    const voucher = {
      Lane: lane,
      Amount: amount,
      Nonce: this.paymentChannelsInfo[paymentChannel].lanesNextNonce[lane]++,
      ChannelAddr: paymentChannel,
    };

    voucher.Signature = signer.signBytes(encoder.encodeVoucher(voucher), this.privateKey);

    return voucher;
  }

  async checkPaymentVoucherValid(paymentChannel, paymentVoucher) {
    await this.post('Filecoin.PaychVoucherCheckValid', [paymentChannel, paymentVoucher]);
  }

  async submitPaymentVoucher(paymentChannel, paymentVoucher) {
    await this.signAndPostMessage({
      To: paymentChannel,
      From: this.wallet,
      Value: new BigNumber(0),
      Method: methods.paych.updateChannelState,
      Params: encoder.encodeVoucher(paymentVoucher).toString('base64'),
    });
  }

  async closePaymentChannel(paymentChannel) {
    await this.signAndPostMessage({
      To: paymentChannel,
      From: this.wallet,
      Value: new BigNumber(0),
      Method: methods.paych.settle,
    });
    delete this.paymentChannelsInfo[paymentChannel];
  }
}

export default Lotus;
