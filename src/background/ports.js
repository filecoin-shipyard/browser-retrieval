/* global chrome */

const portsByChannel = {};
const lastMessages = {};

const ports = {
  startListening() {
    chrome.runtime.onConnect.addListener(port => {
      const channel = port.name;

      if (!portsByChannel[channel]) {
        portsByChannel[channel] = [];
      }

      portsByChannel[channel].push(port);

      if (lastMessages[channel]) {
        port.postMessage(lastMessages);
      }
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
