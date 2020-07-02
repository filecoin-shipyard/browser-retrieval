/* global chrome */

const defaultValues = {
  rendezvousIp: '127.0.0.1',
  rendezvousPort: '9090',
  pricePerByte: { '*': 0.0000000001 },
};

function getOptions() {
  return new Promise(resolve => {
    chrome.storage.local.get(Object.keys(defaultValues), result => {
      resolve({ ...defaultValues, ...result });
    });
  });
}

export default getOptions;
