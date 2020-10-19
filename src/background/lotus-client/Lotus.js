import * as signer from '@zondax/filecoin-signing-tools';  // TODO:  rename to signer to filecoin_signer
import onOptionsChanged from 'src/shared/onOptionsChanged';
import getOptions from 'src/shared/getOptions';
import ports from '../ports';
// Required to workaround `Invalid asm.js: Unexpected token` error:
const importDagCBOR = () => {
  return require('ipld-dag-cbor');
}
import inspect from 'browser-util-inspect';
import axios from 'axios'

class Lotus {
  static async create() {
    ports.postLog(`DEBUG: entering Lotus.create`);
    const lotus = new Lotus();
    await lotus.initialize();
    ports.postLog(`DEBUG: leaving Lotus.create`);
    return lotus;
  }

  id = 0;

  paymentChannelsInfo = {};

  async initialize() {
    ports.postLog(`DEBUG: Lotus.initialize:  entering`);
    await this.updateOptions();
    onOptionsChanged(this.handleOptionsChange);
    ports.postLog(`DEBUG: Lotus.initialize:  leaving`);
  }

  // for testing filecoin_signer
  async keyRecoverLogMsg() {
    // This is a dummy wallet with no funds. Recovered addr will be f156e3l2vwd5wi5jwdrd6gdg4y7t2yknq6see7xbq
    let privKey = "ciiFbmF7F7mrVs5E/IT8TV63PdFPLrRs9R/Cc3vri2I=";
    let recoveredPKey = signer.keyRecover(privKey, false);
    ports.postLog(`DEBUG: Lotus.keyRecover: recovered='${recoveredPKey.address}' (=='...7xbq'?)`);
  }

  async updateOptions() {
    const { lotusEndpoint, lotusToken, wallet, privateKey } = await getOptions();
    this.lotusEndpoint = lotusEndpoint;
    this.lotusToken = lotusToken;
    this.wallet = wallet;
    this.privateKeyBase64 = privateKey
    this.privateKey = signer.keyRecover(privateKey).private_hexstring; //TODO:  is this used anywhere?
    this.headers = { "Authorization": `Bearer ${lotusToken}` }
  }

  handleOptionsChange = async (changes) => {
    if (changes['lotusEndpoint'] || changes['lotusToken'] || changes['wallet'] || changes['privateKey']) {
      try {
        await this.updateOptions();
      } catch (error) {
        console.error(error);
        ports.postLog(`ERROR: update lotus failed: ${error.message}`);
      }
    }
  };

  /**
   * Get the next nonce for an address
   * @param  {string} addr Wallet address like `f156e3l2vwd5wi5jwdrd6gdg4y7t2yknq6see7xbq`
   * @return {number} Returns the next nonce, or undefined if an error occurred
   */
  async getNonce(addr) {
    //ports.postLog(`DEBUG: entering Lotus.getNonce`);
    let headers = this.headers
    //ports.postLog(`DEBUG: Lotus.getNonce:\n  this.headers=${inspect(headers)}\n  this.lotusEndpoint=${this.lotusEndpoint}\n  addr=${addr}`);
    var response;
    try {
      response = await axios.post(this.lotusEndpoint, {
        jsonrpc: "2.0",
        method: "Filecoin.MpoolGetNonce",
        id: 1,
        params: [addr]
      }, {headers});
    } catch (error) {
      ports.postLog(`ERROR: Lotus.getNonce(): axios error: ${error.message}`);
      return undefined
    }
		//ports.postLog("response.data = "+inspect(response.data));
		let nonce = response.data.result;
    //ports.postLog(`Nonce (${addr}) = ${nonce}`);
    //ports.postLog(`DEBUG: leaving Lotus.getNonce (ret = ${nonce})`);
    ports.postLog(`DEBUG: Lotus.getNonce => ${nonce}`);
		return nonce;
  }
  
  /**
   * Push a message into the mpool with Filecoin.MpoolPush
   * @param  {string} signedMessage A signed message to push into the mpool
   * @return {string} Returns the CID of the submitted message, or undefined if an error occurred
   */
  async mpoolPush(signedMessage) {
    //ports.postLog(`DEBUG: entering Lotus.mpoolPush`);
    let headers = this.headers
    var response;
    var msgCid;
    try {
      response = await axios.post(this.lotusEndpoint, {
        jsonrpc: "2.0",
        method: "Filecoin.MpoolPush",
        id: 1,
        params: [signedMessage]
      }, {headers});
      msgCid = response.data.result;
    } catch (error) {
      ports.postLog(`ERROR: Lotus.mpoolPush(): axios error: ${error.message}`);
      return undefined
    }
		//ports.postLog(`response.data = ${inspect(response.data)}`);
    //ports.postLog(`DEBUG: leaving Lotus.mpoolPush => ${inspect(msgCid)}`);
    ports.postLog(`DEBUG: Lotus.mpoolPush => ${inspect(msgCid)}`);
		return msgCid;
  }

  /**
   * Wraps Filecoin.StateWaitMsg by taking a msg CID and waiting for its response.data
   * @param  {string} cid The message CID to wait for
   * @return {object} Returns the wait response.data member, or undefined if an error occurred
   */
  async stateWaitMsg(cid) {
    //ports.postLog(`DEBUG: entering Lotus.stateWaitMsg(cid='${cid}')`);
    ports.postLog(`INFO: begining StateWaitMsg. This will take a while...`);
    let headers = this.headers
    var response;
    try {
      response = await axios.post(this.lotusEndpoint, {
        jsonrpc: "2.0",
        method: "Filecoin.StateWaitMsg",
        id: 1,
        params: [cid, null]
      }, { headers });
    } catch (error) {
      ports.postLog(`ERROR: Lotus.stateWaitMsg(): axios error: ${error.message}`);
      return undefined
    }
		//ports.postLog(`response.data = ${inspect(response.data)}`);
    //ports.postLog(`DEBUG: leaving Lotus.stateWaitMsg => ${inspect(msgCid)}`);
    ports.postLog(`--------------------------------------------------------------------------------------------------`);
    ports.postLog(`DEBUG: Lotus.stateWaitMsg => ${inspect(response.data)} ; ${inspect(response.data.result)}`);
    ports.postLog(`--------------------------------------------------------------------------------------------------`);
    return response.data;
  }

  /**
   * Creates a payment voucher for the given amount valid on the given payment channel
   * @param  {string} pch The address of the payment channel
   * @param  {number} amountAttoFil Voucher amount in attofil
   * @param  {number} nonce Integer that should increment for each new sv on a given payment channel
   * @return {string} Returns the voucher as a string, or undefined if an error occurred
   */
  async createSignedVoucher(pch, amountAttoFil, nonce) {
    try {
      let voucher = signer.createVoucher(pch, BigInt(0), BigInt(0), `${amountAttoFil}`, BigInt(0), BigInt(nonce), BigInt(0));
      let signedVoucher = signer.signVoucher(voucher, this.privateKeyBase64);
      ports.postLog(`DEBUG: Lotus.createSignedVoucher: returning signedVoucher = '${inspect(signedVoucher)}'`);
      return signedVoucher;
    } catch (error) {
      ports.postLog(`ERROR: Lotus.createSignedVoucher: error: ${error.message}`);
      return undefined
    }
  }

  /**
   * Creates a new payment channel using the local Client wallet as the "From", and
   * the specified "To" address.
   * @param  {string} to The "To" address on the payment channel
   * @return {number} Returns the new PCH's robust address, or undefined if an error occurred
   */
  async createPaymentChannel(to, amountAttoFil) {
    const fromAddr = this.wallet
    const fromKey = this.privateKeyBase64
    const toAddr = to

    ports.postLog(`DEBUG: Lotus.createPaymentChannel: [from:${fromAddr}, fromKey:${fromKey}, to:${toAddr}, amount:${amountAttoFil}]`);

    let nonce = await this.getNonce(fromAddr)
    ports.postLog(`DEBUG: Lotus.createPaymentChannel: nonce=${nonce}`);

    //
    // Generate the PCH create message
    //
    var signedCreateMessage;
    try {
      let create_pymtchan = signer.createPymtChanWithFee(fromAddr, toAddr, `${amountAttoFil}`, nonce, "10000000", "16251176117", "140625002"); // gas limit, fee cap, premium
      ports.postLog("DEBUG: Lotus.createPaymentChannel: create_pymtchan="+inspect(create_pymtchan))
      // TODO:  use gas esimator:
      //create_pymtchan = await filRPC.getGasEstimation(create_pymtchan)
      signedCreateMessage = JSON.parse(signer.transactionSignLotus(create_pymtchan, fromKey));
      ports.postLog("DEBUG: Lotus.createPaymentChannel: signedCreateMessage="+inspect(signedCreateMessage))
    } catch (error) {
      ports.postLog(`ERROR (Lotus.createPaymentChannel) error creating and signing txn: ${error.message}`);
      return undefined
    }

    //
    // MpoolPush the PCH create message
    //
    var msgCid = await this.mpoolPush(signedCreateMessage);
    //msgCid = msgCid.cid; // TODO:  add this line; msgCid should be a string not an object.
    ports.postLog(`msgCid = ${inspect(msgCid)}`);
    if (msgCid === undefined) {
      ports.postLog(`ERROR: Lotus.createPaymentChannel: fatal: pch create msgcid undefined`);
      return undefined
    }

    //
    // Wait for PCH creation message response
    //
    const waitCreateResponseData = await this.stateWaitMsg(msgCid);
    if (waitCreateResponseData===undefined) {
      ports.postLog(`ERROR: Lotus.createPaymentChannel: fatal: Filecoin.StateWaitMsg returned nothing`);
      return undefined;
    }
  	ports.postLog(`DEBUG: Lotus.createPaymentChannel: response.data.result: ${inspect(waitCreateResponseData.result)}`)
	  const PCH = waitCreateResponseData.result.ReturnDec.IDAddress
	  const PCHRobust = waitCreateResponseData.result.ReturnDec.RobustAddress
  	ports.postLog(`DEBUG: Lotus.createPaymentChannel: PCH Addresses = {id address:${PCH},robust:${PCHRobust}}`)

    const paymentChannel = PCHRobust;
    this.paymentChannelsInfo[paymentChannel] = {
      idAddr: PCH,
      robustAddr: PCHRobust,
      nextLane: 0,   // TODO:  remove if not used anywhere
      lanesNextNonce: {},  // TODO:  remove if not used anywhere
    };
    ports.postLog(`DEBUG: Lotus.createPaymentChannel: leaving => ${paymentChannel}`);
    return paymentChannel;
  }

  /**
   * Updates a payment channel with a specified signed voucher
   * @param  {string} pch The payment channel to update
   * @param  {string} toAddr The "To" address on the payment channel. This will be the signer of this message.
   * @param  {string} toPrivateKeyBase64 The "To" address private key
   * @param  {string} signedVoucher The voucher to update the channel with
   * @return {number} Returns the new PCH's robust address, or undefined if an error occurred
   */
  async updatePaymentChannel(pch, toAddr, toPrivateKeyBase64, signedVoucher) {
    ports.postLog(`DEBUG: Lotus.updatePaymentChannel:\n  pch=${pch}\n  toAddr=${toAddr}\n  toPrivateKeyBase64=${toPrivateKeyBase64}\n  signedVoucher=${signedVoucher}`);
    // TODO:  write me
  }

/*
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
*/

  async checkPaymentVoucherValid(signedVoucher, expectedAmountAttoFil, fromWalletAddr) {
    ports.postLog(`DEBUG: Lotus.checkPaymentVoucherValid: args = signedVoucher=${signedVoucher},expectedAmountAttoFil=${expectedAmountAttoFil},fromWalletAddr=${fromWalletAddr}`);
    return signer.verifyVoucherSignature(signedVoucher, fromWalletAddr);
  }

  closePaymentChannel(paymentChannel) {
    // TODO: actually close payment channel
    delete this.paymentChannelsInfo[paymentChannel];
  }

  // -------------------- check if used anywhere, then discard -----------------------------
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
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } else {
          throw error;
        }
      }
    }
  }

  async allocateLane(paymentChannel) {
    const lane = this.paymentChannelsInfo[paymentChannel].nextLane++;
    this.paymentChannelsInfo[paymentChannel].lanesNextNonce[lane] = 0;
  }
  // -------------------- end discard ----------------------------------------------

}

export default Lotus;
