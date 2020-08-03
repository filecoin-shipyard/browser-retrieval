import * as signer from '@zondax/filecoin-signing-tools';
import onOptionsChanged from 'src/shared/onOptionsChanged';
import getOptions from 'src/shared/getOptions';
import ports from '../ports';
import methods from './methods';
import encoder from './encoder';
import actors from './actors';
import decoder from './decoder';

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
    this.privateKey = signer.keyRecover(privateKey).private_hexstring;
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
    return this.post('Filecoin.MpoolPush', [
      JSON.parse(signer.transactionSignLotus(message, this.privateKey)),
    ]);
  }

  async post(method, params = []) {
    const response = await fetch(this.lotusEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.lotusToken}` },
      body: JSON.stringify({ jsonrpc: '2.0', method, params, id: this.id++ }),
    });

    const { error, result } = await response.json();

    if (error) {
      throw error;
    }

    return result;
  }

  async getNextNonce() {
    try {
      const nonce = await this.post('Filecoin.MpoolGetNonce', [this.wallet]);
      return nonce + 1;
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
    return this.post('Filecoin.StateWaitMsg', [messageLink, confidence]);
  }

  async getOrCreatePaymentChannel(to, value) {
    // TODO: recycle existing channel

    const messageLink = await this.signAndPostMessage({
      to: actors.init.address,
      from: this.wallet,
      value: value.toString(),
      method: methods.init.exec,
      params: encoder.encodePaymentChannelParams(this.wallet, to),
      gaslimit: 20000000,
      gasprice: '1',
      nonce: await this.getNextNonce(),
    });

    const result = await this.waitForMessage(messageLink);

    const paymentChannel = decoder.decodePaymentChannelAddressFromReceipt(
      result.Receipt,
      this.wallet[0] === 't',
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
  }

  async createPaymentVoucher(paymentChannel, lane, amount) {
    const voucher = {
      Lane: lane,
      Amount: amount,
      Nonce: this.paymentChannelsInfo[paymentChannel].lanesNextNonce[lane]++,
    };

    voucher.Signature = signer.transactionSignRaw(encoder.encodeVoucher(voucher), this.privateKey);

    return voucher;
  }

  async checkPaymentVoucherValid(paymentChannel, paymentVoucher) {
    await this.post('Filecoin.PaychVoucherCheckValid', [paymentChannel, paymentVoucher]);
  }

  async submitPaymentVoucher(paymentChannel, paymentVoucher) {
    await this.signAndPostMessage({
      to: paymentChannel,
      from: this.wallet,
      value: '0',
      method: methods.paych.updateChannelState,
      params: encoder.encodeVoucher(paymentVoucher),
      gaslimit: 100000,
      gasprice: '0',
      nonce: await this.getNextNonce(),
    });
  }

  async closePaymentChannel(paymentChannel) {
    await this.signAndPostMessage({
      to: paymentChannel,
      from: this.wallet,
      value: '0',
      method: methods.paych.settle,
      gaslimit: 10000,
      gasprice: '0',
      nonce: await this.getNextNonce(),
    });
    delete this.paymentChannelsInfo[paymentChannel];
  }
}

export default Lotus;
