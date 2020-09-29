/* global chrome */

import getOptions from '../shared/getOptions.js';
import onOptionsChanged from '../shared/onOptionsChanged.js';
import messageTypes from '../shared/messageTypes.js';
import ports from './ports.js';
import Node from './Node.js';

ports.startListening();

let node;

chrome.runtime.onMessage.addListener(({ messageType, cid }, sender, sendResponse) => {
  switch (messageType) {
    case messageTypes.uploadFiles:
      node.uploadFiles(window.filesToUpload);
      break;

    case messageTypes.downloadFile:
      node.downloadFile(cid);
      break;

    case messageTypes.deleteFile:
      node.deleteFile(cid);
      break;

    case messageTypes.query:
      node.query(cid);
      break;

    case messageTypes.automationStart:
      node.runAutomationCode();
      break;

    case messageTypes.automationStop:
      node.stopLoop();
      break;

    case messageTypes.clearLogs:
      ports.clearLogs();
      break;

    case messageTypes.openExtensionInBrowser:
      openExtensionInBrowser();
      break;

    default:
      break;
  }
});

onOptionsChanged(async changes => {
  if (!node || changes['rendezvousIp'] || changes['rendezvousPort']) {
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
  try {
    const options = await getOptions();
    node = await Node.create(options);
  } catch (error) {
    if (error === 'Error: `Invalid Key Length`') {
      ports.postLog(`ERROR: start node failed: ${error}`);
      ports.postLog('INFO: fix your lotus config on the Options page');
    } else {
      console.error(error);
      ports.postLog(`ERROR: start node failed: ${error.message}`);
    }
  }
}

function openExtensionInBrowser() {
  chrome.tabs.create({
    url: "home.html"
  });
}

startNode();
