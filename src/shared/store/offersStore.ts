import { makeAutoObservable } from 'mobx'
import { AppStore } from './appStore'

export class OffersStore {
  offerInfo = {
    cid: undefined,
    offers: [],
    params: undefined,
  }

  constructor(private rootStore: AppStore) {
    makeAutoObservable(this)
  }

  clear() {
    this.offerInfo = {
      cid: undefined,
      offers: [],
      params: undefined,
    }
  }

  add(cid: any, offer) {
    const offers = this.offerInfo?.offers || []

    this.offerInfo = {
      ...this.offerInfo,
      cid,
      offers: offers.concat(offer),
    }
  }
}
