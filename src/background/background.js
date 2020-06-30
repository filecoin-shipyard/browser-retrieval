chrome.runtime.onInstalled.addListener(function () {
  chrome.storage.sync.get(['pricePerByte'], function (result) {
    if (result.pricePerByte === undefined) {
      chrome.storage.sync.set({ pricePerByte: { '*': 0.0000000001 } });
    }
  });
});
