import inspect from 'browser-util-inspect'
import pipe from 'it-pipe'
import pushable from 'it-pushable'
import { DateTime } from 'luxon'
import { Datastore } from 'shared/Datastore'
import { dealStatuses } from 'shared/dealStatuses'
import { jsonStream } from 'shared/jsonStream'
import { Lotus } from 'shared/lotus-client/Lotus'
import { Services } from 'shared/models/services'
import { protocols } from 'shared/protocols'
import { appStore } from 'shared/store/appStore'

let providerInstance: Provider

export class Provider {
  /** Libp2p node */
  node: any

  datastore: Datastore
  lotus: Lotus

  paymentInterval
  paymentIntervalIncrease

  static async create(...args) {
    if (!providerInstance) {
      // @ts-ignore
      providerInstance = new Provider(...args)

      await providerInstance.initialize()
    }

    return providerInstance
  }

  constructor(services: Services, { node, datastore, lotus }) {
    this.node = node
    this.datastore = datastore
    this.lotus = lotus
  }

  async initialize() {
    appStore.logsStore.logDebug('Provider.initialize()')
    await this.updateOptions()

    this.node.handle(protocols.filecoinRetrieval, this.handleProtocol)
  }

  async updateOptions() {
    appStore.logsStore.logDebug('Provider.updateOptions()')
    const { paymentInterval, paymentIntervalIncrease } = appStore.settingsStore
    this.paymentInterval = paymentInterval
    this.paymentIntervalIncrease = paymentIntervalIncrease
  }

  handleOptionsChange = async (changes) => {
    if (
      changes.paymentInterval?.oldValue !== changes.paymentInterval?.newValue ||
      changes.paymentIntervalIncrease?.oldValue !== changes.paymentIntervalIncrease?.newValue
    ) {
      try {
        await this.updateOptions()
      } catch (error) {
        console.error(error)
        appStore.logsStore.logDebug(
          `ERROR: Provider.handleOptionsChange():  update payment interval failed: ${error.message}`,
        )
      }
    }
  }

  async getDealParams(cid) {
    appStore.logsStore.logDebug(`Provider.getDealParams(): cid = ${cid}`)
    const { pricesPerByte, knownCids } = appStore.optionsStore
    const cidInfo = knownCids[cid]

    if (cidInfo) {
      const pricePerByte = pricesPerByte[cid] || pricesPerByte['*']

      const dealParams = {
        wallet: appStore.optionsStore.wallet,
        size: cidInfo.size,
        pricePerByte,
        paymentInterval: this.paymentInterval,
        paymentIntervalIncrease: this.paymentIntervalIncrease,
      }

      appStore.logsStore.logDebug(`Provider.getDealParams(): dealParams:`, dealParams)

      return dealParams
    }

    return null
  }

  handleProtocol = async ({ stream }) => {
    appStore.logsStore.logDebug(`Provider.handleProtocol(): ${protocols.filecoinRetrieval}`)
    const sink = pushable()
    pipe(sink, jsonStream.stringify, stream, jsonStream.parse, async (source) => {
      for await (const message of source) {
        try {
          appStore.logsStore.logDebug(`Provider.handleProtocol():  message=${inspect(message)}`)

          switch (message.status) {
            case dealStatuses.awaitingAcceptance: {
              await this.handleNewDeal(message, sink)
              break
            }

            case dealStatuses.paymentChannelReady: {
              await this.sendBlocks(message)
              break
            }

            case dealStatuses.paymentSent: {
              // TODO: why not to split in two functions to be more clear?
              // TODO: code duplication with `dealStatuses.lastPaymentSent`
              this.setOrVerifyPaymentChannel(message)
              if (!(await this.checkPaymentVoucherValid(message))) {
                throw new Error(`received invalid voucher (${message.paymentVoucher}) on dealId ${message.dealId}`)
              } else {
                await this.submitPaymentVoucher(message)
                await this.sendBlocks(message)
              }
              break
            }

            case dealStatuses.lastPaymentSent: {
              // TODO: why not to split in two functions to be more clear?
              // TODO: code duplication with `dealStatuses.paymentSent`
              this.setOrVerifyPaymentChannel(message)
              if (!(await this.checkPaymentVoucherValid(message))) {
                throw new Error(`received invalid voucher (${message.paymentVoucher}) on dealId ${message.dealId}`)
              } else {
                await this.submitPaymentVoucher(message)
                await this.sendDealCompleted(message)
                await this.closeDeal(message)
              }
              break
            }

            default: {
              appStore.logsStore.logDebug(`ERROR: unknown deal message received: ${JSON.stringify(message)}`)
              sink.end()
              break
            }
          }
        } catch (error) {
          sink.end()
          appStore.logsStore.logError(`ERROR: handle deal message failed: ${error.message} ${error.stack}`)
        }
      }
    })
  }

  setOrVerifyPaymentChannel(message) {
    // Set payment channel if undefined, else make sure it matches current message
    const deal = appStore.dealsStore.getOutboundDeal(message.dealId)

    deal.paymentChannel = deal.paymentChannel || message.paymentChannel

    appStore.dealsStore.setOutboundDealProps(message.dealId, {
      paymentChannel: deal.paymentChannel,
    })

    if (deal.paymentChannel !== message.paymentChannel) {
      throw new Error(
        `received incorrect payment channel address (message.paymentChannel (${message.paymentChannel}) != deal.paymentChannel (${deal.paymentChannel})) on dealId ${message.dealId}`,
      )
    }
  }

  async handleNewDeal({ dealId, cid, clientWalletAddr, params }, sink) {
    appStore.logsStore.logDebug(
      `Provider.handleNewDeal:\n  new deal id=${dealId}\n  cid=${cid}\n  clientWalletAddr=${clientWalletAddr}\n  params=${inspect(
        params,
      )}`,
    )

    const deal = appStore.dealsStore.getOutboundDeal(dealId)
    if (deal?.id) {
      throw new Error('A deal already exists for the given id')
    }

    const currentParams = await this.getDealParams(cid)

    if (params.wallet !== currentParams.wallet) {
      throw new Error('Not my wallet')
    }

    if (params.pricePerByte < currentParams.pricePerByte) {
      throw new Error('Price per byte too low')
    }

    if (params.paymentInterval > currentParams.paymentInterval) {
      throw new Error('Payment interval too large')
    }

    if (params.paymentIntervalIncrease > currentParams.paymentIntervalIncrease) {
      throw new Error('Payment interval increase too large')
    }

    appStore.dealsStore.createOutboundDeal({
      id: dealId,
      status: dealStatuses.awaitingAcceptance,
      customStatus: undefined,
      cid,
      clientWalletAddr,
      params,
      sink,
      sizeSent: 0,
    })

    await this.sendDealAccepted({ dealId })
  }

  sendDealAccepted({ dealId }) {
    appStore.logsStore.logDebug('Provider.sendDealAccepted()')
    appStore.logsStore.logDebug(`sending deal accepted ${dealId}`)

    const deal = appStore.dealsStore.getOutboundDeal(dealId)

    deal.sink.push({
      dealId,
      status: dealStatuses.accepted,
    })
  }

  async sendBlocks({ dealId }) {
    appStore.logsStore.logDebug('Provider.sendBlocks()')
    appStore.logsStore.logDebug(`sending blocks ${dealId}`)

    const deal = appStore.dealsStore.getOutboundDeal(dealId)
    this.updateCustomStatus(deal, 'Sending data')
    const entry = await this.datastore.get(deal.cid)

    const blocks = []
    let blocksSize = 0
    let hadBytes = false
    for await (const block of entry.content({ offset: deal.sizeSent })) {
      hadBytes = block && block.length

      if (!hadBytes) {
        break
      }

      blocks.push(block)
      blocksSize += block.length

      if (blocksSize >= deal.params.paymentInterval) {
        break
      }
    }

    deal.sink.push({
      dealId,
      status:
        deal.sizeSent + blocksSize >= deal.params.size || !hadBytes
          ? dealStatuses.fundsNeededLastPayment
          : dealStatuses.fundsNeeded,
      blocks,
    })

    deal.params.paymentInterval += deal.params.paymentIntervalIncrease
    deal.sizeSent += blocksSize

    appStore.dealsStore.setOutboundDealProps(deal.id, {
      params: {
        ...deal.params,
      },
      sizeSent: deal.sizeSent,
    })
  }

  updateCustomStatus(deal: { id: string }, str) {
    appStore.dealsStore.setOutboundDealProps(deal.id, {
      customStatus: str,
    })
  }

  /**
   * Checks the validity of a signed payment voucher, including verifying the signature and the amount.
   * @param  {number} dealId Deal Id to find this deal in this.ongoingDeals[]
   * @param  {string} paymentChannel PCH robust address
   * @param  {string} signedVoucher Signed payment voucher received from Client
   * @return {boolean} Returns true if voucher is valid
   */
  async checkPaymentVoucherValid({ dealId, paymentChannel, signedVoucher }) {
    appStore.logsStore.logDebug(
      `Provider.checkPaymentVoucherValid: arguments = dealId=${dealId},paymentChannel=${paymentChannel},signedVoucher=${signedVoucher}`,
    )

    const deal = appStore.dealsStore.getOutboundDeal(dealId)
    this.updateCustomStatus(deal, 'Verifying payment voucher')
    const clientWalletAddr = deal.clientWalletAddr
    appStore.logsStore.logDebug(`Provider.checkPaymentVoucherValid: clientWalletAddr=${clientWalletAddr}`)

    const expectedAmountAttoFil = deal.sizeSent * deal.params.pricePerByte
    appStore.logsStore.logDebug(
      `Provider.checkPaymentVoucherValid: expectedAmountAttoFil = ${expectedAmountAttoFil}\n  = [(${deal.sizeSent} bytes sent) * (${deal.params.pricePerByte} pricePerByte)]`,
    )

    const svValid = await this.lotus.checkPaymentVoucherValid(signedVoucher, expectedAmountAttoFil, clientWalletAddr)
    appStore.logsStore.logDebug(`Provider.checkPaymentVoucherValid: ${signedVoucher} => ${svValid}`)
    return svValid

    // TODO (longer term): save voucher to submit later if deal fails
  }

  /**
   * Checks the validity of a signed payment voucher, including verifying the signature and the amount.
   * @param  {number} dealId Deal Id to find this deal in this.ongoingDeals[]
   * @param  {string} paymentChannel PCH robust address
   * @param  {string} paymentVoucher Signed voucher to submit; assumed to already be validated successfully
   */
  async submitPaymentVoucher({ dealId, paymentChannel, signedVoucher }) {
    appStore.logsStore.logDebug('Provider.submitPaymentVoucher()')
    appStore.logsStore.logDebug(
      `Provider.submitPaymentVoucher: submitting voucher dealId=${dealId},paymentChannel=${paymentChannel},signedVoucher=${signedVoucher}`,
    )

    const deal = appStore.dealsStore.getOutboundDeal(dealId)
    this.updateCustomStatus(deal, 'Updating payment channel with voucher')

    const isUpdateSuccessful = await this.lotus.updatePaymentChannel(paymentChannel, signedVoucher)
    appStore.logsStore.logDebug(`Provider.submitPaymentVoucher: isUpdateSuccessful=${isUpdateSuccessful}`)
    if (!isUpdateSuccessful) {
      throw new Error('ERROR: Provider.submitPaymentVoucher: failed to submit voucher')
    }
  }

  async sendDealCompleted({ dealId }) {
    appStore.logsStore.logDebug('Provider.sendDealCompleted()')
    appStore.logsStore.logDebug(`sending deal completed ${dealId}`)

    const deal = appStore.dealsStore.getOutboundDeal(dealId)
    deal.sink.push({ dealId, status: dealStatuses.completed })
  }

  async closeDeal({ dealId }) {
    const deal = appStore.dealsStore.getOutboundDeal(dealId)

    // TODO: @brunolm here, this is undefined I guess
    const paymentChannel = deal.paymentChannel

    appStore.logsStore.logDebug(`Provider.closeDeal: dealId=${dealId}, paymentChannel=${paymentChannel}`)

    this.updateCustomStatus(deal, 'Settling payment channel')
    await this.lotus.settlePaymentChannel(paymentChannel)

    this.updateCustomStatus(deal, 'Enqueueing channel collection')
    await this.pendCollectOperation(dealId, paymentChannel)

    appStore.dealsStore.removeOutboundDeal(dealId)
  }

  async pendCollectOperation(dealId, paymentChannelAddr) {
    appStore.logsStore.logDebug(`Provider.pendCollectOperation: dealId=${dealId}, paymentChannel=${paymentChannelAddr}`)

    appStore.operationsStore.queue({
      label: `Collect channel ${paymentChannelAddr}`,

      // name of the method implemented in shared/Operations
      // hint: VSCode should show you the available names through its built-in TypeScript support
      f: 'collectChannel',

      // object with anything you want to store to pass to the operation later (e.g. `deal`)
      metadata: { paymentChannelAddr: paymentChannelAddr },

      // time when to invoke the function
      invokeAt: DateTime.local()
        .plus({ minutes: 12 * 60 + 1 })
        .toString(),
    })
  }
}
