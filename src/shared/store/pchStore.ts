import { makeAutoObservable } from 'mobx'
import { autosave } from 'shared/autoSaveDecorator'

import { AppStore } from './appStore'

interface PCH {
  dealId: string
  pch: string
  voucher: string
}

export class PCHStore {
  private readonly localStorageKey = '_PCHStore'

  PCHs: PCH[] = []

  constructor(private rootStore: AppStore) {
    makeAutoObservable(this)
  }

  @autosave
  save(pch: PCH) {
    this.PCHs.push(pch);
  }

  @autosave
  delete(dealId: string) {
    this.PCHs = this.PCHs.filter(item => item.dealId !== dealId);
  }

  get(dealId: string) {
    return this.PCHs.filter(item => item.dealId === dealId);
  }


}
