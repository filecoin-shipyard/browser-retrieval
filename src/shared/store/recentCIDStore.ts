import { DateTime } from 'luxon'
import { makeAutoObservable } from 'mobx'
import { autosave } from 'shared/autoSaveDecorator'

import { AppStore } from './appStore'

interface RecentCID {
  cid: string
  date: Date
}

const recentTimeLimit = { hours: 72 }
const limit = 10

export class RecentCIDStore {
  private readonly localStorageKey = `_${this.constructor.name}`

  recentCIDs: RecentCID[] = []

  constructor(private rootStore: AppStore) {
    const propNames = Object.getOwnPropertyNames(this)
    const stored = JSON.parse(localStorage.getItem(this.localStorageKey) || '{}')
    for (const propName of propNames) {
      this[propName] = stored[propName] || this[propName]
    }

    this.recentCIDs = this.recentCIDs.filter(
      (rcid) => DateTime.fromISO((rcid.date as any) as string) > DateTime.local().minus(recentTimeLimit),
    )

    makeAutoObservable(this)
  }

  @autosave
  addOrUpdate(cid: string) {
    const { entry, index } = this.findRecentByCid(cid)

    if (entry) {
      this.recentCIDs.splice(index, 1)
      this.recentCIDs.unshift({
        ...entry,
        date: new Date(),
      })
    } else {
      this.recentCIDs.unshift({
        cid,
        date: new Date(),
      })

      this.recentCIDs.splice(limit)
    }
  }

  private findRecentByCid(cid: string) {
    const index = this.recentCIDs.findIndex((rcid) => rcid.cid === cid)

    return {
      entry: this.recentCIDs[index],
      index,
    }
  }
}
