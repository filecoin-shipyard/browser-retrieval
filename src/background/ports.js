/* global chrome */
import channels from 'src/shared/channels';

import * as toast from '../shared/toast.js';

const debug = true;
const portsByChannel = {};
const lastMessages = {};
const deals = { inbound: [], outbound: [] };
const logs = [];

const ports = {
  startListening() {
    chrome.runtime.onConnect.addListener((port) => {
      const channel = port.name;

      if (!portsByChannel[channel]) {
        portsByChannel[channel] = new Set();
      }

      portsByChannel[channel].add(port);

      if (lastMessages[channel]) {
        port.postMessage(lastMessages[channel]);
      }

      port.onDisconnect.addListener((port) => {
        const channel = port.name;

        portsByChannel[channel].delete(port);
      });
    });
  },

  postMessage(channel, message) {
    lastMessages[channel] = message;

    if (portsByChannel[channel]) {
      portsByChannel[channel].forEach((port) => port.postMessage(message));
    }
  },

  postMultiaddrs(multiaddrs) {
    ports.postMessage(channels.multiaddrs, multiaddrs);
  },

  postPeers(connectedPeers) {
    ports.postMessage(channels.peers, connectedPeers);
  },

  postUploadProgress(progress) {
    ports.postMessage(channels.uploadProgress, progress);
  },

  postInboundDeals(inbound) {
    deals.inbound = ports.mapDeals(inbound);
    ports.postMessage(channels.deals, deals);
  },

  postOutboundDeals(outbound) {
    deals.outbound = ports.mapDeals(outbound);
    ports.postMessage(channels.deals, deals);
  },

  mapDeals(deals) {
    return Object.values(deals).map(({ id, cid, params, sizeReceived, sizeSent, status, customStatus }) => ({
      id,
      cid,
      params,
      sizeReceived,
      sizeSent,
      status,
      customStatus,
    }));
  },

  postLog(message) {
    if (!message.startsWith('DEBUG') || debug) {
      logs.push(message);
      ports.postMessage(channels.logs, logs);
    }
  },

  alertError(message) {
    toast.create({ message, type: 'error' });
  },

  alertWarning(message) {
    toast.create({ message, type: 'warning' });
  },

  alertSuccess(message) {
    toast.create({ message, type: 'success' });
  },

  clearLogs() {
    logs.splice(0, logs.length);
    ports.postMessage(channels.logs, logs);
  },
};

export default ports;
