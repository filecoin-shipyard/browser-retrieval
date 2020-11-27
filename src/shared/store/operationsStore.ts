import { makeAutoObservable, toJS } from 'mobx'

import { stringify } from '../stringify'
import { AppStore } from './appStore'

interface Operation {
  id: any
  label: string
  invokeAt: Date
  output: string
  status: any
}

export class OperationsStore {
  private readonly localStorageKey = `_${this.constructor.name}`

  private _operations: Operation[] = []

  constructor(private rootStore: AppStore) {
    const propNames = Object.getOwnPropertyNames(this)
    const stored = JSON.parse(localStorage.getItem(this.localStorageKey) || '{}')
    for (const propName of propNames) {
      this[propName] = stored[propName] || this[propName]
    }

    makeAutoObservable(this)
  }

  get operations() {
    return this._operations?.map((op) => ({
      ...op,
      invokeAt: op.invokeAt ? new Date(op.invokeAt) : undefined,
    })) as Operation[]
  }

  setOperations(value) {
    this._operations = value

    this._save()
  }

  queue(op) {
    this._operations.push(op)
    this._save()
  }

  dequeue(op) {
    const index = this._operations.findIndex((o) => o.id === op.id)

    if (index >= 0) {
      this._operations.splice(index, 1)
    }
    this._save()
  }

  update(operation, props) {
    for (const [i, op] of Object.entries(this._operations)) {
      if (op.id === operation.id) {
        this._operations[i] = { ...op, ...props }
      }
    }

    this._save()
  }

  private _save() {
    localStorage.setItem(this.localStorageKey, stringify(toJS(this)))
  }
}
