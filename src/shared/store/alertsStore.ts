import { makeAutoObservable } from 'mobx'
import { AppStore } from './appStore'

interface AlertMessage {
  id: number
  message: string
  type: string
}

export class AlertsStore {
  alerts = []

  constructor(private rootStore: AppStore) {
    makeAutoObservable(this)
  }

  create(alert: AlertMessage) {
    this.alerts.push(alert)
  }

  dismiss(id: number) {
    // const index = this.alerts.findIndex((v) => v === id)
    //
    // if (index >= 0) {
    //   this.alerts.splice(index, 1)
    // }

    return this.alerts = [];
  }
}
