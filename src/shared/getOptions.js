/* global chrome */

const defaultValues = {
  rendezvousIp: 'webrtc-star-1.browser-retrieval.filecoin.io',
  rendezvousPort: '443',
  pricesPerByte: { '*': 1000 },
  knownCids: {},
  wallet: '',
  privateKey: '',
  lotusEndpoint: 'http://3.231.219.184:80/rpc/v0',
  lotusToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBbGxvdyI6WyJyZWFkIiwid3JpdGUiLCJzaWduIiwiYWRtaW4iXX0.jtLE4n-cWr1lzvFVDj9wupSHqDJgvQFIRP2takFTbAo',
  paymentInterval: 1048576,
  paymentIntervalIncrease: 1048576,
  offerInfo: {
    cid: undefined,
    offers: [],
    params: undefined,
  },
  automationCode:
      '//Dummy example (code will run every 10 minutes)\n' +
      '// Here\'s how to query the storage market for a CID\n' +
      'let cid = "bafk2bzacedgizbdbiiji5rohflf47ax2zgmnkbl2kx3nezrr2ygb7mxdoc3x6"\n' +
      '//this.query(cid) //if peers has this it will be retrieve\n' +
      '////////////////////////////////////////////////////////////////////////////////////\n' +
      '// Here\'s how to retrieve a CID from a storage miner\n' +
      '//let amt = \'12\';\n' +
      '//let miner = \'t1234\';\n' +
      '//this.retrieveFromStorageMiner(cid, miner, amt); //dummy for now\n' +
      '////////////////////////////////////////////////////////////////////////////////////\n' +
      '// Here\'s how to change the price of a CID your node is offering\n' +
      'let price = "5000"; // total price for the CID (Price/byte AttoFIL)\n' +
      'this.updatePrice(cid, price);',
  unsaved: false,
  unsavedForms: {lotus: false, price: false},
  showWalletModal: false,
  walletPlaceholder: 'f156e3l2vwd5wi5jwdrd6gdg4y7t2yknq6see7xbq',
  privateKeyPlaceholder: 'ciiFbmF7F7mrVs5E/IT8TV63PdFPLrRs9R/Cc3vri2I='
};

export const optionsKeys = Object.keys(defaultValues);

function getOptions() {
  return new Promise(resolve => {
    chrome.storage.local.get(optionsKeys, result => {
      resolve({ ...defaultValues, ...result });
    });
  });
}

export default getOptions;
