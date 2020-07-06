/* global chrome */

import CID from 'cids';
import multihash from 'multihashing-async';
import getOptions from './getOptions';

async function setData(data) {
  const content = data.split(',')[1];
  const buffer = multihash.Buffer.from(content, 'base64');
  const [hash, { knownCids }] = await Promise.all([multihash(buffer, 'sha2-256'), getOptions()]);
  const cid = new CID(1, 'multiaddr', hash).toString();

  chrome.storage.local.set({
    [cid]: data,
    knownCids: {
      ...knownCids,
      [cid]: {
        size: content.length,
      },
    },
  });
}

export default setData;
