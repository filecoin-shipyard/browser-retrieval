/* global chrome */

import CID from 'cids';
import multihash from 'multihashing-async';
import getOptions from './getOptions';

async function setData(data) {
  const buffer = multihash.Buffer.from(data);
  const hash = await multihash(buffer, 'sha2-256');
  const cid = new CID(1, 'multiaddr', hash).toString();
  const { knownCids } = await getOptions();
  const newKnownCids = knownCids.includes(cid) ? knownCids : [...knownCids, cid];
  chrome.storage.local.set({ [cid]: data, knownCids: newKnownCids });
}

export default setData;
