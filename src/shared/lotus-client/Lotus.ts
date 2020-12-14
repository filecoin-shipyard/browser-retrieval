import axios from 'axios'
import inspect from 'browser-util-inspect'
import { Buffer } from 'buffer'
import { appStore } from 'shared/store/appStore'
import BigNumber from 'bignumber.js';

// Required to workaround `Invalid asm.js: Unexpected token` error:
const importDagCBOR = () => {
  return require('ipld-dag-cbor') as any
}

let lotusIntance: Lotus

const gasEstimation = {
  gaslimit: '10000000',
  gasfeecap: '16251176117',
  gaspremium: '140625002',
}

const minimumBalance = 0.2;

const useDefaultGas = false

export class Lotus {
  signer

  id = 0

  paymentChannelsInfo = {}

  ports
  lotusEndpoint

  static async create() {
    if (!lotusIntance) {
      lotusIntance = new Lotus()

      lotusIntance.lotusEndpoint = appStore.settingsStore.lotusEndpoint

      await lotusIntance.initialize()

      const signer = await import('@zondax/filecoin-signing-tools')
      lotusIntance.signer = signer
    }

    return lotusIntance
  }

  async initialize() {}

  /**
   * Get the gas estimation for a payment channel
   * @param  {string} message Payment channel
   * @return {string} Returns the gas estimation, or undefined if an error occurred
   */
  async getGasEstimation(message) {
    appStore.logsStore.logDebug(`entering Lotus.gesGasEstimation`)
    const { headers, lotusEndpoint } = this.getAndParseOptions()

    if (!useDefaultGas) {
      appStore.logsStore.logDebug(
        `Lotus.gesGasEstimation:\n  message=${inspect(message)}\n  this.headers=${inspect(
          headers,
        )}\n  this.lotusEndpoint=${this.lotusEndpoint}`,
      )

      try {
        const response = await axios.post(
          lotusEndpoint,
          {
            jsonrpc: '2.0',
            method: 'Filecoin.GasEstimateMessageGas',
            id: 1,
            params: [message, null, null],
          },
          { headers },
        )

        //appStore.logsStore.logDebug(`Lotus.gesGasEstimation response:\n ${inspect(response.data)}\n`);

        message.gaslimit = response.data.result.GasLimit * 2
        message.gasfeecap = response.data.result.GasFeeCap
        message.gaspremium = response.data.result.GasPremium

      } catch (error) {
        message.gaslimit = parseInt(gasEstimation.gaslimit) * 2
        message.gasfeecap = gasEstimation.gasfeecap
        message.gaspremium = gasEstimation.gaspremium
        appStore.logsStore.logError(`Lotus.gesGasEstimation(): axios error: ${error.message}\n`)
      }
    }
    appStore.logsStore.logDebug(`leaving Lotus.gasEstimation (returned message= ${inspect(message)})`)

    return message
  }

  /**
   * Get balance for an address
   * @param  {string} addr Wallet address like `f156e3l2vwd5wi5jwdrd6gdg4y7t2yknq6see7xbq`
   * @return {number} Returns the balance, or undefined if an error occurred
   */
  async getBalance(addr) {
    appStore.logsStore.logDebug(`entering Lotus.getBalance`);
    const { headers, lotusEndpoint } = this.getAndParseOptions()
    appStore.logsStore.logDebug(`Lotus.getBalance:\n  addr=${addr}\n  this.headers=${inspect(headers)}\n  this.lotusEndpoint=${lotusEndpoint}`);

    let response;
    try {
      response = await axios.post(lotusEndpoint, {
        jsonrpc: "2.0",
        method: "Filecoin.WalletBalance",
        id: 1,
        params: [addr]
      }, {headers});
    } catch (error) {
      appStore.logsStore.logError(`Lotus.getBalance(): axios error: ${error.message}`);
      return undefined
    }

    const balance = response.data.result;
    appStore.logsStore.logDebug(`leaving Lotus.getBalance (balance = ${balance})`);

    return balance;
  }

  /**
   * Sends funds to a wallet address from this.wallet.
   * @returns {boolean} True if current wallet balance is greater than minimum required to query Storage Miner.
   */
  async hasMinBalance() {
    const { wallet } = appStore.optionsStore

    let balance = await this.getBalance(wallet);
    let tenBN = new BigNumber(10);
    let balanceBN = new BigNumber(balance).dividedBy(tenBN.pow(18));
    let minimum = new BigNumber(minimumBalance);

    appStore.logsStore.logDebug(`lotus.hasMinBalance(): balanceBN ${balanceBN} minimum: ${minimum} compare: ${balanceBN.comparedTo(minimum) === 1}`);
    return balanceBN.comparedTo(minimum) === 1;
  }

  // TODO:  remove once filecoin-signing-tools PR #317 is merged new npm package is published
  // for testing filecoin_signer only
  async keyRecoverLogMsg() {
    // This is a dummy wallet with no funds. Recovered addr will be f156e3l2vwd5wi5jwdrd6gdg4y7t2yknq6see7xbq
    const privKey = 'ciiFbmF7F7mrVs5E/IT8TV63PdFPLrRs9R/Cc3vri2I='
    const recoveredPKey = this.signer.keyRecover(privKey, false)

    appStore.logsStore.logDebug(`Lotus.keyRecover: recovered='${recoveredPKey.address}' (=='...7xbq'?)`)
  }

  getAndParseOptions() {
    const { lotusEndpoint, lotusToken } = appStore.settingsStore
    const { wallet, privateKey } = appStore.optionsStore

    return {
      lotusEndpoint,
      lotusToken: lotusToken,
      wallet: wallet,
      privateKeyBase64: privateKey,
      headers: { Authorization: `Bearer ${lotusToken}` },
    }
  }

  /**
   * Get the next nonce for an address
   * @param  {string} addr Wallet address like `f156e3l2vwd5wi5jwdrd6gdg4y7t2yknq6see7xbq`
   * @return {number} Returns the next nonce, or undefined if an error occurred
   */
  async getNonce(addr: string) {
    appStore.logsStore.logDebug(`entering Lotus.getNonce`)
    const { headers, lotusEndpoint } = this.getAndParseOptions()

    appStore.logsStore.logDebug(
      `Lotus.getNonce:\n  addr=${addr}\n  this.headers=${inspect(headers)}\n  this.lotusEndpoint=${this.lotusEndpoint}`,
    )

    let response
    try {
      response = await axios.post(
        lotusEndpoint,
        {
          jsonrpc: '2.0',
          method: 'Filecoin.MpoolGetNonce',
          id: 1,
          params: [addr],
        },
        { headers },
      )
    } catch (error) {
      appStore.logsStore.logError(`Lotus.getNonce(): axios error: ${error.message}`)
      return undefined
    }
    // appStore.logsStore.log("response.data = "+inspect(response.data));
    const nonce = response.data.result
    appStore.logsStore.log(`Nonce (${addr}) = ${nonce}`)

    appStore.logsStore.logDebug(`leaving Lotus.getNonce (ret = ${nonce})`)
    appStore.logsStore.logDebug(`Lotus.getNonce => ${nonce}`)
    return nonce
  }

  /**
   * Push a message into the mpool with Filecoin.MpoolPush
   * @param  {string} signedMessage A signed message to push into the mpool
   * @return {string} Returns the CID of the submitted message, or undefined if an error occurred
   */
  async mpoolPush(signedMessage) {
    appStore.logsStore.logDebug(`entering Lotus.mpoolPush (signedMessage=${inspect(signedMessage)})`)
    const { headers, lotusEndpoint } = this.getAndParseOptions()
    let response
    let msgCid

    try {
      response = await axios.post(
        lotusEndpoint,
        {
          jsonrpc: '2.0',
          method: 'Filecoin.MpoolPush',
          id: 1,
          params: [signedMessage],
        },
        { headers },
      )
      appStore.logsStore.logDebug(`Lotus.mpoolPush: response.data = ${inspect(response.data)}`)

      if (response.data.error?.code > 0) {
        throw new Error(`Lotus.mpoolPush: ${response.data.error?.message}`)
      }

      msgCid = response.data.result
    } catch (error) {
      appStore.logsStore.logError(`Lotus.mpoolPush(): error: ${error.message}`, error)

      throw error
    }

    // TODO: handle error messages from API
    // ex: error: { code: 1, message: 'not enough funds (required: ... FIL, balance: ... FIL) ...' } }

    appStore.logsStore.logDebug(`leaving Lotus.mpoolPush => ${inspect(msgCid)}`)
    appStore.logsStore.logDebug(`Lotus.mpoolPush => ${inspect(msgCid)}`)

    return msgCid
  }

  /**
   * Wraps Filecoin.StateWaitMsg by taking a msg CID and waiting for its response.data
   * @param  {string} cid The message CID to wait for
   * @return {object} Returns the wait response.data member, or undefined if an error occurred
   */
  async stateWaitMsg(cid) {
    appStore.logsStore.logDebug(`entering Lotus.stateWaitMsg(cid='${cid}')`)
    appStore.logsStore.log(`begining StateWaitMsg. This will take a while...`)
    const { headers, lotusEndpoint } = this.getAndParseOptions()

    let response
    try {
      response = await axios.post(
        lotusEndpoint,
        {
          jsonrpc: '2.0',
          method: 'Filecoin.StateWaitMsg',
          id: 1,
          params: [cid, null],
        },
        { headers },
      )
    } catch (error) {
      appStore.logsStore.logError(`Lotus.stateWaitMsg(): axios error: ${error.message}`)
      return undefined
    }

    appStore.logsStore.logDebug(`Lotus.stateWaitMsg => ${inspect(response.data)} ; ${inspect(response.data.result)}`)

    return response.data
  }

  /**
   * Wraps Filecoin.StateReadState by taking a PCH address and waiting for its state to be returned
   * @param  {string} pch The address of the payment chanel
   * @return {object} Returns the wait's response.data member, or undefined if an error occurred
   */
  async stateReadState(pch) {
    appStore.logsStore.logDebug(`entering Lotus.stateReadState(pch='${pch}')`)
    appStore.logsStore.log(`begining StateReadState. This will take a while...`)
    const { headers, lotusEndpoint } = this.getAndParseOptions()
    let response
    try {
      response = await axios.post(
        lotusEndpoint,
        {
          jsonrpc: '2.0',
          method: 'Filecoin.StateReadState',
          id: 1,
          params: [pch, null],
        },
        { headers },
      )
    } catch (error) {
      appStore.logsStore.logError(`Lotus.stateReadState(): axios error: ${error.message}`)
      return undefined
    }

    appStore.logsStore.log(
      `DEBUG: Lotus.stateReadState => ${inspect(response.data)} ; ${inspect(response.data.result)}`,
    )

    return response.data
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
      const { privateKeyBase64 } = this.getAndParseOptions()
      appStore.logsStore.logDebug(
        `Lotus.createSignedVoucher: args: pch='${pch}', amountAttoFil='${amountAttoFil}', nonce='${nonce}'`,
      )
      let voucher = this.signer.createVoucher(
        pch,
        BigInt(0),
        BigInt(0),
        `${amountAttoFil}`,
        BigInt(0),
        BigInt(nonce),
        BigInt(0),
      )
      let signedVoucher = this.signer.signVoucher(voucher, privateKeyBase64)
      appStore.logsStore.logDebug(`Lotus.createSignedVoucher: returning signedVoucher = '${inspect(signedVoucher)}'`)
      return signedVoucher
    } catch (error) {
      appStore.logsStore.logError(`Lotus.createSignedVoucher: error: ${error.message}`)
      return undefined
    }
  }

  /**
   * Generate the PCH create message
   */
  async createSignedMessagePaymentChannel({ fromKey, fromAddr, toAddr, amountAttoFil, nonce }) {
    let signedCreateMessage

    try {
      let createPaychDefault = this.signer.createPymtChanWithFee(
        fromAddr,
        toAddr,
        `${amountAttoFil}`,
        nonce,
        gasEstimation.gaslimit,
        gasEstimation.gasfeecap,
        gasEstimation.gaspremium,
      )

      let createPaych = await this.getGasEstimation(createPaychDefault)
      signedCreateMessage = JSON.parse(this.signer.transactionSignLotus(createPaych, fromKey))
      appStore.logsStore.logDebug('Lotus.createPaymentChannel: signedCreateMessage=' + inspect(signedCreateMessage))
    } catch (error) {
      appStore.logsStore.logError(`Lotus.createPaymentChannel: error creating and signing txn: ${error.message}`)

      return undefined
    }

    return signedCreateMessage
  }

  /**
   * Creates a new payment channel using the local Client wallet as the "From", and
   * the specified "To" address.
   * @param  {string} to The "To" address on the payment channel
   * @return {number} Returns the new PCH's robust address, or undefined if an error occurred
   */
  async createPaymentChannel(to, amountAttoFil) {
    const { wallet, privateKeyBase64 } = this.getAndParseOptions()

    const fromAddr = wallet
    const fromKey = privateKeyBase64
    const toAddr = to

    appStore.logsStore.logDebug(
      `Lotus.createPaymentChannel: [from:${fromAddr}, fromKey:*******************, to:${toAddr}, amount:${amountAttoFil}]`,
    )

    let nonce = await this.getNonce(fromAddr)
    appStore.logsStore.logDebug(`Lotus.createPaymentChannel: nonce=${nonce}`)

    // Generate the PCH create message
    const signedCreateMessage = await this.createSignedMessagePaymentChannel({
      amountAttoFil,
      fromAddr,
      fromKey,
      nonce,
      toAddr,
    })

    if (!signedCreateMessage) {
      return undefined
    }

    //
    // MpoolPush the PCH create message
    //
    const msgCid = await this.mpoolPush(signedCreateMessage)
    //msgCid = msgCid.cid; // TODO:  add this line; msgCid should be a string not an object.
    appStore.logsStore.log(`msgCid = ${inspect(msgCid)}`)
    if (!msgCid) {
      appStore.logsStore.logError(`Lotus.createPaymentChannel: fatal: pch create msgcid undefined`)
      return undefined
    }

    //
    // Wait for PCH creation message response
    //
    const waitCreateResponseData = await this.stateWaitMsg(msgCid)
    if (!waitCreateResponseData) {
      appStore.logsStore.logError(`Lotus.createPaymentChannel: fatal: Filecoin.StateWaitMsg returned nothing`)

      return undefined
    }

    appStore.logsStore.logDebug(
      `Lotus.createPaymentChannel: response.data.result: ${inspect(waitCreateResponseData.result)}`,
    )

    if (!waitCreateResponseData?.result?.ReturnDec) {
      appStore.logsStore.logError('Lotus.createPaymentChannel() ReturnDec is null')
      throw new Error('ReturnDec is null')
    }

    const PCH = waitCreateResponseData.result.ReturnDec.IDAddress
    const PCHRobust = waitCreateResponseData.result.ReturnDec.RobustAddress
    appStore.logsStore.logDebug(`Lotus.createPaymentChannel: PCH Addresses = {id address:${PCH},robust:${PCHRobust}}`)

    const paymentChannel = PCHRobust
    this.paymentChannelsInfo[paymentChannel] = {
      idAddr: PCH,
      robustAddr: PCHRobust,
      nextLane: 0, // TODO:  remove if not used anywhere
      lanesNextNonce: {}, // TODO:  remove if not used anywhere
    }
    appStore.logsStore.logDebug(`Lotus.createPaymentChannel: leaving => ${paymentChannel}`)

    return paymentChannel
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
    const { wallet, privateKeyBase64 } = this.getAndParseOptions()

    const toAddr = wallet
    const toPrivateKeyBase64 = privateKeyBase64
    appStore.logsStore.log(
      `DEBUG: Lotus.updatePaymentChannel:\n  pch=${pch}\n  toAddr=${toAddr}\n  toPrivateKeyBase64=*****************\n  signedVoucher=${signedVoucher}`,
    )

    //
    // Generate update PCH message
    //
    let signedUpdateMessage
    try {
      let nonce = await this.getNonce(toAddr)
      let updatePaychMessageDefault = this.signer.updatePymtChanWithFee(
        pch,
        toAddr,
        signedVoucher,
        nonce,
        gasEstimation.gaslimit,
        gasEstimation.gasfeecap,
        gasEstimation.gaspremium,
      )

      let updatePaychMessage = await this.getGasEstimation(updatePaychMessageDefault)
      signedUpdateMessage = JSON.parse(this.signer.transactionSignLotus(updatePaychMessage, toPrivateKeyBase64))
    } catch (error) {
      appStore.logsStore.logError(`Lotus.updatePaymentChannel: error generating Update message: ${error.message}`)
      return false
    }

    //
    // Mpoolpush signed message
    //
    let msgCid = await this.mpoolPush(signedUpdateMessage)
    //msgCid = msgCid.cid; // TODO:  add this line; msgCid should be a string not an object.
    appStore.logsStore.logDebug(`Lotus.updatePaymentChannel:  msgCid = ${inspect(msgCid)}`)
    if (!msgCid) {
      appStore.logsStore.logError(`Lotus.updatePaymentChannel: fatal: pch update msgcid undefined`)
      return false
    }

    //
    // Wait for PCH update response
    //
    const waitUpdateResponseData = await this.stateWaitMsg(msgCid)
    if (!waitUpdateResponseData) {
      appStore.logsStore.logError(`Lotus.updatePaymentChannel: fatal: Filecoin.StateWaitMsg returned nothing`)
      return false
    }
    appStore.logsStore.log(
      `DEBUG: Lotus.updatePaymentChannel: response.data.result: ${inspect(waitUpdateResponseData.result)}`,
    )

    //
    // Wait for new PCH state
    //
    const waitReadPchStateResponseData = await this.stateReadState(pch)
    if (!waitReadPchStateResponseData) {
      appStore.logsStore.logError(`Lotus.updatePaymentChannel: fatal: Filecoin.StateReadState returned nothing`)
      return false
    }
    appStore.logsStore.logDebug(
      `Lotus.updatePaymentChannel: response.data.result: ${inspect(waitReadPchStateResponseData.result)}`,
    )

    // TODO:  once we have a function to extract the value field from a signed voucher, check here
    // that it matches
    return true
  }

  /**
   * Settles a payment channel.  This is called by Provider.
   * @param  {string} pch The payment channel to settle
   */
  async settlePaymentChannel(pch) {
    const { wallet, privateKeyBase64 } = this.getAndParseOptions()

    const toAddr = wallet
    const toPrivateKeyBase64 = privateKeyBase64
    appStore.logsStore.logDebug(
      `Lotus.settlePaymentChannel:\n  pch=${pch}\n  toAddr=${toAddr}\n  toPrivateKeyBase64=**************`,
    )

    //
    // Generate Settle PCH message
    //
    let signedSettleMessage // TODO:  does this need to be declared out here?
    try {
      let nonce = await this.getNonce(toAddr)
      let settlePaychMessageDefault = this.signer.settlePymtChanWithFee(
        pch,
        toAddr,
        nonce,
        gasEstimation.gaslimit,
        gasEstimation.gasfeecap,
        gasEstimation.gaspremium,
      )
      let settlePaychMessage = await this.getGasEstimation(settlePaychMessageDefault)
      signedSettleMessage = JSON.parse(this.signer.transactionSignLotus(settlePaychMessage, toPrivateKeyBase64))
    } catch (error) {
      appStore.logsStore.logError(`Lotus.settlePaymentChannel: error generating Settle msg: ${error.message}`)
      return
    }

    //
    // Mpoolpush signed message
    //
    const msgCid = await this.mpoolPush(signedSettleMessage)
    //msgCid = msgCid.cid; // TODO:  add this line; msgCid should be a string not an object.
    appStore.logsStore.logDebug(`Lotus.settlePaymentChannel:  msgCid = ${inspect(msgCid)}`)
    if (!msgCid) {
      appStore.logsStore.logError(`Lotus.settlePaymentChannel: fatal: pch Settle msgcid undefined`)
      return
    }

    //
    // Wait for PCH Settle response
    //
    const waitSettleResponseData = await this.stateWaitMsg(msgCid)
    if (!waitSettleResponseData) {
      appStore.logsStore.logError(`Lotus.settlePaymentChannel: fatal: Filecoin.StateWaitMsg returned nothing`)
      return
    }
    appStore.logsStore.log(
      `DEBUG: Lotus.settlePaymentChannel: response.data.result: ${inspect(waitSettleResponseData.result)}`,
    )

    //
    // Wait for new PCH state
    //
    const waitReadPchStateResponseData = await this.stateReadState(pch)
    if (!waitReadPchStateResponseData) {
      appStore.logsStore.logError(`Lotus.settlePaymentChannel: fatal: Filecoin.StateReadState returned nothing`)
      return
    }
    appStore.logsStore.log(
      `DEBUG: leaving Lotus.settlePaymentChannel => response.data.result: ${inspect(
        waitReadPchStateResponseData.result,
      )}`,
    )
  }

  /**
   * Collects a payment channel.  This is normally called by Provider.
   * @param  {string} pch The payment channel to settle
   */
  async collectPaymentChannel(pch) {
    const { wallet, privateKeyBase64 } = this.getAndParseOptions()

    const toAddr = wallet
    const toPrivateKeyBase64 = privateKeyBase64
    appStore.logsStore.log(
      `DEBUG: Lotus.collectPaymentChannel:\n  pch=${pch}\n  toAddr=${toAddr}\n  toPrivateKeyBase64=*************`,
    )

    //
    // Generate Collect PCH message
    //
    let signedCollectMessage // TODO:  does this need to be declared out here?
    try {
      let nonce = await this.getNonce(toAddr)
      let collectPaychMessageDefault = this.signer.collectPymtChanWithFee(
        pch,
        toAddr,
        nonce,
        gasEstimation.gaslimit,
        gasEstimation.gasfeecap,
        gasEstimation.gaspremium,
      )
      let collectPaychMessage = await this.getGasEstimation(collectPaychMessageDefault)
      signedCollectMessage = JSON.parse(this.signer.transactionSignLotus(collectPaychMessage, toPrivateKeyBase64))
    } catch (error) {
      appStore.logsStore.logError(`Lotus.collectPaymentChannel: error generating Collect msg: ${error.message}`)
      return
    }

    //
    // Mpoolpush signed message
    //
    const msgCid = await this.mpoolPush(signedCollectMessage)
    //msgCid = msgCid.cid; // TODO:  add this line; msgCid should be a string not an object.
    appStore.logsStore.logDebug(`Lotus.collectPaymentChannel:  msgCid = ${inspect(msgCid)}`)
    if (!msgCid) {
      appStore.logsStore.logError(`Lotus.collectPaymentChannel: fatal: pch Collect msgcid undefined`)
      return
    }

    //
    // Wait for PCH Collect response
    //
    const waitCollectResponseData = await this.stateWaitMsg(msgCid)
    if (!waitCollectResponseData) {
      appStore.logsStore.logError(`Lotus.collectPaymentChannel: fatal: Filecoin.StateWaitMsg returned nothing`)
      return
    }
    appStore.logsStore.logDebug(
      `Lotus.collectPaymentChannel: response.data.result: ${inspect(waitCollectResponseData.result)}`,
    )

    //
    // Wait for new PCH state
    //
    const waitReadPchStateResponseData = await this.stateReadState(pch)
    if (!waitReadPchStateResponseData) {
      appStore.logsStore.logError(`Lotus.collectPaymentChannel: fatal: Filecoin.StateReadState returned nothing`)
      return
    }
    appStore.logsStore.logDebug(
      `Lotus.collectPaymentChannel: response.data.result: ${inspect(waitReadPchStateResponseData.result)}`,
    )
  }

  async checkPaymentVoucherValid(signedVoucher, expectedAmountAttoFil, fromWalletAddr) {
    appStore.logsStore.logDebug(
      `Lotus.checkPaymentVoucherValid: args = signedVoucher=${signedVoucher},expectedAmountAttoFil=${expectedAmountAttoFil},fromWalletAddr=${fromWalletAddr}`,
    )
    return this.signer.verifyVoucherSignature(signedVoucher, fromWalletAddr)
  }

  closePaymentChannel(paymentChannel) {
    // TODO: actually close payment channel
    delete this.paymentChannelsInfo[paymentChannel]
  }

  decodeSignedVoucher(signedVoucher) {
    const buffer = Buffer.from(signedVoucher, 'base64')
    const decoded = importDagCBOR().util.deserialize(buffer)

    if (decoded.length !== 11) {
      return 'Deserialize Buffer does not have correct length'
    }

    return {
      channelAddr: decoded[0].toString('hex'),
      timeLockMin: decoded[1],
      timeLockMax: decoded[2],
      secretPreimage: decoded[3].toString('hex'),
      extra: decoded[4],
      lane: decoded[5],
      nonce: decoded[6],
      amount: parseInt(decoded[7].toString('hex'), 16),
      minSettleHeight: decoded[8],
      merges: decoded[9],
      signature: decoded[10].toString('hex'),
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
    appStore.logsStore.logDebug(`----------- Lotus.sendFunds Test -------------- `)
    //        await this.lotus.sendFunds(10000000000000000,"f1d4jcvewwyiuepgccm4k5ng5lqhobj77eplj33zy");
    appStore.logsStore.logDebug(`----------- Lotus.sendFunds End -------------- `)
    //        // END - DO NOT MERGE
    //
    appStore.logsStore.logDebug(`lotus.sendFunds(): sending ${amountAttoFil} to ${toWallet}`)

    try {
      const { wallet, privateKeyBase64 } = this.getAndParseOptions()

      //
      // Get nonce
      //
      let nonce = await this.getNonce(wallet)
      //nonce = (nonce.result==undefined) ? nonce : nonce.result;
      appStore.logsStore.logDebug(`lotus.sendFunds(): nonce: ${nonce}`)

      //
      //  Sign transaction
      //
      const unsignedMessageDefault = {
        to: toWallet,
        from: wallet,
        nonce: nonce,
        value: `${amountAttoFil}`,
        method: 0,
        params: '',
        gaslimit: parseInt(gasEstimation.gaslimit),
        gasfeecap: gasEstimation.gasfeecap,
        gaspremium: gasEstimation.gaspremium,
      }

      let unsignedMessage = await this.getGasEstimation(unsignedMessageDefault)
      let signedMessage = JSON.parse(this.signer.transactionSignLotus(unsignedMessage, privateKeyBase64))
      appStore.logsStore.logDebug(`Lotus.sendFunds: signedMessage = ${inspect(signedMessage)}`)

      //
      // Mpoolpush signed Send message
      //
      const msgCid = await this.mpoolPush(signedMessage)
      //msgCid = msgCid.cid; // TODO:  add this line; msgCid should be a string not an object.
      appStore.logsStore.logDebug(`Lotus.sendFunds:  msgCid = ${inspect(msgCid)}`)
      if (!msgCid) {
        appStore.logsStore.logError(`Lotus.sendFunds: fatal: send funds MPoolPush response was 'msgCid=${msgCid}'`)

        return false
      }

      //
      // Wait for Send message to be mined
      //
      const waitSendResponse = await this.stateWaitMsg(msgCid)
      if (!waitSendResponse) {
        appStore.logsStore.logError(`Lotus.sendFunds: fatal: Filecoin.StateWaitMsg returned undefined`)

        return false
      }
      appStore.logsStore.logDebug(`Lotus.sendFunds: response.data: ${inspect(waitSendResponse)}`)

      //
      // Verify message receipt
      //
      const sendMsgResult = waitSendResponse.result
      appStore.logsStore.logDebug(`Lotus.sendFunds: sendMsgResult=${inspect(sendMsgResult)}`)
      const sendMsgReceipt = sendMsgResult.Receipt

      appStore.logsStore.logDebug(`Lotus.sendFunds: sendMsgReceipt=${inspect(sendMsgReceipt)}`)
      appStore.logsStore.logDebug(
        `Lotus.sendFunds: receipt components:\n  { ExitCode: '${sendMsgReceipt.ExitCode}', Return: '${sendMsgReceipt.Return}', GasUsed: '${sendMsgReceipt.GasUsed}' }`,
      )

      if (sendMsgReceipt.ExitCode === 0) {
        appStore.logsStore.logDebug(`Lotus.sendFunds: receipt indicates no errors ==> returning true`)

        return true
      }

      appStore.logsStore.log(
        `ERROR: Lotus.sendFunds: failed with ExitCode=${sendMsgReceipt.ExitCode}, Return: '${sendMsgReceipt.Return}' ==> returning false`,
      )

      return false
    } catch (error) {
      appStore.logsStore.logError(`lotus.sendFunds(): caught exception: ${inspect(error)}`)

      return false
    }
  }
}
