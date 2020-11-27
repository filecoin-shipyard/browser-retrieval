import { dealStatuses } from 'shared/dealStatuses'

export const hasOngoingDeals = () => {
  return !!Object.keys(ongoingDeals).length
}

interface Deal {
  id?: number
  status?: typeof dealStatuses | string
  customStatus?: string
  cid?: string
  params?: any
  peerMultiaddr?: string
  peerWallet?: string
  sink?: any
  sizeReceived?: number
  sizePaid?: number
  importerSink?: any
  importer?: any
  voucherNonce?: number
  paymentChannel?: string
  Lane?: number
}

interface OngoingDealsDictionary {
  [key: string]: Deal
}

export const ongoingDeals: OngoingDealsDictionary = {}

export const convertDealsToArray = (deals) => {
  return Object.values(deals).map(({ id, cid, params, sizeReceived, sizeSent, status, customStatus }) => ({
    id,
    cid,
    params,
    sizeReceived,
    sizeSent,
    status,
    customStatus,
  }))
}
