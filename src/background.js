/* global chrome */

import getOptions from './shared/getOptions.js';
import onOptionsChanged from './shared/onOptionsChanged.js';
import messageTypes from './shared/messageTypes.js';
import ports from './background/ports.js';
import Peer from './background/Peer.js';

ports.startListening();

let peer;

chrome.runtime.onMessage.addListener(({ messageType, cid }) => {
  if (messageType === messageTypes.query) {
    peer.query(cid);
  }
});

onOptionsChanged(async changes => {
  if (changes['rendezvousIp'] || changes['rendezvousPort']) {
    ports.postLog('INFO: restarting');
    await peer.stop();
    await createAndStartPeer();
  }
});

async function createAndStartPeer() {
  const options = await getOptions();
  peer = new Peer(options);
  peer.start();
}

createAndStartPeer().catch(error => ports.postLog(error.message));
