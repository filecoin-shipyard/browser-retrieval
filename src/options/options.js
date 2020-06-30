const cidInput = document.getElementById('cidInput');
const priceInput = document.getElementById('priceInput');
const cidPriceForm = document.getElementById('cidPriceForm');
const priceTableBody = document.getElementById('priceTableBody');

let pricePerByte = {};

function drawPriceTable() {
  priceTableBody.innerHTML = '';

  Object.entries(pricePerByte)
    .sort(([a], [b]) => {
      if (a === '*') {
        return -1;
      }

      if (b === '*') {
        return 1;
      }

      return a - b;
    })
    .forEach(([cid, price]) => {
      const cidCell = document.createElement('td');
      cidCell.innerHTML = cid;

      const priceCell = document.createElement('td');
      priceCell.innerHTML = formatPrice(price);

      const actionsCell = document.createElement('td');

      if (cid !== '*') {
        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.innerHTML = 'Remove';
        removeButton.onclick = () => {
          delete pricePerByte[cid];
          chrome.storage.sync.set({ pricePerByte });
          drawPriceTable();
        };

        actionsCell.appendChild(removeButton);
      }

      const tr = document.createElement('tr');
      tr.appendChild(cidCell);
      tr.appendChild(priceCell);
      tr.appendChild(actionsCell);

      priceTableBody.appendChild(tr);
    });
}

cidPriceForm.onsubmit = event => {
  event.preventDefault();

  pricePerByte[cidInput.value] = parseFloat(priceInput.value);
  chrome.storage.sync.set({ pricePerByte });
  drawPriceTable();

  return false;
};

chrome.storage.sync.get(['pricePerByte'], result => {
  pricePerByte = result.pricePerByte;
  priceInput.value = pricePerByte['*'].toFixed(10);
  drawPriceTable();
});
