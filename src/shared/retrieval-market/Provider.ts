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
import { BigNumber } from 'bignumber.js'

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

      appStore.logsStore.logDebug(`Provider.getDealParams(): dealParams: ${inspect(dealParams)}`)

      return dealParams
    }

    return null
  }

  handleProtocol = async ({ stream }) => {
    appStore.logsStore.logDebug(`Provider.handleProtocol(): ${protocols.filecoinRetrieval}`)
    const sink = pushable()
    pipe(sink, jsonStream.stringify, stream, jsonStream.parse, async (source) => {
      for await (const message of source) {
        const deal = appStore.dealsStore.getOutboundDeal(message.dealId)
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

            case dealStatuses.paymentSent:
            case dealStatuses.lastPaymentSent:
              await this.handlePaymentMessage(message)
              break

            case dealStatuses.abort:
              sink.end()
              this.closeDeal(message)

              appStore.logsStore.logError(`Client aborted the connection ${JSON.stringify(message)}`, message.error)
              appStore.alertsStore.create({
                message: 'A client aborted the connection',
                type: 'warning',
              })
              break

            default: {
              appStore.logsStore.logDebug(`unknown deal message received: ${JSON.stringify(message)}`)
              sink.end()
              break
            }
          }
        } catch (error) {
          sink.push({
            dealId: deal.id,
            status: dealStatuses.abort,
          })

          sink.end()
          this.closeDeal(message)

          appStore.alertsStore.create({
            message: `An error occured: ${error.message}`,
            type: 'error',
          })

          appStore.logsStore.logError(`handle deal message failed: ${error.message} ${error.stack}`)
        }
      }
    })
  }

  async handlePaymentMessage(message) {
    appStore.logsStore.logDebug(`Provider.handlePaymentMessage(): handle ${message.status}`)

    this.setOrVerifyPaymentChannel(message)

    const isVoucherValid = await this.checkPaymentVoucherValid(message)

    if (!isVoucherValid) {
      throw new Error(`received invalid voucher (${message.paymentVoucher}) on dealId ${message.dealId}`)
    }

    const { dealId, paymentChannel, signedVoucher } = message;
    appStore.pchStore.save({dealId: dealId, pch: paymentChannel, voucher: signedVoucher});

    const isPaymentSent = message.status === dealStatuses.paymentSent
    const isLastPaymentSent = message.status === dealStatuses.lastPaymentSent

    const debugMessage = `[isPaymentSent=${isPaymentSent}] [isLastPaymentSent=${isLastPaymentSent}]`
    appStore.logsStore.logDebug(`Provider.handlePaymentMessage(): ${debugMessage}`)

    if (isPaymentSent) {
      await this.sendBlocks(message)
    } else if (isLastPaymentSent) {
      await this.submitPaymentVoucher(message)
      this.sendDealCompleted(message)
      await this.closeDeal(message)
    }
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

    let blocksSize = 0
    let hadBytes = false
    for await (const block of entry.content({ offset: deal.sizeSent })) {
      hadBytes = block && block.length

      if (!hadBytes) {
        break
      }

      const blocks = []
      blocks.push(block)

      blocksSize += block.length

      deal.sink.push({
        dealId,
        status:
          deal.sizeSent + blocksSize >= deal.params.size || !hadBytes
            ? dealStatuses.fundsNeededLastPayment
            : dealStatuses.fundsNeeded,
        blocks,
      })

      if (blocksSize >= deal.params.paymentInterval) {
        break
      }
    }

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
      `Provider.checkPaymentVoucherValid: dealId=${dealId}, paymentChannel=${paymentChannel}, signedVoucher=${signedVoucher}`,
    )

    if (!paymentChannel || !signedVoucher) {
      return false
    }

    const deal = appStore.dealsStore.getOutboundDeal(dealId)
    this.updateCustomStatus(deal, 'Verifying payment voucher')
    const clientWalletAddr = deal.clientWalletAddr
    appStore.logsStore.logDebug(`Provider.checkPaymentVoucherValid: clientWalletAddr=${clientWalletAddr}`)

    // check if the amount of the signed voucher is matching the expected amount
    const svDecodedVoucher = await this.lotus.decodeSignedVoucher(signedVoucher)
    const svAmount = new BigNumber(svDecodedVoucher.amount)
    const expectedAmountAttoFil = new BigNumber(deal.sizeSent).multipliedBy(deal.params.pricePerByte)
    if (!svAmount.isEqualTo(expectedAmountAttoFil)) {
      appStore.logsStore.logError(
        `Voucher validation failed: the expected amount ${expectedAmountAttoFil} doesn't match the voucher amount ${svAmount}`,
      )
      appStore.alertsStore.create({
        message: `Voucher amount validation failed. Expected: ${expectedAmountAttoFil}  Voucher amount: ${svAmount}`,
        type: 'error',
      })
      return false
    }
    appStore.logsStore.logDebug(
      `Provider.checkPaymentVoucherValid: expectedAmountAttoFil = ${expectedAmountAttoFil} matches the voucher amount = ${svAmount}`,
    )

    const svValid = await this.lotus.checkPaymentVoucherValid(signedVoucher, expectedAmountAttoFil, clientWalletAddr)
    appStore.logsStore.logDebug(`Provider.checkPaymentVoucherValid: ${signedVoucher} => ${svValid}`)
    return svValid

    // TODO (longer term): save voucher to submit later if deal fails
  }

  /**
   * Submit a signed payment voucher and update the payment channel.
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


    const pchs = appStore.pchStore.get(dealId);
    let pch = pchs[0];
    let pchAmount = this.lotus.decodeSignedVoucher(pch.voucher).amount;

    pchs.forEach(item => {
      const decodedVoucher = this.lotus.decodeSignedVoucher(item.voucher);
      if (decodedVoucher.amount > pchAmount) {
        pch = item;
        pchAmount = decodedVoucher.amount;
      }
    })

    appStore.logsStore.logDebug(
      `Provider.submitPaymentVoucher: pchStore[${dealId}] pch : ${pch.pch} , voucher : ${pch.voucher}`,
    )

    const isUpdateSuccessful = await this.lotus.updatePaymentChannel(pch.pch, pch.voucher)
    appStore.logsStore.logDebug(`Provider.submitPaymentVoucher: isUpdateSuccessful=${isUpdateSuccessful}`)
    if (!isUpdateSuccessful) {
      throw new Error('ERROR: Provider.submitPaymentVoucher: failed to submit voucher')
    }

    appStore.pchStore.delete(dealId);
  }

  sendDealCompleted({ dealId }) {
    appStore.logsStore.logDebug(`Provider.sendDealCompleted(): sending deal completed ${dealId}`)

    const deal = appStore.dealsStore.getOutboundDeal(dealId)
    deal.sink.push({ dealId, status: dealStatuses.completed })
  }

  async closeDeal({ dealId }) {
    const deal = appStore.dealsStore.getOutboundDeal(dealId)

    const paymentChannel = deal.paymentChannel

    appStore.logsStore.logDebug(`Provider.closeDeal: dealId=${dealId}, paymentChannel=${paymentChannel}`)

    if (paymentChannel) {
      this.updateCustomStatus(deal, 'Settling payment channel')
      await this.lotus.settlePaymentChannel(paymentChannel)

      this.updateCustomStatus(deal, 'Enqueueing channel collection')
      await this.pendCollectOperation(dealId, paymentChannel)
    }

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
