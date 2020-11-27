import inspect from 'browser-util-inspect'
import pipe from 'it-pipe'
import pushable from 'it-pushable'
import { Datastore } from 'shared/Datastore'
import { dealStatuses } from 'shared/dealStatuses'
import { jsonStream } from 'shared/jsonStream'
import { Lotus } from 'shared/lotus-client/Lotus'
import { convertDealsToArray, ongoingDeals } from 'shared/ongoingDeals'
import { protocols } from 'shared/protocols'

import { appStore } from 'shared/store/appStore'

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

    const sink = pushable()
    pipe(sink, jsonStream.stringify, stream, jsonStream.parse, this.handleMessage)

    const importerSink = pushable()

    // TODO:  should dealId be random?  Maybe, but check this
    // TODO:  rand % max int  eliminate Math.floor
    const dealId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
    ongoingDeals[dealId] = {
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
      importer: this.datastore.putContent(importerSink),
      voucherNonce: 1,
    }

    this.sendDealProposal({ dealId })

    this.postInboundDeals()
  }

  postInboundDeals() {
    appStore.dealsStore.setInboundDeals(convertDealsToArray(ongoingDeals))
  }

  handleMessage = async (source) => {
    for await (const message of source) {
      try {
        // TODO: @brunolm migrate
        appStore.logsStore.logDebug(`Client.handleMessage(): message: ${inspect(message)}`)
        const deal = ongoingDeals[message.dealId]

        if (!deal) {
          throw new Error(`Deal not found: ${message.dealId}`)
        }

        switch (message.status) {
          case dealStatuses.accepted: {
            // TODO: @brunolm migrate
            appStore.logsStore.logDebug('Client.handleMessage(): case dealStatuses.accepted')
            deal.status = dealStatuses.accepted
            deal.customStatus = undefined
            await this.setupPaymentChannel(message)
            break
          }

          case dealStatuses.fundsNeeded: {
            // TODO: @brunolm migrate
            appStore.logsStore.logDebug('Client.handleMessage(): case dealStatuses.fundsNeeded')
            deal.status = dealStatuses.ongoing
            deal.customStatus = undefined
            await this.receiveBlocks(message)
            await this.sendPayment(message, false)
            break
          }

          case dealStatuses.fundsNeededLastPayment: {
            // TODO: @brunolm migrate
            appStore.logsStore.logDebug('Client.handleMessage(): case dealStatuses.fundsNeededLastPayment')
            deal.status = dealStatuses.finalizing
            deal.customStatus = undefined
            await this.receiveBlocks(message)
            await this.finishImport(message)
            await this.sendPayment(message, true)
            break
          }

          case dealStatuses.completed: {
            // TODO: @brunolm migrate
            appStore.logsStore.logDebug('Client.handleMessage(): case dealStatuses.completed')
            await this.closeDeal(message)
            break
          }

          default: {
            // TODO: @brunolm migrate
            appStore.logsStore.logDebug('Client.handleMessage(): case default')
            // TODO: @brunolm migrate
            appStore.logsStore.logDebug(
              `ERROR: Client.handleMessage(): unknown deal message status received: ${message.status}`,
            )
            deal.sink.end()
            break
          }
        }
      } catch (error) {
        console.error(error)
        // TODO: @brunolm migrate
        appStore.logsStore.logDebug(
          `ERROR: Client.handleMessage(): handle deal message failed: ${error.message}\nMessage status: ${message.status}`,
        )
      }
    }
  }

  updateCustomStatus(str, deal) {
    deal.customStatus = str

    this.postInboundDeals()
  }

  sendDealProposal({ dealId }) {
    // TODO: @brunolm migrate
    appStore.logsStore.logDebug(`Client.sendDealProposal: sending deal proposal ${dealId}`)
    const deal = ongoingDeals[dealId]

    deal.sink.push({
      dealId,
      status: dealStatuses.awaitingAcceptance,
      cid: deal.cid,
      clientWalletAddr: this.lotus.wallet,
      params: deal.params,
    })

    deal.status = dealStatuses.awaitingAcceptance
    deal.customStatus = undefined
  }

  async setupPaymentChannel({ dealId }) {
    appStore.logsStore.logDebug(`Client.setupPaymentChannel(): setting up payment channel ${dealId}`)
    const deal = ongoingDeals[dealId]

    const pchAmount = deal.params.size * deal.params.pricePerByte
    const toAddr = deal.params.wallet

    this.updateCustomStatus('Creating payment channel', deal)

    appStore.logsStore.logDebug(
      `Client.setupPaymentChannel(): PCH creation parameters:\n  pchAmount='${pchAmount}'\n  toAddr='${toAddr}'`,
    )

    //await this.lotus.keyRecoverLogMsg();  // testing only

    deal.paymentChannel = await this.lotus.createPaymentChannel(toAddr, pchAmount)

    // Not using lanes currently
    deal.Lane = 0

    appStore.logsStore.logDebug(
      `Client.setupPaymentChannel(): sending payment channel ready (pchAddr='${deal.paymentChannel}') for dealId='${dealId}'`,
    )
    deal.sink.push({
      dealId,
      status: dealStatuses.paymentChannelReady,
    })

    deal.status = dealStatuses.paymentChannelReady
    deal.customStatus = undefined

    appStore.logsStore.logDebug(`Client.setupPaymentChannel(): done`)
  }

  /**
   * @param {object} info
   * @param {string} info.dealId
   * @param {Array<{ type: string; data: Array<number> }>} info.blocks
   */
  async receiveBlocks({ dealId, blocks }) {
    appStore.logsStore.logDebug(`Client.receiveBlocks(): received ${blocks.length} blocks deal id: ${dealId}`)
    const deal = ongoingDeals[dealId]
    this.updateCustomStatus('Receiving data', deal)

    for (const block of blocks) {
      deal.importerSink.push(block.data)
      deal.sizeReceived += block.data ? block.data.length : 0
    }

    this.postInboundDeals()
  }

  async finishImport({ dealId, blocks }) {
    appStore.logsStore.logDebug(`Client.finishImport(): finishing import ${dealId}`)
    const deal = ongoingDeals[dealId]
    deal.importerSink.end()
    await deal.importer
  }

  async sendPayment({ dealId }, isLastVoucher) {
    appStore.logsStore.logDebug(`Client.sendPayment(): sending payment ${dealId} (isLastVoucher=${isLastVoucher})`)
    const deal = ongoingDeals[dealId]

    const amount = deal.sizeReceived * deal.params.pricePerByte
    const nonce = deal.voucherNonce++
    const sv = await this.lotus.createSignedVoucher(deal.paymentChannel, amount, nonce)
    // TODO: @brunolm migrate
    appStore.logsStore.logDebug(`Client.sendPayment(): sv = '${sv}'`)

    const newDealStatus = isLastVoucher ? dealStatuses.lastPaymentSent : dealStatuses.paymentSent

    this.updateCustomStatus('Sent signed voucher', deal)

    deal.sink.push({
      dealId,
      status: newDealStatus,
      paymentChannel: deal.paymentChannel,
      signedVoucher: sv,
    })
  }

  async closeDeal({ dealId }) {
    appStore.logsStore.logDebug(`Client.closeDeal: closing deal ${dealId}`)
    const deal = ongoingDeals[dealId]
    this.updateCustomStatus('Enqueueing channel collect operation', deal)
    // TODO:
    // this.lotus.closePaymentChannel(deal.paymentChannel);
    deal.sink.end()
    // TODO:  pend an operation to call Collect on the channel when cron class is available
    // TODO:  stopgap solution:  window.setTimeout() to try to ensure channel Collect
    delete ongoingDeals[dealId]
    await this.cidReceivedCallback(deal.cid, deal.sizeReceived)

    this.postInboundDeals()
  }
}
