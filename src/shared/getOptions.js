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
  codeEditor:
      '  ////////////////////////////////////////////////////////////////////////////////////\n' +
      '  // Here\'s how to query the storage network for a CID\n' +
      '  //let cid = "bafk2bzacedgizbdbiiji5rohflf47ax2zgmnkbl2kx3nezrr2ygb7mxdoc3x6"\n' +
      '  //let asks = _this.queryStorageMiners(cid)  // dummy func for now\n' +
      '  //for ask in asks {\n' +
      '  //  console.log(ask["price"], ask["minerId"])\n' +
      '  //}\n' +
      '\n' +
      '  ////////////////////////////////////////////////////////////////////////////////////\n' +
      '  // Here\'s how to retrieve a CID from a storage miner\n' +
      '  // let amt = asks[0]["price"];\n' +
      '  // let miner = ask[0]["minerId"];\n' +
      '  // _this.retrieveFromStorageMiner(cid, miner, amt); //dummy for now\n' +
      '\n' +
      '  ////////////////////////////////////////////////////////////////////////////////////\n' +
      '  // Here\'s how to change the price of a CID your node is offering\n' +
      '  // let cid = "bafk2bzacedgizbdbiiji5rohflf47ax2zgmnkbl2kx3nezrr2ygb7mxdoc3x6"\n' +
      '  // let priceInFil = "0.000000005"; // total price for the CID\n' +
      '  // cids.updatePrice(cid, priceInFil);\n' +
      '  \n',
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
