/* global chrome */

const portsByChannel = {};
const lastMessages = {};

const ports = {
  startListening() {
    chrome.runtime.onConnect.addListener(port => {
      const channel = port.name;

      if (!portsByChannel[channel]) {
        portsByChannel[channel] = new Set();
      }

      portsByChannel[channel].add(port);

      if (lastMessages[channel]) {
        port.postMessage(lastMessages);
      }
    });

    chrome.runtime.onConnect.addListener(port => {
      const channel = port.name;

      portsByChannel[channel].delete(port);
    });
  },

  postMessage(channel, message) {
    lastMessages[channel] = message;

    if (portsByChannel[channel]) {
      portsByChannel[channel].forEach(port => port.postMessage(message));
    }
  },
};

export default ports;
