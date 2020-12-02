interface DealChannels {
  id: string
  sink?: any
  importerSink?: any
  importer?: any
}

interface OngoingDealsDictionary {
  [key: string]: DealChannels
}

export const ongoingDeals: OngoingDealsDictionary = {}
