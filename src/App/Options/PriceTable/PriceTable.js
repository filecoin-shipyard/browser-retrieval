import React from 'react';
import useOptions from 'src/hooks/useOptions';
import formatPrice from 'src/utils/formatPrice';
import Card from 'src/components/Card';
import TableRow from 'src/components/TableRow';
import TableCell from 'src/components/TableCell';
import TrashButton from 'src/components/TrashButton';

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
                <TableCell large>{cid}</TableCell>
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
