import inspect from 'browser-util-inspect'
import Libp2p from 'libp2p'
import Gossipsub from 'libp2p-gossipsub'
import Mplex from 'libp2p-mplex'
import { NOISE } from 'libp2p-noise'
import Secio from 'libp2p-secio'
import WebrtcStar from 'libp2p-webrtc-star'
import Websockets from 'libp2p-websockets'
import PeerId from 'peer-id'
import { Datastore } from 'shared/Datastore'
import { messageTypes } from 'shared/messageTypes'
import { appStore } from 'shared/store/appStore'
import { topics } from 'shared/topics'

import { downloadBrowser } from './download-browser'
import { Lotus } from './lotus-client/Lotus'
import { Client } from './retrieval-market/Client'
import { Provider } from './retrieval-market/Provider'
import SocketClient from './socket-client/SocketClient'

let nodeInstance: Node

export class Node {
  static async create(force = false) {
    if (!nodeInstance || force) {
      nodeInstance = new Node()

      await nodeInstance.initialize()
    }

    return nodeInstance
  }

  //
  lotus: Lotus
  datastore: Datastore
  provider: Provider

  //
  peerId: PeerId
  id: string
  multiaddrs: any

  // Run every 10 minutes
  automationLoopTime = 600000
  lastIntervalId = 0

  connectedPeers = new Set()
  queriedCids = new Set()

  /** Libp2p Node */
  node

  /** Retrieval market client */
  client: Client
  socketClient: SocketClient

  async initialize() {
    const { rendezvousIp, rendezvousPort } = appStore.settingsStore

    const rendezvousProtocol = /^\d+\.\d+\.\d+\.\d+$/.test(rendezvousIp) ? 'ip4' : 'dns4'
    const rendezvousWsProtocol = `${rendezvousPort}` === '443' ? 'wss' : 'ws'
    const rendezvousAddress = `/${rendezvousProtocol}/${rendezvousIp}/tcp/${rendezvousPort}/${rendezvousWsProtocol}/p2p-webrtc-star`

    appStore.logsStore.logDebug('Node.initialize(): creating peer id')
    this.peerId = await PeerId.create()
    this.id = this.peerId.toB58String()
    appStore.logsStore.logDebug(`Node.initialize(): our peer id is ${this.id}`)

    appStore.logsStore.logDebug('Node.initialize(): creating libp2p node')
    this.node = await Libp2p.create({
      peerId: this.peerId,
      modules: {
        transport: [Websockets, WebrtcStar],
        streamMuxer: [Mplex],
        connEncryption: [NOISE, Secio],
        pubsub: Gossipsub,
      },
      addresses: {
        listen: [rendezvousAddress],
      },
    })

    appStore.logsStore.logDebug('Node.initialize(): creating lotus client')
    this.lotus = await Lotus.create()

    appStore.logsStore.logDebug('Node.initialize(): creating datastore')

    this.datastore = await Datastore.create()

    appStore.logsStore.logDebug('creating retrieval market client')
    // retrieval-market client
    this.client = await Client.create(
      {
        node: this.node,
        datastore: this.datastore,
        lotus: this.lotus,
        appStore: appStore,
      },
      { cidReceivedCallback: this.handleCidReceived },
    )

    appStore.logsStore.logDebug('Node.initialize(): creating Provider.js (retrieval market provider)')
    this.provider = await Provider.create(
      {
        appStore: appStore,
      },
      {
        node: this.node,
        datastore: this.datastore,
        lotus: this.lotus,
      },
    )

    appStore.logsStore.logDebug(`Node.initialize(): creating SocketClient.js (Socket connection)`)
    this.socketClient = await SocketClient.create(
      { datastore: this.datastore },
      {
        handleCidReceived: (...args) => {
          if (!appStore.dealsStore.hasOngoingDeals()) {
            this.socketClient.disconnect()
          }

          return (this.handleCidReceived as any)(...args)
        },
      },
    )

    appStore.logsStore.logDebug('Node.initialize(): starting libp2p node')
    await this.node.start()

    appStore.logsStore.logDebug('Node.initialize(): adding listeners to node')
    this.node.connectionManager.on('peer:connect', this.handlePeerConnect)
    this.node.connectionManager.on('peer:disconnect', this.handlePeerDisconnect)
    this.node.pubsub.subscribe(topics.filecoinRetrieval, this.handleMessage)

    appStore.logsStore.logDebug('Node.initialize(): getting node info')
    this.getInfo()

    appStore.logsStore.logDebug('Node.initialize(): node created')
  }

  async getInfo() {
    this.multiaddrs = this.node.multiaddrs.map((multiaddr) => `${multiaddr.toString()}/p2p/${this.id}`)
  }

  handlePeerConnect = (connection) => {
    this.connectedPeers.add(connection.remotePeer.toB58String())
    this.postPeers()
  }

  handlePeerDisconnect = (connection) => {
    this.connectedPeers.delete(connection.remotePeer.toB58String())
    this.postPeers()
  }

  handleMessage = ({ from, data }) => {
    if (from === this.id) {
      return
    }

    const string = data.toString()
    appStore.logsStore.logDebug(`received message ${string}`)
    const message = JSON.parse(string)

    switch (message.messageType) {
      case messageTypes.query:
        appStore.logsStore.logDebug(`someone queried node`)
        this.handleQuery(message)
        break

      case messageTypes.queryResponse:
        appStore.logsStore.logDebug(`handleMessage > queryResponse`)
        this.handleQueryResponse(message)
        break

      default:
        break
    }
  }

  async handleQuery({ cid, peerId }) {
    try {
      const params = await this.provider.getDealParams(cid)

      if (params) {
        appStore.logsStore.logDebug(`someone queried for a CID I have: ${cid}`)
        await this.publish({
          peerId,
          messageType: messageTypes.queryResponse,
          cid,
          multiaddrs: this.multiaddrs,
          params,
        })
      }
    } catch (error) {
      console.error(error)
      appStore.logsStore.logError(`handle query failed: ${error.message}`)
    }
  }

  async handleQueryResponse({ messageType, cid, multiaddrs, params, peerId }) {
    if (!peerId || this.id !== peerId || !this.queriedCids.has(cid)) {
      // message not for this peer
      return
    }

    const { offersStore } = appStore

    offersStore.add(
      cid,
      multiaddrs.map((address) => ({
        address,
        price: params.size * params.pricePerByte,
        params,
      })),
    )
  }

  handleCidReceived = async (cid, size) => {
    try {
      appStore.logsStore.logDebug(`CID received: ${cid}`)
      const { optionsStore } = appStore
      optionsStore.addKnownCid(cid, size)
    } catch (error) {
      console.error(error)
      appStore.logsStore.logError(`save received cid failed: ${error.message}`)
    }
  }

  async query(rawCid, minerID) {
    try {
      this.clearOffers()

      const cid = rawCid.trim()
      this.queriedCids.add(cid)

      if (minerID) {
        appStore.logsStore.logDebug(`querying proxy for ${cid} , minerID:  ${minerID}`)
        this.socketClient.connect()
        this.socketClient.query({ cid, minerID })
      }

      appStore.logsStore.logDebug(`querying peers for ${cid}`)
      await this.publish({ messageType: messageTypes.query, cid, peerId: this.id })
    } catch (error) {
      console.error(error)
      appStore.logsStore.logError(`publish to topic failed: ${error.message}`)
    }
  }

  async clearOffers() {
    const { offersStore } = appStore

    if (offersStore.offerInfo.cid) {
      this.queriedCids.delete(offersStore.offerInfo.cid)
    }

    offersStore.clear()
  }

  runInLoop(stop = false) {
    if (stop) {
      return clearInterval(this.lastIntervalId) as any
    }

    return setInterval(async () => {
      const { optionsStore } = appStore
      const { automationCode } = optionsStore

      try {
        // eslint-disable-next-line no-eval
        eval(automationCode)
      } catch (error) {
        appStore.logsStore.logError(`automation loop failed: ${error.message}`)
      }
    }, this.automationLoopTime)
  }

  stopLoop() {
    return clearInterval(this.lastIntervalId)
  }

  async runAutomationCode() {
    try {
      const { optionsStore } = appStore
      const { automationCode } = optionsStore

      appStore.logsStore.logDebug(`automation code saved`)

      // eslint-disable-next-line no-eval
      eval(automationCode)
      this.lastIntervalId = this.runInLoop()
    } catch (error) {
      appStore.logsStore.logError(`automation code failed: ${error.message}`)
      this.runInLoop(true)
    }
  }

  async updatePrice(cid, price) {
    appStore.logsStore.logDebug(`update price: ${price} for cid: ${cid}`)
    const { optionsStore } = appStore
    const { pricesPerByte } = optionsStore

    return optionsStore.set({
      pricesPerByte: {
        ...pricesPerByte,
        [cid]: parseInt(price, 10),
      },
    })
  }

  async uploadFiles(files) {
    try {
      appStore.logsStore.logDebug(`Node.uploadFiles(): uploading ${files.length} files`)
      const { optionsStore } = appStore
      const { knownCids } = optionsStore

      const totalBytes = files.reduce((sum, file) => sum + file.size, 0)
      let totalBytesLoaded = 0

      await Promise.all(
        files.map(async (file) => {
          const { cid, size } = await this.datastore.putFile(file, {
            progress: (bytesLoaded) => {
              totalBytesLoaded += bytesLoaded

              appStore.uploadStore.setProgress(totalBytesLoaded / totalBytes)
            },
          })

          appStore.optionsStore.addKnownCid(cid, size)
          appStore.optionsStore.set({ knownCids })
        }),
      )

      appStore.uploadStore.setProgress(0)

      appStore.logsStore.logDebug(`Node.uploadFiles(): ${files.length} files uploaded`)
    } catch (error) {
      console.error(error)
      appStore.logsStore.logError(`Node.uploadFiles(): upload failed: ${error.message}`)
    }
  }

  async _downloadFromPeer({ cid, offer }) {
    appStore.logsStore.logDebug(`Node._downloadFromPeer: starting`)

    if (!this.queriedCids.has(cid)) {
      appStore.logsStore.logDebug(`Node._downloadFromPeer: exiting because Node.queriedCids does not contain '${cid}'`)
      return
    }

    appStore.logsStore.logDebug(`Node._downloadFromPeer:  offer=${JSON.stringify(offer)}`)
    appStore.logsStore.logDebug(
      `Node._downloadFromPeer:\n  CID: ${cid}\n  from: ${offer.address}\n  price: ${offer.price} attoFil`,
    )

    const { params } = offer
    const multiaddr = offer.address

    const downloadParams = { cid, params, multiaddr }
    if (/^ws/i.test(multiaddr)) {
      return this.retrieveFromSocket(downloadParams)
    }

    return this.retrieveFromPeer(downloadParams)
  }

  async retrieveFromSocket({ cid, params, multiaddr }) {
    try {
      await this.socketClient.buy({ cid, params, multiaddr })
    } catch (error) {
      console.error(error)
      appStore.logsStore.logError(`Node.retrieveFromSocket():  failed: ${error.message}`)
    }
  }

  async retrieveFromPeer({ cid, params, multiaddr }) {
    try {
      await this.client.retrieve(cid, params, multiaddr, undefined) // TODO:  peer wallet!
    } catch (error) {
      console.error(error)
      appStore.logsStore.logError(`Node.retrieveFromPeer():  failed: ${error.message}`)
    }
  }

  async _downloadLocally({ cid }) {
    try {
      appStore.logsStore.logDebug(`Node._downloadLocally(): downloading ${cid}`)

      const data = await this.datastore.cat(cid)
      const response = await fetch(`data:application/octet-stream;base64,${data.toString('base64')}`)
      const blob = await response.blob()

      downloadBrowser({ cid, blob })
    } catch (error) {
      console.error(error)
      appStore.logsStore.logError(` Node._downloadLocally():  download failed: ${error.message}`)
    }
  }

  async downloadFile({ cid, offer }: { cid: string; offer?: any }) {
    appStore.logsStore.logDebug(` Node.downloadFile:\n  cid:'${cid}'\n  offer=${inspect(offer)}`)
    try {
      if (offer) {
        this._downloadFromPeer({ cid, offer })
      } else {
        this._downloadLocally({ cid })
      }
    } catch (error) {
      console.error(error)
      appStore.logsStore.logError(`Node.downloadFile(): error: ${error.message}`)
    }
  }

  async deleteFile(cid) {
    try {
      appStore.logsStore.logDebug(`Node.deleteFile(): deleting ${cid}`)
      const { optionsStore } = appStore
      await this.datastore.delete(cid)

      optionsStore.removeKnownCid(cid)
    } catch (error) {
      console.error(error)
      appStore.logsStore.logError(`Node.deleteFile(): delete failed: ${error.message}`)
    }
  }

  /**
   * Sends a message to other peers in the network asking for a CID
   * @param  {} message Contains `cid` that the node is looking for
   */
  async publish(message) {
    const string = JSON.stringify(message)
    appStore.logsStore.logDebug(`publishing message ${string}`)
    await this.node.pubsub.publish(topics.filecoinRetrieval, string)
  }

  postPeers() {
    appStore.setConnectedPeers(Array.from(this.connectedPeers))
  }

  async stop() {
    appStore.logsStore.logDebug('stopping ipfs node')

    this.multiaddrs = []

    this.connectedPeers = new Set()
    this.postPeers()

    await this.datastore.close()
    await this.node.stop()
  }
}
