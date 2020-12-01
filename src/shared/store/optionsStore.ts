import { makeAutoObservable, remove, set, toJS } from 'mobx'

import { stringify } from '../stringify'
import { AppStore } from './appStore'

export class OptionsStore {
  private readonly localStorageKey = `_${this.constructor.name}`

  knownCids = {}

  wallet = ''
  privateKey = ''

  walletPlaceholder = 'f156e3l2vwd5wi5jwdrd6gdg4y7t2yknq6see7xbq'
  privateKeyPlaceholder = 'ciiFbmF7F7mrVs5E/IT8TV63PdFPLrRs9R/Cc3vri2I='

  pricesPerByte = { '*': 1000 }

  automationCode =
    '//Dummy example (code will run every 10 minutes)\n' +
    "// Here's how to query the storage market for a CID\n" +
    'let cid = "bafk2bzacedgizbdbiiji5rohflf47ax2zgmnkbl2kx3nezrr2ygb7mxdoc3x6"\n' +
    '//this.query(cid) //if peers has this it will be retrieve\n' +
    '////////////////////////////////////////////////////////////////////////////////////\n' +
    "// Here's how to retrieve a CID from a storage miner\n" +
    "//let amt = '12';\n" +
    "//let miner = 't1234';\n" +
    '//this.retrieveFromStorageMiner(cid, miner, amt); //dummy for now\n' +
    '////////////////////////////////////////////////////////////////////////////////////\n' +
    "// Here's how to change the price of a CID your node is offering\n" +
    'let price = "5000"; // total price for the CID (Price/byte AttoFIL)\n' +
    'this.updatePrice(cid, price);'

  unsaved = false
  unsavedForms = { lotus: false, price: false }

  constructor(private rootStore: AppStore) {
    const propNames = Object.getOwnPropertyNames(this)
    const stored = JSON.parse(localStorage.getItem(this.localStorageKey) || '{}')
    for (const propName of propNames) {
      this[propName] = stored[propName] || this[propName]
    }

    makeAutoObservable(this)
  }

  addKnownCid(cid: string, size: any) {
    set(this.knownCids, cid, { size })

    this._save()
  }

  set(data: Partial<OptionsStore>) {
    const keys = Object.keys(data)

    for (const key of keys) {
      this[key] = data[key]
    }

    this._save()
  }

  removeKnownCid(cid: string) {
    remove(this.knownCids, cid)

    this._save()
  }

  removePrice(cid: any) {
    remove(this.pricesPerByte, cid)

    this._save()
  }

  private _save() {
    localStorage.setItem(this.localStorageKey, stringify(toJS(this)))
  }
}
