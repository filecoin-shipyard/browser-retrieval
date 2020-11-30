import { makeAutoObservable } from 'mobx'
import { AppStore } from './appStore'

export class QueriesStore {
  cid = ''
  checked = false

  constructor(private rootStore: AppStore) {
    makeAutoObservable(this)
  }

  setCid(cid: string) {
    this.cid = cid
  }

  toggleChecked() {
    this.checked = !this.checked
  }
}
