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

  /* TODO: use new Map ? */
  paymentChannelsInfo = {};

  async initialize() {
    await this.updateOptions();
    onOptionsChanged(this.handleOptionsChange);
  }

  async updateOptions() {
    const { lotusEndpoint, lotusToken, wallet, privateKey } = await getOptions();
    this.lotusEndpoint = lotusEndpoint;
    this.lotusToken = lotusToken;
    /* TODO: get wallet address with keyRecover */
    this.wallet = wallet;
    /* TODO: store as base64 string */
    let recoveredKey = signer.keyRecover(privateKey);
    this.privateKey = recoveredKey.private_hexstring;
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
  
  async getGasEstimation(message) {
    return await this.post('Filecoin.GasEstimateMessageGas', [message, { MaxFee: "0" }, null])
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
  
  async createPaymentChannel(to, value) {
    const nonce = await this.getNextNonce();
    let message = signer.createPymtChan(this.wallet, to, value, nonce);
    let messageWithGas = await getGasEstimation(message);
    let signedMessage = signer.transactionSignLotus(messageWithGas, Buffer.from(this.privateKey, 'hex').toDtring('base64')); 
    
    const messageCID = await this.post('Filecoin.MpoolPush', [signedMessage]);
    
    const receipt = await this.waitForMessage(messageCID);
    
    const paymentChannel = receipt.ReturnDec.IDAddress;
    
    this.paymentChannelsInfo[paymentChannel] = {
      nextLane: 0,
      lanesNextNonce: {},
    };
    
    return paymentChannel;
  }

  /* NOTE: this won't work. Existing payment channel need to be cached locally */
  /*async getOrCreatePaymentChannel(to, value) {
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
  }*/

  allocateLane(paymentChannel) {
    const lane = this.paymentChannelsInfo[paymentChannel].nextLane++;
    this.paymentChannelsInfo[paymentChannel].lanesNextNonce[lane] = 0;
  }

  createPaymentVoucher(paymentChannel, lane, amount) {    
    let nonce = BigInt(this.paymentChannelsInfo[paymentChannel].lanesNextNonce[lane]++);
    
    let voucher = signer.createVoucher(paymentChannel, "0", "0", amount, lane, nonce, "0")

    let signedVoucher = signer.signVoucher(voucher, Buffer.from(this.privateKey, 'hex').toDtring('base64'))

    return signedVoucher;
  }

  async checkPaymentVoucherValid(paymentChannel, paymentVoucher) {
    await this.post('Filecoin.PaychVoucherCheckValid', [paymentChannel, paymentVoucher]);
  }

  async closePaymentChannel(paymentChannel) {
    const nonce = await this.getNextNonce();

    const settleMessage = signer.settlePymtChan(paymentChannel, this.wallet, nonce);
    let messageWithGas = await getGasEstimation(settleMessage);
    let signedMessage = signer.transactionSignLotus(messageWithGas, Buffer.from(this.privateKey, 'hex').toDtring('base64')); 
    
    const messageCID = await this.post('Filecoin.MpoolPush', [signedMessage]);
    
    const receipt = await this.waitForMessage(messageCID);
    
    /* TODO: maybe don't delete until it has been collected */
    delete this.paymentChannelsInfo[paymentChannel];
  }
}

export default Lotus;
