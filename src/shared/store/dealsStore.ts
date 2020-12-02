import { get, makeAutoObservable, remove, set } from 'mobx'
import { dealStatuses } from 'shared/dealStatuses'

import { ongoingDeals } from '../ongoingDeals'
import { AppStore } from './appStore'

interface Deal {
  id: string
  status?: typeof dealStatuses | string
  customStatus?: string
  cid?: string
  params?: any
  peerMultiaddr?: string
  peerWallet?: string
  sink?: any
  sizeReceived?: number
  sizePaid?: number
  importerSink?: any
  importer?: any
  voucherNonce?: number
  paymentChannel?: string
  Lane?: number
}

export class DealsStore {
  inboundDeals: Deal[] = []
  outboundDeals: Deal[] = []

  constructor(private rootStore: AppStore) {
    makeAutoObservable(this)
  }

  hasOngoingDeals() {
    const inboundCheck = this.inboundDeals?.length
    const outboundCheck = this.outboundDeals?.length

    return inboundCheck || outboundCheck
  }

  setInboundDealProps(dealId: string, props) {
    const index = this.inboundDeals.findIndex((d) => d.id === dealId)

    const val = get<any>(this.inboundDeals as any, index)

    set(this.inboundDeals, index, {
      ...val,
      ...props,
    })
  }

  createInboundDeal(deal: Deal) {
    const { sink, importerSink, importer } = deal

    delete deal.sink
    delete deal.importerSink
    delete deal.importer

    ongoingDeals[deal.id] = { id: deal.id, sink, importerSink, importer }
    this.inboundDeals.push(deal)
  }

  removeInboundDeal(dealId: any) {
    const index = this.inboundDeals.findIndex((d) => d.id === dealId)

    remove(this.inboundDeals, index as any)
    delete ongoingDeals[dealId]
  }

  getInboundDeal(dealId: string) {
    const dealChannels = ongoingDeals[dealId]
    const deal = this.inboundDeals.find((d) => d.id === dealId)

    return {
      ...deal,
      ...dealChannels,
    }
  }

  _convertDealsToArray(deals) {
    return Object.values(deals).map(({ id, cid, params, sizeReceived, sizeSent, status, customStatus }) => ({
      id,
      cid,
      params,
      sizeReceived,
      sizeSent,
      status,
      customStatus,
    }))
  }
}
