import { makeAutoObservable } from 'mobx'
import { AppStore } from './appStore'

export class SettingsStore {
  rendezvousIp = process.env.REACT_APP_RENDEZVOUS_IP || 'webrtc-star-1.browser-retrieval.filecoin.io'
  rendezvousPort = process.env.REACT_APP_RENDEZVOUS_PORT || '443'
  wsEndpoint = process.env.REACT_APP_WS_ENDPOINT || 'wss://retrievalproxy.browser-retrieval.filecoin.io:443'
  lotusEndpoint = process.env.REACT_APP_LOTUS_ENDPOINT || 'https://cloud-lotus-1.browser-retrieval.filecoin.io/rpc/v0'
  lotusToken =
    process.env.REACT_APP_LOTUS_TOKEN ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBbGxvdyI6WyJyZWFkIiwid3JpdGUiLCJzaWduIiwiYWRtaW4iXX0.jtLE4n-cWr1lzvFVDj9wupSHqDJgvQFIRP2takFTbAo'
  paymentInterval = process.env.REACT_APP_PAYMENT_INTERVAL || 1048576
  paymentIntervalIncrease = process.env.REACT_APP_PAYMENT_INTERVAL_INCREASE || 1048576

  walletPlaceholder = process.env.REACT_APP_WALLET_PLACEHOLDER || 'f156e3l2vwd5wi5jwdrd6gdg4y7t2yknq6see7xbq'
  privateKeyPlaceholder =
    process.env.REACT_APP_PRIVATE_KEY_PLACEHOLDER || 'ciiFbmF7F7mrVs5E/IT8TV63PdFPLrRs9R/Cc3vri2I='

  constructor(private rootStore: AppStore) {
    makeAutoObservable(this)
  }
}
