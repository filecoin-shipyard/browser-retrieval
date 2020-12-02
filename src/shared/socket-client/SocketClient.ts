import pushable from 'it-pushable'
import { Datastore } from 'shared/Datastore'
import { dealStatuses } from 'shared/dealStatuses'
import { decodeCID } from 'shared/decodeCID'
import { Lotus } from 'shared/lotus-client/Lotus'
import { messageRequestTypes, messageResponseTypes, messages } from 'shared/messages'
import { Services } from 'shared/models/services'
import { sha256 } from 'shared/sha256'
import { appStore } from 'shared/store/appStore'
import socketIO from 'socket.io-client'

let socketClientInstance: SocketClient

interface Callbacks {
  handleCidReceived: (cid: string, size: number) => void
}

export default class SocketClient {
  datastore: Datastore

  handleCidReceived: (cid: string, size: number) => void

  socket: ReturnType<socketIO>

  maxResendAttempts: number

  lotus

  static async create(
    { datastore }: Services,

    { handleCidReceived }: Callbacks,
  ) {
    if (!socketClientInstance) {
      socketClientInstance = new SocketClient()

      socketClientInstance.datastore = datastore
      socketClientInstance.lotus = await Lotus.create()

      socketClientInstance.handleCidReceived = handleCidReceived

      socketClientInstance.maxResendAttempts = 3

      socketClientInstance._initializeSocketIO()
      socketClientInstance._addHandlers()
    }

    return socketClientInstance
  }

  connect() {
    this.socket.open()
  }

  disconnect() {
    this.socket.close()
  }

  /**
   * @param {{ cid: string; minerID: string }} query query params
   */
  query({ cid, minerID }) {
    const getQueryCIDMessage = messages.createGetQueryCID({ cid, minerID })
    this.socket.emit(getQueryCIDMessage.message, getQueryCIDMessage)
  }

  async buy({ cid, params, multiaddr }) {
    if (!cid) {
      console.warn('SocketClient.buy(): missing cid', cid)
    }

    if (!params) {
      console.warn('SocketClient.buy(): missing params', params)
    }

    if (!multiaddr) {
      console.warn('SocketClient.buy(): missing multiaddr', multiaddr)
    }

    try {
      const deal = this.createInboundDeal({ cid, params, multiaddr })

      if (!deal) {
        return
      }

      await this._sendFunds(params)

      this.setDealProps(params.clientToken, { status: dealStatuses.awaitingAcceptance })
    } catch (error) {
      appStore.logsStore.logError(`SocketClient._handleCidAvailability: error: ${error.message}`)
    }

    const { wallet } = appStore.optionsStore

    this.socket.emit(
      messageRequestTypes.fundsConfirmed,
      messages.createFundsSent({ clientToken: params.clientToken, paymentWallet: wallet }),
    )
  }

  // Private:

  _initializeSocketIO() {
    const { wsEndpoint } = appStore.settingsStore
    this.socket = socketIO(wsEndpoint, { autoConnect: false, transports: ['websocket'] })
  }

  _addHandlers() {
    this._handleCidAvailability()
    this._handleFundsConfirmed()
    this._handleChunk()
  }

  _handleCidAvailability() {
    this.socket.on(messageResponseTypes.cidAvailability, async (message) => {
      console.log(`Got ${messageResponseTypes.cidAvailability} message:`, message)

      if (!message.available) {
        if (!appStore.dealsStore.hasOngoingDeals()) {
          this.socket.disconnect()
        }

        appStore.logsStore.logError(`CID not available: ${message.cid}`)
        return
      }

      const params = {
        address: appStore.settingsStore.wsEndpoint,
        price: message.priceAttofil,
        size: message.approxSize,
        clientToken: message.clientToken,
        paymentWallet: message.paymentWallet,
      }

      appStore.offersStore.add(
        message.cid,
        [appStore.settingsStore.wsEndpoint].map((address) => ({
          address,
          ...params,
          params,
        })),
      )
    })
  }

  _handleFundsConfirmed() {
    this.socket.on(messageResponseTypes.fundsConfirmed, (message) => {
      console.log(messageResponseTypes.fundsConfirmed)
      console.log(message)

      // TODO: periodically send this message to check on status
      this.socket.emit(
        messageRequestTypes.queryRetrievalStatus,
        messages.createQueryRetrievalStatus({ cid: message.cid, clientToken: message.clientToken }),
      )
    })

    this.socket.on(messageResponseTypes.fundsConfirmedErrorInsufficientFunds, () => {
      // TODO: something
    })
    this.socket.on(messageResponseTypes.fundsConfirmedErrorPriceChanged, () => {
      // TODO: something
    })
  }

  _handleChunk() {
    this.socket.on(messageResponseTypes.chunk, async (message) => {
      console.log('got message from server: chunk')
      console.log('message', message)

      const deal = appStore.dealsStore.getInboundDeal(message.clientToken)

      // all chunks were received
      if (message.eof) {
        this.setDealProps(message.clientToken, {
          status: dealStatuses.finalizing,
        })

        deal.importerSink.end()

        this.handleCidReceived(message.cid, message.fullDataLenBytes)

        await this._closeDeal({ dealId: deal.id })

        return
      }

      const dataBuffer = Buffer.from(message.chunkData, 'base64')
      const validSha256 = message.chunkSha256 === sha256(dataBuffer)
      const validSize = dataBuffer.length === message.chunkLenBytes

      if (validSha256 && validSize) {
        this.socket.emit(
          messageRequestTypes.chunkReceived,
          messages.createChunkReceived({
            ...message,
          }),
        )

        // pushed data needs to be an array of bytes
        deal.importerSink.push([...(dataBuffer as any)])

        this.setDealProps(message.clientToken, {
          sizeReceived: deal.sizeReceived + message.chunkLenBytes,
          status: dealStatuses.ongoing,
        })
      } else {
        if (this.maxResendAttempts > 0) {
          this.maxResendAttempts--

          this.socket.emit(
            messageRequestTypes.chunkResend,
            messages.createChunkResend({
              ...message,
            }),
          )
        } else {
          // give up after N attempts
          this.socket.disconnect()
        }
      }
    })
  }

  createInboundDeal({ cid, params, multiaddr }) {
    const decoded = decodeCID(cid)

    appStore.logsStore.logDebug(
      `SocketClient.query: cidVersion ${decoded.version} hashAlg ${decoded.hashAlg} rawLeaves ${decoded.rawLeaves} format ${decoded.format}`,
    )

    const importOptions = {
      cidVersion: decoded.version,
      hashAlg: decoded.hashAlg,
      rawLeaves: true,
      maxChunkSize: 1048576,
      maxChildrenPerNode: 1024,
    }

    const importerSink = pushable()

    const dealId = params.clientToken

    appStore.dealsStore.createInboundDeal({
      id: dealId,
      status: dealStatuses.new,
      customStatus: undefined,
      cid,
      params,
      peerMultiaddr: multiaddr,
      peerWallet: params.paymentWallet,
      sizeReceived: 0,
      sizePaid: 0,
      sink: pushable(),
      importerSink,
      importer: this.datastore.putContent(importerSink, importOptions),
      voucherNonce: 1,
    })

    return appStore.dealsStore.inboundDeals.find((d) => d.id === dealId)
  }

  setDealProps(dealId, props) {
    appStore.dealsStore.setInboundDealProps(dealId, props)
  }

  async _sendFunds(params) {
    appStore.logsStore.logDebug(`DEBUG: SocketClient._handleCidAvailability: creating Lotus instance`)

    appStore.logsStore.logDebug(
      `DEBUG: SocketClient._handleCidAvailability: sending ${params.price} attofil to ${params.paymentWallet}`,
    )
    await this.lotus.sendFunds(params.price, params.paymentWallet)
  }

  async _closeDeal({ dealId }) {
    appStore.logsStore.logDebug(`DEBUG: SocketClient.closeDeal: closing deal ${dealId}`)
    const deal = appStore.dealsStore.getInboundDeal(dealId)

    this.setDealProps(dealId, {
      customStatus: 'Done',
    })

    deal.sink.end()

    appStore.dealsStore.removeInboundDeal(dealId)

    await this.handleCidReceived(deal.cid, +deal.sizeReceived)
  }
}
