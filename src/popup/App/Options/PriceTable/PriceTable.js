import React from 'react';
import useOptions from 'src/popup/hooks/useOptions';
import Card from 'src/popup/components/Card';
import TableRow from 'src/popup/components/TableRow';
import TableCell from 'src/popup/components/TableCell';
import IconButton from 'src/popup/components/IconButton';

function PriceTable(props) {
  const [options, setOptions] = useOptions();

  function removePrice(cid) {
    const { [cid]: price, ...pricesPerByte } = options.pricesPerByte;
    setOptions({ pricesPerByte });
  }

  return (
    <Card {...props}>
      <table>
        <thead>
          <TableRow head>
            <TableCell head>CID</TableCell>
            <TableCell number head>
              Price/byte (AttoFIL)
            </TableCell>
            <TableCell buttons head></TableCell>
          </TableRow>
        </thead>
        <tbody>
          {Object.entries(options.pricesPerByte)
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
              <TableRow key={cid}>
                <TableCell className="font-mono" large>
                  {cid}
                </TableCell>
                <TableCell number>{price}</TableCell>
                <TableCell buttons>
                  {cid !== '*' && (
                    <IconButton icon="trash" onClick={() => removePrice(cid)} danger />
                  )}
                </TableCell>
              </TableRow>
            ))}
        </tbody>
      </table>
    </Card>
  );
}

export default PriceTable;
