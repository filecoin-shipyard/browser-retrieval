import { makeAutoObservable } from 'mobx'
import { Node } from 'shared/Node'

import { AlertsStore } from './alertsStore'
import { DealsStore } from './dealsStore'
import { LogsStore } from './logsStore'
import { OffersStore } from './offersStore'
import { OperationsStore } from './operationsStore'
import { OptionsStore } from './optionsStore'
import { SettingsStore } from './settingsStore'
import { UploadStore } from './uploadStore'

export class AppStore {
  alertsStore: AlertsStore
  dealsStore: DealsStore
  logsStore: LogsStore
  offersStore: OffersStore
  operationsStore: OperationsStore
  optionsStore: OptionsStore
  settingsStore: SettingsStore
  uploadStore: UploadStore

  node: Node

  connected = false

  connectedPeers = []

  constructor() {
    this.alertsStore = new AlertsStore(this)
    this.dealsStore = new DealsStore(this)
    this.logsStore = new LogsStore(this)
    this.offersStore = new OffersStore(this)
    this.operationsStore = new OperationsStore(this)
    this.optionsStore = new OptionsStore(this)
    this.settingsStore = new SettingsStore(this)
    this.uploadStore = new UploadStore(this)

    makeAutoObservable(this)
  }

  async connect() {
    this.connected = true

    const { optionsStore } = this

    if (optionsStore.wallet !== '' || optionsStore.privateKey !== '') {
      try {
        this.node = await Node.create()
      } catch (error) {
        if (error === 'Error: `Invalid Key Length`') {
          this.logsStore.logDebug(`start node failed: ${error}`)
          console.error(error)
        } else {
          console.error(error)
          this.logsStore.logError(`start node failed: ${error.message}`)
        }
      }
    }
  }

  query({ cid, minerID }) {
    this.node.query(cid, minerID)
  }

  setConnectedPeers(connectedPeers) {
    this.connectedPeers = connectedPeers
  }

  downloadFile(msg: { cid: any; offers?: any }) {
    this.node.downloadFile(msg)
  }

  deleteFile({ cid }) {
    this.node.deleteFile(cid)
  }
}

export const appStore = new AppStore()
