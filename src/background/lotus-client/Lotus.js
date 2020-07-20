import dagCBOR from 'ipld-dag-cbor';
import * as signer from '@zondax/filecoin-signing-tools';
import onOptionsChanged from 'src/shared/onOptionsChanged';
import getOptions from 'src/shared/getOptions';
import ports from '../ports';
import methods from './methods';
import codes from './codes';

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

  cbor(object) {
    return dagCBOR.util.serialize(object).toString('hex');
  }

  serializeParams({ CodeCID, ConstructorParams }) {
    return this.cbor({
      CodeCID,
      ConstructorParams: this.cbor(ConstructorParams),
    });
  }

  signMessage(message) {
    if (message.params) {
      message.params = this.serializeParams(message.params);
    }

    return JSON.parse(signer.transactionSignLotus(message, this.privateKey));
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
    const nonce = await this.post('Filecoin.MpoolGetNonce', [this.wallet]);
    return nonce + 1;
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

    const messageLink = await this.post('Filecoin.MpoolPush', [
      this.signMessage({
        to,
        from: this.wallet,
        value: value.toString(),
        method: methods.init.exec,
        params: {
          CodeCID: codes.paymentChannel,
          ConstructorParams: {
            From: this.wallet,
            To: to,
          },
        },
        gaslimit: 1000000,
        gasprice: '1000',
        nonce: await this.getNextNonce(),
      }),
    ]);

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

    // TODO: create voucher cbor as per https://github.com/filecoin-project/specs-actors/blob/master/actors/builtin/paych/cbor_gen.go#L552
    const voucherCbor = this.cbor(voucher);

    voucher.Signature = signer.transactionSignRaw(voucherCbor, this.privateKey);

    return voucher;
  }

  async checkPaymentVoucherValid(paymentChannel, paymentVoucher) {
    await this.post('Filecoin.PaychVoucherCheckValid', [paymentChannel, paymentVoucher]);
  }

  closePaymentChannel(paymentChannel) {
    // TODO: actually close payment channel
    delete this.paymentChannelsInfo[paymentChannel];
  }
}

export default Lotus;
