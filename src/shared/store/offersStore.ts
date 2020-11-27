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
}
