import { Duration } from 'luxon'
import { makeAutoObservable } from 'mobx'

import { AppStore } from './appStore'

const searchingMessageDuration = Duration.fromObject({ seconds: 30 }).valueOf()

export class OffersStore {
  offerInfo = {
    cid: undefined,
    offers: [],
    params: undefined,
  }

  searching = false
  searchingTimeout: any = 0
  notFound = false

  constructor(private rootStore: AppStore) {
    makeAutoObservable(this)
  }

  clear() {
    this.offerInfo = {
      cid: undefined,
      offers: [],
      params: undefined,
    }

    clearTimeout(this.searchingTimeout)
    this.searching = false
    this.notFound = false
  }

  add(cid: any, offer) {
    const offers = this.offerInfo?.offers || []

    this.offerInfo = {
      ...this.offerInfo,
      cid,
      offers: offers.concat(offer),
    }

    this.notFound = false
  }

  triggerSearch() {
    this.searching = true
    this.notFound = false

    clearTimeout(this.searchingTimeout)
    this.searchingTimeout = setTimeout(() => {
      this.searching = false
      this.notFound = !this.offerInfo.offers?.length
    }, searchingMessageDuration)
  }
}
