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
