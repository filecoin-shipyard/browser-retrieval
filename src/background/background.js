chrome.runtime.onInstalled.addListener(function () {
  chrome.storage.local.get(['pricePerByte'], function (result) {
    if (!result || !result.pricePerByte) {
      chrome.storage.local.set({ pricePerByte: { '*': 0.0000000001 } });
    }
  });
});
