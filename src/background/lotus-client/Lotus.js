import * as signer from '@zondax/filecoin-signing-tools';
import onOptionsChanged from 'src/shared/onOptionsChanged';
import getOptions from 'src/shared/getOptions';
import ports from '../ports';
import methods from './methods';
import encoder from './encoder';

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
    console.log(method, params);
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
      if (
        error.message ===
        `resolution lookup failed (${this.wallet}): resolve address ${this.wallet}: address not found`
      ) {
        // not sure this should still be happening: https://github.com/filecoin-project/lotus/issues/1907
        return 0;
      }

      throw error;
    }
  }

  async waitForMessage(messageLink) {
    // FIXME: use websockets instead of pooling
    let keepPooling = true;

    setTimeout(() => {
      keepPooling = false;
    }, 10 * 1000);

    while (keepPooling) {
      try {
        return await this.post('Filecoin.ChainGetParentReceipts', [messageLink]);
      } catch (error) {
        if (error.message === 'blockstore: block not found') {
          // try again in a second
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          throw error;
        }
      }
    }
  }

  async getOrCreatePaymentChannel(to, value) {
    // TODO: recycle existing channel

    const messageLink = await this.signAndPostMessage({
      to,
      from: this.wallet,
      value: value.toString(),
      method: methods.init.exec,
      params: encoder.encodePaymentChannelParams(this.wallet, to),
      gaslimit: 1000000,
      gasprice: '1000',
      nonce: await this.getNextNonce(),
    });

    // TODO: got this error if there was no previous message sent by this.wallet
    // failed to look up actor state nonce: resolution lookup failed (WALLET_ADDRESS): resolve address WALLET_ADDRESS: address not found: broadcasting message despite validation fail

    const receipt = await this.waitForMessage(messageLink);
    console.log(receipt);

    // TODO: get address from receipt
    const paymentChannel = 'address';

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
