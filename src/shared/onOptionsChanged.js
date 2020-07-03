/* global chrome */

function onOptionsChanged(callback) {
  chrome.storage.onChanged.addListener(callback);

  return () => {
    chrome.storage.onChanged.removeListener(callback);
  };
}

export default onOptionsChanged;
