/* global chrome */

import { optionsKeys } from './getOptions';

function onOptionsChanged(callback) {
  function handleChanges(changes) {
    if (optionsKeys.some(key => changes[key])) {
      callback(changes);
    }
  }

  chrome.storage.onChanged.addListener(handleChanges);

  return () => {
    chrome.storage.onChanged.removeListener(handleChanges);
  };
}

export default onOptionsChanged;
