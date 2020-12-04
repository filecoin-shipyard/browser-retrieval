export const env = {
  id: 'production',
  rendezvousIp: 'webrtc-star-1.browser-retrieval.filecoin.io',
  rendezvousPort: '443',
  pricesPerByte: { '*': 1000 },
  wsEndpoint: 'wss://retrievalproxy.browser-retrieval.filecoin.io:443',
  lotusEndpoint: 'https://cloud-lotus-1.browser-retrieval.filecoin.io/rpc/v0',
  lotusToken:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBbGxvdyI6WyJyZWFkIiwid3JpdGUiLCJzaWduIiwiYWRtaW4iXX0.jtLE4n-cWr1lzvFVDj9wupSHqDJgvQFIRP2takFTbAo',
  paymentInterval: 1048576,
  paymentIntervalIncrease: 1048576,

  walletPlaceholder: 'f156e3l2vwd5wi5jwdrd6gdg4y7t2yknq6see7xbq',
  privateKeyPlaceholder: 'ciiFbmF7F7mrVs5E/IT8TV63PdFPLrRs9R/Cc3vri2I=',
};
