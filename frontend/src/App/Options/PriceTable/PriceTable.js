import React from 'react';
import useOptions from '../../../hooks/useOptions';
import Card from '../../../components/Card';
import Table from '../../../components/Table';
import TableRow from '../../../components/TableRow';
import TableCell from '../../../components/TableCell';
import IconButton from '../../../components/IconButton';

function PriceTable(props) {
  const [options, setOptionsGlobal] = useOptions();

  function removePrice(cid) {
    const { [cid]: price, ...pricesPerByte } = options.pricesPerByte;
    setOptionsGlobal({ pricesPerByte });
  }

  return (
    <Card {...props}>
      <Table>
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
                <TableCell className="font-mono" large="true">
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
      </Table>
    </Card>
  );
}

export default PriceTable;
