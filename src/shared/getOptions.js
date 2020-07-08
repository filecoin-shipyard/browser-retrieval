/* global chrome */

const defaultValues = {
  rendezvousIp: 'jsrc-bootstrap.goelzer.io',
  rendezvousPort: '443',
  pricesPerByte: { '*': 0.0000000001 },
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
