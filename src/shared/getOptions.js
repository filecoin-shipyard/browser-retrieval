/* global chrome */

const defaultValues = {
  rendezvousIp: 'jsrc-bootstrap.goelzer.io',
  rendezvousPort: '443',
  pricesPerByte: { '*': 1000 },
  knownCids: {},
  wallet: '',
  privateKey: '',
  lotusEndpoint: 'http://127.0.0.1:1234/rpc/v0',
  lotusToken: '',
  paymentInterval: 1024 * 1024,
  paymentIntervalIncrease: 1024 * 1024,
  automationCode:
      '//Dummy example (code will run every 10 minutes)\n' +
      '// Here\'s how to query the storage network for a CID\n' +
      'let cid = "bafk2bzacedgizbdbiiji5rohflf47ax2zgmnkbl2kx3nezrr2ygb7mxdoc3x6"\n' +
      'let asks = this.queryStorageMiners(cid)  // dummy func for now\n' +
      '////////////////////////////////////////////////////////////////////////////////////\n' +
      '// Here\'s how to retrieve a CID from a storage miner\n' +
      'let amt = \'12\';\n' +
      'let miner = \'t1234\';\n' +
      'this.retrieveFromStorageMiner(cid, miner, amt); //dummy for now\n' +
      '////////////////////////////////////////////////////////////////////////////////////\n' +
      '// Here\'s how to change the price of a CID your node is offering\n' +
      'let priceInFil = "0.000000005"; // total price for the CID\n' +
      'this.updatePrice(cid, priceInFil);'
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
