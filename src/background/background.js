/* global chrome */

import getOptions from '../shared/getOptions.js';
import setOptions from 'src/shared/setOptions';
import onOptionsChanged from '../shared/onOptionsChanged.js';
import messageTypes from '../shared/messageTypes.js';
import ports from './ports.js';
import Node from './Node.js';

ports.startListening();

let node;

chrome.runtime.onMessage.addListener(({ messageType, msg }, sender, sendResponse) => {
  switch (messageType) {
    case messageTypes.uploadFiles:
      ports.postLog("DEBUG: global chrome: case messageTypes.uploadFiles")
      node.uploadFiles(window.filesToUpload);
      break;

    case messageTypes.downloadFile:
      ports.postLog("DEBUG: global chrome: case messageTypes.downloadFile")
      node.downloadFile(msg);
      break;

    case messageTypes.deleteFile:
      ports.postLog("DEBUG: global chrome: case messageTypes.deleteFile")
      node.deleteFile(msg.cid);
      break;

    case messageTypes.query:
      ports.postLog("DEBUG: global chrome: case messageTypes.query")
      node.query(msg.cid, msg.minerID);
      break;

    case messageTypes.automationStart:
      ports.postLog("DEBUG: global chrome: case messageTypes.automationStart")
      node.runAutomationCode();
      break;

    case messageTypes.automationStop:
      ports.postLog("DEBUG: global chrome: case messageTypes.automationStop")
      node.stopLoop();
      break;

    case messageTypes.clearLogs:
      ports.postLog("DEBUG: global chrome: case messageTypes.clearLogs")
      ports.clearLogs();
      break;

    case messageTypes.openExtensionInBrowser:
      ports.postLog("DEBUG: global chrome: case messageTypes.openExtensionInBrowser")
      openExtensionInBrowser();
      break;

    default:
      ports.postLog("WARN: global chrome: unrecognized message received in background.js switch: messageType='"+messageType+"'")
      break;
  }
});

onOptionsChanged(async changes => {
  if (!node ||
      (changes.rendezvousIp?.oldValue && changes['rendezvousIp']['oldValue'] !== changes['rendezvousIp']['newValue']) ||
      (changes.rendezvousPort?.oldValue && changes['rendezvousPort']['oldValue'] !== changes['rendezvousPort']['newValue'])) {
    ports.postLog('INFO: restarting');

    if (node) {
      try {
        await node.stop();
      } catch (error) {
        console.error(error);
        ports.postLog(`ERROR: stop node failed: ${error.message}`);
      }
    }

    await startNode();
  }
});

async function startNode() {
  const options = await getOptions();

  if (options.wallet !== '' || options.privateKey !== '') {
    try {
      node = await Node.create(options);
    } catch (error) {
      if (error === 'Error: `Invalid Key Length`') {
        ports.postLog(`ERROR: start node failed: ${error}`);
        console.error(error);
      } else {
        console.error(error);

        const emsg = `ERROR: start node failed: ${error.message}`
        ports.postLog(emsg);
        ports.alertError(emsg);
      }
    }
  }
}

function openExtensionInBrowser() {
  chrome.tabs.create({
    url: "home.html"
  });
}

async function startPoint() {
  const options = await getOptions();

  if (options.wallet === '' || options.privateKey === '') {
    await setOptions({
      ...options,
      showWalletModal: true,
    });
  }
}

startPoint();
