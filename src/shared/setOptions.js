/* global chrome */

async function setOptions(data) {
  await chrome.storage.local.set(data);
}

export default setOptions;
