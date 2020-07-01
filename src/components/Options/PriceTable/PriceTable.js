import React from 'react';
import useOptions from 'src/hooks/useOptions';
import formatPrice from 'src/utils/formatPrice';

function PriceTable() {
  const [options, setOptions] = useOptions();

  function removePrice(cid) {
    const { [cid]: price, ...pricePerByte } = options.pricePerByte;
    setOptions({ pricePerByte });
  }

  return (
    <table>
      <thead>
        <tr>
          <th>CID</th>
          <th>Price per byte</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(options.pricePerByte)
          .sort(([a], [b]) => {
            if (a === '*') {
              return -1;
            }

            if (b === '*') {
              return 1;
            }

            return a - b;
          })
          .map(([cid, price]) => (
            <tr>
              <td>{cid}</td>
              <td>{formatPrice(price)}</td>
              <td>
                {cid !== '*' && (
                  <button type="button" onClick={() => removePrice(cid)}>
                    Remove
                  </button>
                )}
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}

export default PriceTable;
