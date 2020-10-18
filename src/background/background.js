/* global chrome */

import getOptions from '../shared/getOptions.js';
import onOptionsChanged from '../shared/onOptionsChanged.js';
import messageTypes from '../shared/messageTypes.js';
import ports from './ports.js';
import Node from './Node.js';

ports.startListening();

let node;

chrome.runtime.onMessage.addListener(({ messageType, msg }, sender, sendResponse) => {
  switch (messageType) {
    // TEMP - WASM INTEG TEST
    case messageTypes.mikeMessage:
      ports.postLog(`DEBUG: >>> messageTypes.mikeMessage (messageType='${messageType}') <<<<`)
      //const offerJsonStr = '{"paymentInterval":1048576,"paymentIntervalIncrease":1048576,"pricePerByte":10,"size":3775,"wallet":"f1jej4xfb2347wwy53mg3i3usje3exrp7mjk7i57a"}'
      const cid = 'QmVmEHjr6xtNxHDbJ7kXenYMH6C4ZGpjqNnMeAEk9dQcR3';
      const offerJsonStr = '{"address":"/dns4/webrtc-star-1.browser-retrieval.filecoin.io/tcp/443/wss/p2p-webrtc-star/p2p/QmXujxM6wb3pbwXDVGKrbzT93WDR739jd5PuQLLhtJVcke","params":{"paymentInterval":1048576,"paymentIntervalIncrease":1048576,"pricePerByte":1,"size":3775,"wallet":"f1jej4xfb2347wwy53mg3i3usje3exrp7mjk7i57a"},"price":3775}';
      const offer = JSON.parse(offerJsonStr)
      ports.postLog(`DEBUG: background.js:  offer=${JSON.stringify(offer)}`)
      const args = { cid: cid, offer: offer };
      node.queriedCids.add(cid);
      node.downloadFile(args);
      break;
    // END - TEMP

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
