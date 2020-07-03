/* global chrome */

import getOptions from './getOptions';

async function removeData(cid) {
  const { knownCids } = await getOptions();

  chrome.storage.local.remove(cid, () => {
    chrome.storage.local.set({ knownCids: knownCids.filter(c => c !== cid) });
  });
}

export default removeData;
