const defaultPriceInput = document.getElementById('defaultPriceInput');
const saveButton = document.getElementById('saveButton');

chrome.storage.sync.get(['defaultPrice'], function (result) {
  defaultPriceInput.value = result.defaultPrice.toFixed(10);
});

saveButton.onclick = function () {
  const defaultPrice = parseFloat(defaultPriceInput.value);
  chrome.storage.sync.set({ defaultPrice });
};
