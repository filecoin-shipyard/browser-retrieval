const defaultOptions = {
  port: 1234,
  pricePerByte: { '*': 0.0000000001 },
};

chrome.runtime.onInstalled.addListener(function () {
  chrome.storage.local.get(['pricePerByte'], function (result) {
    chrome.storage.local.set({ ...defaultOptions, ...result });
  });
});
