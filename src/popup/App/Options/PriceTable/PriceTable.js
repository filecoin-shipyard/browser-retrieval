import React from 'react';
import useOptions from 'src/popup/hooks/useOptions';
import Card from 'src/popup/components/Card';
import TableRow from 'src/popup/components/TableRow';
import TableCell from 'src/popup/components/TableCell';
import TrashButton from 'src/popup/components/TrashButton';

function formatPrice(price) {
  return price.toLocaleString(navigator.language, { maximumFractionDigits: 10 });
}

function PriceTable(props) {
  const [options, setOptions] = useOptions();

  function removePrice(cid) {
    const { [cid]: price, ...pricePerByte } = options.pricePerByte;
    setOptions({ pricePerByte });
  }

  return (
    <Card {...props}>
      <table>
        <thead>
          <TableRow head>
            <TableCell head>CID</TableCell>
            <TableCell number head>
              Price/byte
            </TableCell>
            <TableCell buttons head></TableCell>
          </TableRow>
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
              <TableRow>
                <TableCell className="font-mono" large>
                  {cid}
                </TableCell>
                <TableCell number>{formatPrice(price)}</TableCell>
                <TableCell buttons>
                  {cid !== '*' && <TrashButton onClick={() => removePrice(cid)} />}
                </TableCell>
              </TableRow>
            ))}
        </tbody>
      </table>
    </Card>
  );
}

export default PriceTable;
