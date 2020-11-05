/* global chrome */
import { env } from 'src/shared/environments/env';

/**
 * Options that cannot be overwritten in Chrome's storage
 */
const hardCodedOptions = {
  ...env,
};

/**
 * Settings that are supposed to be overwritten in Chrome's storage
 */
const dynamicOptions = {
  knownCids: {},

  wallet: '',
  privateKey: '',

  offerInfo: {
    cid: undefined,
    offers: [],
    params: undefined,
  },
  automationCode:
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
    'this.updatePrice(cid, price);',

  unsaved: false,
  unsavedForms: { lotus: false, price: false },
  showWalletModal: false,
};

export const optionsKeys = [...Object.keys(hardCodedOptions), ...Object.keys(dynamicOptions)];

/**
 * @returns {typeof hardCodedOptions & typeof dynamicOptions} options
 */
function getOptions() {
  return new Promise((resolve) => {
    chrome.storage.local.get(optionsKeys, (result) => {
      resolve({ ...dynamicOptions, ...result, ...hardCodedOptions });
    });
  });
}

export default getOptions;
