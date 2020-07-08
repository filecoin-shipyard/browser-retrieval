/* global chrome */

import getOptions from './shared/getOptions.js';
import onOptionsChanged from './shared/onOptionsChanged.js';
import messageTypes from './shared/messageTypes.js';
import ports from './background/ports.js';
import Peer from './background/Peer.js';

ports.startListening();

let peer;

chrome.runtime.onMessage.addListener(({ messageType, cid }, sender, sendResponse) => {
  switch (messageType) {
    case messageTypes.uploadFiles:
      peer.uploadFiles(window.filesToUpload);
      break;

    case messageTypes.downloadFile:
      peer.downloadFile(cid);
      break;

    case messageTypes.deleteFile:
      peer.deleteFile(cid);
      break;

    case messageTypes.query:
      peer.query(cid);
      break;

    case messageTypes.clearLogs:
      ports.clearLogs();
      break;

    default:
      break;
  }
});

onOptionsChanged(async changes => {
  if (changes['rendezvousIp'] || changes['rendezvousPort']) {
    ports.postLog('INFO: restarting');
    await peer.stop();
    await startPeer();
  }
});

async function startPeer() {
  const options = await getOptions();
  peer = await Peer.create(options);
}

startPeer().catch(error => {
  console.error(error);
  ports.postLog(`ERROR: ${error.message}`);
});
