import { makeAutoObservable } from 'mobx'
import { autosave } from 'shared/autoSaveDecorator'
import { Operations } from 'shared/Operations'

import { AppStore } from './appStore'

interface Operation {
  id?: any
  label: string
  invokeAt: any
  output?: string
  status?: any
  f: keyof Operations
  metadata: Record<string, any>
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

  @autosave
  setOperations(value) {
    this._operations = value
  }

  @autosave
  queue(op: Operation) {
    this._operations.push({
      ...op,
      id: op.id || Date.now() + Math.random().toString(36).substr(2, 9),
    })
  }

  @autosave
  dequeue(op) {
    const index = this._operations.findIndex((o) => o.id === op.id)

    if (index >= 0) {
      this._operations.splice(index, 1)
    }
  }

  @autosave
  update(operation: Operation, props) {
    for (const [i, op] of Object.entries(this._operations)) {
      if (op.id === operation.id) {
        this._operations[i] = { ...op, ...props }
      }
    }
  }
}
