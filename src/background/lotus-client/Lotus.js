/* global BigInt */
import { Buffer } from 'buffer';
import * as signer from '@zondax/filecoin-signing-tools';  // TODO:  rename to signer to filecoin_signer
import onOptionsChanged from 'src/shared/onOptionsChanged';
import getOptions from 'src/shared/getOptions';
import ports from '../ports';
import inspect from 'browser-util-inspect';
import axios from 'axios'
// Required to workaround `Invalid asm.js: Unexpected token` error:
const importDagCBOR = () => {
  return require('ipld-dag-cbor');
}

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

  // TODO:  remove once filecoin-signing-tools PR #317 is merged new npm package is published
  // for testing filecoin_signer only
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
    ports.postLog(`DEBUG: entering Lotus.getNonce`);
    let headers = this.headers
    ports.postLog(`DEBUG: Lotus.getNonce:\n  addr=${addr}\n  this.headers=${inspect(headers)}\n  this.lotusEndpoint=${this.lotusEndpoint}`);
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
    ports.postLog(`DEBUG: leaving Lotus.getNonce (ret = ${nonce})`);
    //ports.postLog(`DEBUG: Lotus.getNonce => ${nonce}`);
		return nonce;
  }

  /**
   * Push a message into the mpool with Filecoin.MpoolPush
   * @param  {string} signedMessage A signed message to push into the mpool
   * @return {string} Returns the CID of the submitted message, or undefined if an error occurred
   */
  async mpoolPush(signedMessage) {
    ports.postLog(`DEBUG: entering Lotus.mpoolPush (signedMessage=${inspect(signedMessage)})`);
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
      ports.postLog(`DEBUG: Lotus.mpoolPush: response.data = ${inspect(response.data)}`);
      msgCid = response.data.result;
    } catch (error) {
      ports.postLog(`ERROR: Lotus.mpoolPush(): axios error: ${error.message}`);
      return undefined
    }
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
   * Wraps Filecoin.StateReadState by taking a PCH address and waiting for its state to be returned
   * @param  {string} pch The address of the payment chanel
   * @return {object} Returns the wait's response.data member, or undefined if an error occurred
   */
  async stateReadState(pch) {
    ports.postLog(`DEBUG: entering Lotus.stateReadState(pch='${pch}')`);
    ports.postLog(`INFO: begining StateReadState. This will take a while...`);
    let headers = this.headers
    var response;
    try {
      response = await axios.post(this.lotusEndpoint, {
        jsonrpc: "2.0",
        method: "Filecoin.StateReadState",
        id: 1,
        params: [pch, null]
      }, { headers });
    } catch (error) {
      ports.postLog(`ERROR: Lotus.stateReadState(): axios error: ${error.message}`);
      return undefined
    }
		//ports.postLog(`response.data = ${inspect(response.data)}`);
    ports.postLog(`--------------------------------------------------------------------------------------------------`);
    ports.postLog(`DEBUG: Lotus.stateReadState => ${inspect(response.data)} ; ${inspect(response.data.result)}`);
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
      ports.postLog(`DEBUG: Lotus.createSignedVoucher: args: pch='${pch}', amountAttoFil='${amountAttoFil}', nonce='${nonce}'`);
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

    ports.postLog(`DEBUG: Lotus.createPaymentChannel: [from:${fromAddr}, fromKey:*******************, to:${toAddr}, amount:${amountAttoFil}]`);

    let nonce = await this.getNonce(fromAddr);
    ports.postLog(`DEBUG: Lotus.createPaymentChannel: nonce=${nonce}`);

    //
    // Generate the PCH create message
    //
    var signedCreateMessage; // TODO:  does this need to be declared out here?
    try {
      let create_pymtchan = signer.createPymtChanWithFee(fromAddr, toAddr, `${amountAttoFil}`, nonce, "10000000", "16251176117", "140625002"); // gas limit, fee cap, premium
      ports.postLog("DEBUG: Lotus.createPaymentChannel: create_pymtchan="+inspect(create_pymtchan))
      // TODO:  use gas esimator:
      //create_pymtchan = await filRPC.getGasEstimation(create_pymtchan)
      signedCreateMessage = JSON.parse(signer.transactionSignLotus(create_pymtchan, fromKey));
      ports.postLog("DEBUG: Lotus.createPaymentChannel: signedCreateMessage="+inspect(signedCreateMessage))
    } catch (error) {
      ports.postLog(`ERROR: Lotus.createPaymentChannel: error creating and signing txn: ${error.message}`);
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
   * Updates a payment channel with a specified signed voucher.  This is called by Provider.
   * @param  {string} pch The payment channel to update
   * TODO: DELETE @param  {string} toAddr The "To" address on the payment channel. This will be the signer of this message.
   * TODO: DELETE @param  {string} toPrivateKeyBase64 The "To" address private key
   * @param  {string} signedVoucher The voucher to update the channel with
   * @return {boolean} Returns true if update succeeds
   */
  async updatePaymentChannel(pch, signedVoucher) {
    const toAddr = this.wallet;
    const toPrivateKeyBase64 = this.privateKeyBase64;
    ports.postLog(`DEBUG: Lotus.updatePaymentChannel:\n  pch=${pch}\n  toAddr=${toAddr}\n  toPrivateKeyBase64=*****************\n  signedVoucher=${signedVoucher}`);

    //
    // Generate update PCH message
    //
    var signedUpdateMessage;  // TODO:  does this need to be declared out here?
    try {
      let nonce = await this.getNonce(toAddr);
      let updatePaychMessage = signer.updatePymtChanWithFee(pch, toAddr, signedVoucher, nonce, "10000000", "16251176117", "140625002") // gas limit, fee cap, premium
      //ports.postLog(`DEBUG: Lotus.updatePaymentChannel:  updatePaychMessage=${inspect(updatePaychMessage)}`);
      signedUpdateMessage = JSON.parse(signer.transactionSignLotus(updatePaychMessage, toPrivateKeyBase64));
    } catch (error) {
      ports.postLog(`ERROR: Lotus.updatePaymentChannel: error generating Update message: ${error.message}`);
      return false
    }

    //
    // Mpoolpush signed message
    //
    var msgCid = await this.mpoolPush(signedUpdateMessage);
    //msgCid = msgCid.cid; // TODO:  add this line; msgCid should be a string not an object.
    ports.postLog(`DEBUG: Lotus.updatePaymentChannel:  msgCid = ${inspect(msgCid)}`);
    if (msgCid === undefined) {
      ports.postLog(`ERROR: Lotus.updatePaymentChannel: fatal: pch update msgcid undefined`);
      return false
    }

    //
    // Wait for PCH update response
    //
    const waitUpdateResponseData = await this.stateWaitMsg(msgCid);
    if (waitUpdateResponseData===undefined) {
      ports.postLog(`ERROR: Lotus.updatePaymentChannel: fatal: Filecoin.StateWaitMsg returned nothing`);
      return false;
    }
  	ports.postLog(`DEBUG: Lotus.updatePaymentChannel: response.data.result: ${inspect(waitUpdateResponseData.result)}`);

    //
    // Wait for new PCH state
    //
    const waitReadPchStateResponseData = await this.stateReadState(pch);
    if (waitReadPchStateResponseData===undefined) {
      ports.postLog(`ERROR: Lotus.updatePaymentChannel: fatal: Filecoin.StateReadState returned nothing`);
      return false;
    }
  	ports.postLog(`DEBUG: Lotus.updatePaymentChannel: response.data.result: ${inspect(waitReadPchStateResponseData.result)}`);

    // TODO:  once we have a function to extract the value field from a signed voucher, check here
    // that it matches
    return true;
  }

  /**
   * Settles a payment channel.  This is called by Provider.
   * @param  {string} pch The payment channel to settle
   */
  async settlePaymentChannel(pch) {
    const toAddr = this.wallet;
    const toPrivateKeyBase64 = this.privateKeyBase64;
    ports.postLog(`DEBUG: Lotus.settlePaymentChannel:\n  pch=${pch}\n  toAddr=${toAddr}\n  toPrivateKeyBase64=**************`);

    //
    // Generate Settle PCH message
    //
    var signedSettleMessage;   // TODO:  does this need to be declared out here?
    try {
      let nonce = await this.getNonce(toAddr);
      let settlePaychMessage = signer.settlePymtChanWithFee(pch, toAddr, nonce, "10000000", "16251176117", "140625002") // gas limit, fee cap, premium)
      signedSettleMessage = JSON.parse(signer.transactionSignLotus(settlePaychMessage, toPrivateKeyBase64));
    } catch (error) {
      ports.postLog(`ERROR: Lotus.settlePaymentChannel: error generating Settle msg: ${error.message}`);
      return;
    }

    //
    // Mpoolpush signed message
    //
    var msgCid = await this.mpoolPush(signedSettleMessage);
    //msgCid = msgCid.cid; // TODO:  add this line; msgCid should be a string not an object.
    ports.postLog(`DEBUG: Lotus.settlePaymentChannel:  msgCid = ${inspect(msgCid)}`);
    if (msgCid === undefined) {
      ports.postLog(`ERROR: Lotus.settlePaymentChannel: fatal: pch Settle msgcid undefined`);
      return;
    }

    //
    // Wait for PCH Settle response
    //
    const waitSettleResponseData = await this.stateWaitMsg(msgCid);
    if (waitSettleResponseData===undefined) {
      ports.postLog(`ERROR: Lotus.settlePaymentChannel: fatal: Filecoin.StateWaitMsg returned nothing`);
      return;
    }
  	ports.postLog(`DEBUG: Lotus.settlePaymentChannel: response.data.result: ${inspect(waitSettleResponseData.result)}`);

    //
    // Wait for new PCH state
    //
    const waitReadPchStateResponseData = await this.stateReadState(pch);
    if (waitReadPchStateResponseData===undefined) {
      ports.postLog(`ERROR: Lotus.settlePaymentChannel: fatal: Filecoin.StateReadState returned nothing`);
      return;
    }
  	ports.postLog(`DEBUG: leaving Lotus.settlePaymentChannel => response.data.result: ${inspect(waitReadPchStateResponseData.result)}`);
  }

  /**
   * Collects a payment channel.  This is normally called by Provider.
   * @param  {string} pch The payment channel to settle
   */
  async collectPaymentChannel(pch) {
    const toAddr = this.wallet;
    const toPrivateKeyBase64 = this.privateKeyBase64;
    ports.postLog(`DEBUG: Lotus.collectPaymentChannel:\n  pch=${pch}\n  toAddr=${toAddr}\n  toPrivateKeyBase64=*************`);

    //
    // Generate Collect PCH message
    //
    var signedCollectMessage;   // TODO:  does this need to be declared out here?
    try {
      let nonce = await this.getNonce(toAddr);
      let collectPaychMessage = signer.collectPymtChanWithFee(pch, toAddr, nonce, "10000000", "16251176117", "140625002") // gas limit, fee cap, premium
      signedCollectMessage = JSON.parse(signer.transactionSignLotus(collectPaychMessage, toPrivateKeyBase64));
    } catch (error) {
      ports.postLog(`ERROR: Lotus.collectPaymentChannel: error generating Collect msg: ${error.message}`);
      return;
    }

    //
    // Mpoolpush signed message
    //
    var msgCid = await this.mpoolPush(signedCollectMessage);
    //msgCid = msgCid.cid; // TODO:  add this line; msgCid should be a string not an object.
    ports.postLog(`DEBUG: Lotus.collectPaymentChannel:  msgCid = ${inspect(msgCid)}`);
    if (msgCid === undefined) {
      ports.postLog(`ERROR: Lotus.collectPaymentChannel: fatal: pch Collect msgcid undefined`);
      return;
    }

    //
    // Wait for PCH Collect response
    //
    const waitCollectResponseData = await this.stateWaitMsg(msgCid);
    if (waitCollectResponseData===undefined) {
      ports.postLog(`ERROR: Lotus.collectPaymentChannel: fatal: Filecoin.StateWaitMsg returned nothing`);
      return;
    }
  	ports.postLog(`DEBUG: Lotus.collectPaymentChannel: response.data.result: ${inspect(waitCollectResponseData.result)}`);

    //
    // Wait for new PCH state
    //
    const waitReadPchStateResponseData = await this.stateReadState(pch);
    if (waitReadPchStateResponseData===undefined) {
      ports.postLog(`ERROR: Lotus.collectPaymentChannel: fatal: Filecoin.StateReadState returned nothing`);
      return;
    }
  	ports.postLog(`DEBUG: Lotus.collectPaymentChannel: response.data.result: ${inspect(waitReadPchStateResponseData.result)}`);
  }

  async checkPaymentVoucherValid(signedVoucher, expectedAmountAttoFil, fromWalletAddr) {
    ports.postLog(`DEBUG: Lotus.checkPaymentVoucherValid: args = signedVoucher=${signedVoucher},expectedAmountAttoFil=${expectedAmountAttoFil},fromWalletAddr=${fromWalletAddr}`);
    return signer.verifyVoucherSignature(signedVoucher, fromWalletAddr);
  }

  closePaymentChannel(paymentChannel) {
    // TODO: actually close payment channel
    delete this.paymentChannelsInfo[paymentChannel];
  }

  decodeSignedVoucher(signedVoucher) {
    const buffer = Buffer.from(signedVoucher, 'base64');
    const decoded = importDagCBOR.util.deserialize(buffer);

    if (decoded.length !== 11) {
      return  'Deserialize Buffer does not have correct length';
    }

    return {
      channelAddr: decoded[0].toString('hex'),
      timeLockMin: decoded[1],
      timeLockMax: decoded[2],
      secretPreimage: decoded[3].toString('hex'),
      extra: decoded[4],
      lane: decoded[5],
      nonce: decoded[6],
      amount: decoded[7].toString(),
      minSettleHeight: decoded[8],
      merges: decoded[9],
      signature: decoded[10].toString('hex')
    }
  }

  /**
   * Sends funds to a wallet address from this.wallet.
   * @param   {number} amountAttoFil How many attoFil to send.
   * @param   {string} toWallet Address of "To" (destination) wallet.
   * @returns {boolean} True if Send message was mined successfully.
   */
  async sendFunds(amountAttoFil, toWallet) {
    // To test this function, but this block of code Node.query (above first line) and query any CID.
    // Watch the Log and your test wallet balances before and after.  The amount is 0.01 FIL.
    // 
    //        // TEMP - DO NOT MERGE
    //        ports.postLog(`DEBUG: ----------- Lotus.sendFunds Test -------------- `);
    //        await this.lotus.sendFunds(10000000000000000,"f1d4jcvewwyiuepgccm4k5ng5lqhobj77eplj33zy");
    //        ports.postLog(`DEBUG: ----------- Lotus.sendFunds End -------------- `);
    //        // END - DO NOT MERGE
    //
    ports.postLog(`DEBUG: lotus.sendFunds(): sending ${amountAttoFil} to ${toWallet}`);

    try {
      //
      // Get nonce
      //
      let nonce = await this.getNonce(this.wallet);
      //nonce = (nonce.result==undefined) ? nonce : nonce.result;
      ports.postLog(`DEBUG: lotus.sendFunds(): nonce: ${nonce}`);

      //
      //  Sign transaction
      //
      const unsignedMessage = {
        "To": toWallet,
        "From": this.wallet,
        "Nonce": nonce,
        "Value": `${amountAttoFil}`,
        "Method": 0,
        "Params": "",
        "GasLimit": 10000000,        // TODO: use gas estimator
        "GasFeeCap": "16251176117",  // TODO: use gas estimator
        "GasPremium": "140625002",   // TODO: use gas estimator
      };
      let unsignedMessageJson = JSON.stringify(unsignedMessage, 0, 4);
      ports.postLog(`DEBUG: lotus.sendFunds(): unsignedMessageJson = ${unsignedMessageJson}`);

      let signedMessage = JSON.parse(signer.transactionSignLotus(unsignedMessage,this.privateKeyBase64));
      ports.postLog(`DEBUG: lotus.sendFunds(): signedMessage = ${inspect(signedMessage)}`);

      //
      // Mpoolpush signed Send message
      //
      var msgCid = await this.mpoolPush(signedMessage);
      //msgCid = msgCid.cid; // TODO:  add this line; msgCid should be a string not an object.
      ports.postLog(`DEBUG: Lotus.sendFunds:  msgCid = ${inspect(msgCid)}`);
      if (msgCid === undefined) {
        ports.postLog(`ERROR: Lotus.sendFunds: fatal: send funds MPoolPush response was 'msgCid=${msgCid}'`);
        return false;
      }

      //
      // Wait for Send message to be mined
      //
      const waitSendResponse = await this.stateWaitMsg(msgCid);
      if (waitSendResponse === undefined) {
        ports.postLog(`ERROR: Lotus.sendFunds: fatal: Filecoin.StateWaitMsg returned undefined`);
        return false;
      }
      ports.postLog(`DEBUG: Lotus.sendFunds: response.data: ${inspect(waitSendResponse)}`);

      //
      // Verify message receipt
      //
      const sendMsgResult = waitSendResponse.result;
      //ports.postLog(`DEBUG: Lotus.sendFunds: sendMsgResult=${inspect(sendMsgResult)}`);
      const sendMsgReceipt = sendMsgResult.Receipt;
      //ports.postLog(`DEBUG: Lotus.sendFunds: sendMsgReceipt=${inspect(sendMsgReceipt)}`);
      //ports.postLog(`DEBUG: Lotus.sendFunds: receipt components:\n  { ExitCode: '${sendMsgReceipt.ExitCode}', Return: '${sendMsgReceipt.Return}', GasUsed: '${sendMsgReceipt.GasUsed}' }`);
      if (sendMsgReceipt.ExitCode===0) {
        ports.postLog(`DEBUG: Lotus.sendFunds: receipt indicates no errors ==> returning true`);
        return true;
      } else {
        ports.postLog(`ERROR: Lotus.sendFunds: failed with ExitCode=${sendMsgReceipt.ExitCode}, Return: '${sendMsgReceipt.Return}' ==> returning false`);
        return false;
      }

    } catch (error) {
      ports.postLog(`ERROR: lotus.sendFunds(): caught exception: ${inspect(error)}`);
      return false;
    }
  }
}

export default Lotus;
