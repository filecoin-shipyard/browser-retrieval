/* global chrome */

async function getData(cid) {
  return new Promise(resolve => {
    chrome.storage.local.get(cid, ({ [cid]: data }) => resolve(data));
  });
}

export default getData;
