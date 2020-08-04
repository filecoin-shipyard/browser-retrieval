/* global chrome */

export const defaultOptions = {
  rendezvousIp: 'jsrc-bootstrap.goelzer.io',
  rendezvousPort: '443',
  knownCids: {},
  wallet: '',
  privateKey: '',
  lotusEndpoint: 'http://127.0.0.1:1234/rpc/v0',
  lotusToken: '',
  getDealParamsHook: `return {
  pricePerByte: 1000,
  paymentInterval: 1024 * 1024,
  paymentIntervalIncrease: 1024 * 1024,
};`,
};

export const optionsKeys = Object.keys(defaultOptions);

function getOptions() {
  return new Promise(resolve => {
    chrome.storage.local.get(optionsKeys, result => {
      resolve({ ...defaultOptions, ...result });
    });
  });
}

export default getOptions;
