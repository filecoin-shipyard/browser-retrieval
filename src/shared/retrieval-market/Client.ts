import inspect from 'browser-util-inspect'
import pipe from 'it-pipe'
import pushable from 'it-pushable'
import { toJS } from 'mobx'
import { Datastore } from 'shared/Datastore'
import { dealStatuses } from 'shared/dealStatuses'
import { jsonStream } from 'shared/jsonStream'
import { Lotus } from 'shared/lotus-client/Lotus'
import { protocols } from 'shared/protocols'
import { appStore } from 'shared/store/appStore'

import { decodeCID } from '../decodeCID'

interface DealParams {
  wallet: string
  size: number
  pricePerByte: string
}

let clientInstance: Client

export class Client {
  /** Libp2p node */
  node: any

  datastore: Datastore
  lotus: Lotus
  cidReceivedCallback

  static async create(services, callbacks) {
    if (!clientInstance) {
      clientInstance = new Client(services, callbacks)
    }

    return clientInstance
  }

  constructor({ node, datastore, lotus }, { cidReceivedCallback }) {
    appStore.logsStore.logDebug('Client.constructor()')
    this.node = node
    this.datastore = datastore
    this.lotus = lotus

    this.cidReceivedCallback = cidReceivedCallback
  }

  async retrieve(cid: string, dealParams: DealParams, peerMultiaddr: string, peerWallet: string) {
    appStore.logsStore.logDebug('Client.retrieve()')

    appStore.logsStore.logDebug(
      `MIKE: retrieve called with\n  cid='${cid}'\n  dealParams='${inspect(
        dealParams,
      )}'\n  peerMultiaddr=${peerMultiaddr}\n  peerWallet=${peerWallet}`,
    )
    appStore.logsStore.logDebug(`dialing peer ${peerMultiaddr}`)
    const { stream } = await this.node.dialProtocol(peerMultiaddr, protocols.filecoinRetrieval)

    const decoded = decodeCID(cid)

    appStore.logsStore.logDebug(
      `Client.retrieve: cidVersion ${decoded.version} hashAlg ${decoded.hashAlg} rawLeaves ${decoded.rawLeaves} format ${decoded.format}`,
    )

    const { importOptions } = decoded

    const sink = pushable()
    pipe(sink, jsonStream.stringify, stream, jsonStream.parse, this.handleMessage)

    const importerSink = pushable()

    // TODO:  should dealId be random?  Maybe, but check this
    // TODO:  rand % max int  eliminate Math.floor
    const dealId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString()

    appStore.dealsStore.createInboundDeal({
      id: dealId,
      status: dealStatuses.new,
      customStatus: undefined,
      cid,
      params: dealParams,
      peerMultiaddr,
      peerWallet,
      sink,
      sizeReceived: 0,
      sizePaid: 0,
      importerSink,
      importer: this.datastore.putContent(importerSink, importOptions),
      voucherNonce: 1,
    })

    this.sendDealProposal({ dealId })
  }

  handleMessage = async (source) => {
    for await (const message of source) {
      const deal = appStore.dealsStore.getInboundDeal(message.dealId)

      try {
        appStore.logsStore.logDebug(`Client.handleMessage(): message: ${inspect(message)}`)

        if (!deal) {
          throw new Error(`Deal not found: ${message.dealId}`)
        }

        switch (message.status) {
          case dealStatuses.accepted: {
            appStore.logsStore.logDebug('Client.handleMessage(): case dealStatuses.accepted')
            appStore.dealsStore.setInboundDealProps(deal.id, {
              status: dealStatuses.accepted,
              customStatus: undefined,
            })
            await this.setupPaymentChannel(message)
            break
          }

          case dealStatuses.fundsNeeded:
          case dealStatuses.fundsNeededLastPayment:
            await this.handleFundsNeededMessage(message)
            break

          case dealStatuses.completed: {
            appStore.logsStore.logDebug('Client.handleMessage(): case dealStatuses.completed')
            await this.closeDeal(message)
            break
          }

          case dealStatuses.abort:
            appStore.logsStore.log('Client.handleMessage(): case abort')
            await this.closeDeal(message, { saveCid: false })
            break

          default: {
            appStore.logsStore.logDebug('Client.handleMessage(): case default')
            appStore.logsStore.logError(
              `Client.handleMessage(): unknown deal message status received: ${message.status}`,
            )
            deal.sink.end()
            break
          }
        }
      } catch (error) {
        appStore.logsStore.logError(
          `Client.handleMessage(): handle deal message failed: ${error.message}\nMessage status: ${message.status}`,
        )

        appStore.alertsStore.create({
          message: `An error occured: ${error.message}`,
          type: 'error',
        })

        deal.sink.push({
          dealId: message.dealId,
          status: dealStatuses.abort,
          error: error?.message,
        })

        this.closeDeal(message, { saveCid: false })
      }
    }
  }

  async handleFundsNeededMessage(message) {
    appStore.logsStore.logDebug(`Client.handleFundsNeededMessage(): case ${message.status}`)

    const deal = appStore.dealsStore.getInboundDeal(message.dealId)
    const isFundsNeeded = message.status === dealStatuses.fundsNeeded
    const isLastPaymentNeeded = message.status === dealStatuses.fundsNeededLastPayment

    appStore.dealsStore.setInboundDealProps(deal.id, {
      status: isFundsNeeded ? dealStatuses.ongoing : dealStatuses.finalizing,
      customStatus: undefined,
    })

    this.receiveBlocks(message)
    appStore.logsStore.logDebug(`Client.handleFundsNeededMessage(): Blocks received`)

    if (isFundsNeeded) {
      await this.sendPayment(message, false)
    } else if (isLastPaymentNeeded) {
      await this.finishImport(message)
      await this.sendPayment(message, true)
    }
  }

  updateCustomStatus(deal: { id: string }, str) {
    appStore.dealsStore.setInboundDealProps(deal.id, {
      customStatus: str,
    })
  }

  sendDealProposal({ dealId }) {
    appStore.logsStore.logDebug(`Client.sendDealProposal: sending deal proposal ${dealId}`)

    const deal = appStore.dealsStore.getInboundDeal(dealId)

    deal.sink.push({
      dealId,
      status: dealStatuses.awaitingAcceptance,
      cid: deal.cid,
      clientWalletAddr: appStore.optionsStore.wallet,
      params: deal.params,
    })

    deal.status = dealStatuses.awaitingAcceptance
    deal.customStatus = undefined
  }

  async setupPaymentChannel({ dealId }) {
    appStore.logsStore.logDebug(`Client.setupPaymentChannel(): setting up payment channel ${dealId}`)

    const deal = appStore.dealsStore.getInboundDeal(dealId)

    const pchAmount = deal.params.size * deal.params.pricePerByte
    const toAddr = deal.params.wallet

    this.updateCustomStatus(deal, 'Creating payment channel')

    appStore.logsStore.logDebug(
      `Client.setupPaymentChannel(): PCH creation parameters:\n  pchAmount='${pchAmount}'\n  toAddr='${toAddr}'`,
    )

    //await this.lotus.keyRecoverLogMsg();  // testing only

    const paymentChannel = await this.lotus.createPaymentChannel(toAddr, pchAmount)

    if (!paymentChannel) {
      throw new Error('payment channel could not be created')
    }

    // const paymentChannel = undefined // debug without funds

    appStore.logsStore.logDebug(`Client.setupPaymentChannel(): paymentChannel:`, paymentChannel)

    appStore.dealsStore.setInboundDealProps(dealId, {
      paymentChannel,
      Lane: 0, // Not using lanes currently
    })

    // TODO: deal.paymentChannel is undefined, but paymentChannel is, why?
    appStore.logsStore.logDebug(
      `Client.setupPaymentChannel(): sending payment channel ready (pchAddr='${deal.paymentChannel}') for dealId='${dealId}'`,
    )
    deal.sink.push({
      dealId,
      status: dealStatuses.paymentChannelReady,
    })

    appStore.dealsStore.setInboundDealProps(dealId, {
      status: dealStatuses.paymentChannelReady,
      customStatus: undefined,
    })

    appStore.logsStore.logDebug(`Client.setupPaymentChannel(): done`)
  }

  /**
   * @param {object} info
   * @param {string} info.dealId
   * @param {Array<{ type: string; data: Array<number> }>} info.blocks
   */
  receiveBlocks({ dealId, blocks }) {
    appStore.logsStore.logDebug(`Client.receiveBlocks(): received ${blocks.length} blocks deal id: ${dealId}`)

    const deal = toJS(appStore.dealsStore.getInboundDeal(dealId))

    this.updateCustomStatus(deal, 'Receiving data')

    for (const block of blocks) {
      deal.importerSink.push(block.data)

      deal.sizeReceived += block.data ? block.data.length : 0
      appStore.dealsStore.setInboundDealProps(dealId, {
        sizeReceived: deal.sizeReceived,
      })
    }
  }

  async finishImport({ dealId, blocks }) {
    appStore.logsStore.logDebug(`Client.finishImport(): finishing import ${dealId}`)

    const deal = appStore.dealsStore.getInboundDeal(dealId)

    deal.importerSink.end()
    await deal.importer
  }

  async sendPayment({ dealId }, isLastVoucher) {
    appStore.logsStore.logDebug(`Client.sendPayment(): sending payment ${dealId} (isLastVoucher=${isLastVoucher})`)

    const deal = appStore.dealsStore.getInboundDeal(dealId)

    const amount = deal.sizeReceived * deal.params.pricePerByte
    const nonce = deal.voucherNonce++
    const sv = await this.lotus.createSignedVoucher(deal.paymentChannel, amount, nonce)
    // const sv = undefined // debug without funds
    appStore.logsStore.logDebug(`Client.sendPayment(): sv = '${sv}'`)

    const newDealStatus = isLastVoucher ? dealStatuses.lastPaymentSent : dealStatuses.paymentSent

    this.updateCustomStatus(deal, 'Sent signed voucher')

    const message = {
      dealId,
      status: newDealStatus,
      paymentChannel: deal.paymentChannel,
      signedVoucher: sv,
    }
    appStore.logsStore.logDebug(`Client.sendPayment() message:\n${JSON.stringify(message, null, 2)}`)

    deal.sink.push(message)
  }

  async closeDeal({ dealId }, { saveCid } = { saveCid: true }) {
    appStore.logsStore.logDebug(`Client.closeDeal: closing deal ${dealId}`)

    const deal = appStore.dealsStore.getInboundDeal(dealId)

    this.updateCustomStatus(deal, 'Enqueueing channel collect operation')
    // TODO:
    // this.lotus.closePaymentChannel(deal.paymentChannel);
    deal.sink.end()
    // TODO:  pend an operation to call Collect on the channel when cron class is available
    // TODO:  stopgap solution:  window.setTimeout() to try to ensure channel Collect

    appStore.dealsStore.removeInboundDeal(dealId)

    if (saveCid) {
      await this.cidReceivedCallback(deal.cid, deal.sizeReceived)
    }
  }
}
