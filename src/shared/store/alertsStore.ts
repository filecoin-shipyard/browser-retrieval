import { makeAutoObservable } from 'mobx'
import { AppStore } from './appStore'

interface AlertMessage {
  id?: number | string
  message: string
  type: 'error' | 'warning'
}

export class AlertsStore {
  alerts = []

  constructor(private rootStore: AppStore) {
    makeAutoObservable(this)
  }

  create(alert: AlertMessage) {
    let { id } = alert

    if (!id) {
      id = `${Date.now()}-${Math.random()}`
    }

    this.alerts.push({
      ...alert,
      id,
    })
  }

  dismiss(id: number) {
    const index = this.alerts.findIndex((v) => v.id === id)

    if (index >= 0) {
      this.alerts.splice(index, 1)
    }
  }
}
