/* global chrome */

import channels from 'src/shared/channels';

const portsByChannel = {};
const lastMessages = {};
const logs = [];

const ports = {
  startListening() {
    chrome.runtime.onConnect.addListener(port => {
      const channel = port.name;

      if (!portsByChannel[channel]) {
        portsByChannel[channel] = new Set();
      }

      portsByChannel[channel].add(port);

      if (lastMessages[channel]) {
        port.postMessage(lastMessages[channel]);
      }

      port.onDisconnect.addListener(port => {
        const channel = port.name;

        portsByChannel[channel].delete(port);
      });
    });
  },

  postMessage(channel, message) {
    lastMessages[channel] = message;

    if (portsByChannel[channel]) {
      portsByChannel[channel].forEach(port => port.postMessage(message));
    }
  },

  postListeningState(multiaddrs) {
    ports.postMessage(channels.listening, multiaddrs.join('\n'));
  },

  postPeers(connectedPeers) {
    ports.postMessage(
      channels.peers,
      connectedPeers.size ? Array.from(connectedPeers).join('\n') : 'Not connected to any peer',
    );
  },

  postLog(message) {
    logs.push(message);
    ports.postMessage(channels.logs, logs.join('\n'));
  },
};

export default ports;
