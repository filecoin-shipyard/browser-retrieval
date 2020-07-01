/* global chrome */

const defaultValues = {
  port: 1234,
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
