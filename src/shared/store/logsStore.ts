import { makeAutoObservable } from 'mobx'
import { AppStore } from './appStore'

export class LogsStore {
  logs: string[] = []

  constructor(private rootStore: AppStore) {
    makeAutoObservable(this)
  }

  clear() {
    this.logs = []
  }

  logDebug(...args) {
    this.logs.push(`DEBUG: ${args.join(' ')}`)
    console.debug(...args)
  }

  log(...args) {
    this.logs.push(`INFO: ${args.join(' ')}`)
    console.info(...args)
  }

  logError(...args) {
    this.logs.push(`ERROR: ${args.join(' ')}`)
    console.error(...args)
  }
}
