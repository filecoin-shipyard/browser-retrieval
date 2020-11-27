import { makeAutoObservable } from 'mobx'
import { AppStore } from './appStore'

interface Deal {
  id: any
  [key: string]: any
}

interface DealInfo {
  inbound: Deal[]
  outbound: Deal[]
}

export class DealsStore {
  deals: DealInfo = {
    inbound: [],
    outbound: [],
  }

  ongoingDeals: DealInfo = {
    inbound: [],
    outbound: [],
  }

  constructor(private rootStore: AppStore) {
    makeAutoObservable(this)
  }

  setInboundDeals(inboundDeals: any[]) {
    this.ongoingDeals.inbound = inboundDeals
  }

  setOutboundDeals(outboundDeals: any[]) {
    this.ongoingDeals.outbound = outboundDeals
  }
}
