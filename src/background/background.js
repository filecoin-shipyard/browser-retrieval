chrome.runtime.onInstalled.addListener(function () {
  chrome.storage.sync.get(['defaultPrice'], function (result) {
    if (result.defaultPrice === undefined) {
      chrome.storage.sync.set({ defaultPrice: 0.0000000001 });
    }
  });
});
