/* global chrome */

import getOptions from './shared/getOptions.js';
import messageTypes from './shared/messageTypes.js';
import ports from './background/ports.js';
import Peer from './background/Peer.js';

ports.startListening();

let peer;

chrome.runtime.onMessage.addListener(async ({ messageType, cid }) => {
  switch (messageType) {
    case messageTypes.rendezvousChanged:
      ports.postLog('INFO: restarting');
      await peer.stop();
      await createAndStartPeer();
      break;

    case messageTypes.query:
      peer.query(cid);
      break;

    default:
      break;
  }
});

async function createAndStartPeer() {
  const options = await getOptions();
  peer = new Peer(options);
  peer.start();
}

createAndStartPeer().catch(error => ports.postLog(error.message));
