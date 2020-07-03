import React from 'react';
import useOptions from 'src/popup/hooks/useOptions';
import Card from 'src/popup/components/Card';
import TableRow from 'src/popup/components/TableRow';
import TableCell from 'src/popup/components/TableCell';
import IconButton from 'src/popup/components/IconButton';

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
                  {cid !== '*' && (
                    <IconButton onClick={() => removePrice(cid)} danger>
                      <svg
                        className="fill-current"
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                      >
                        <path d="M19 24h-14c-1.104 0-2-.896-2-2v-16h18v16c0 1.104-.896 2-2 2zm-7-10.414l3.293-3.293 1.414 1.414-3.293 3.293 3.293 3.293-1.414 1.414-3.293-3.293-3.293 3.293-1.414-1.414 3.293-3.293-3.293-3.293 1.414-1.414 3.293 3.293zm10-8.586h-20v-2h6v-1.5c0-.827.673-1.5 1.5-1.5h5c.825 0 1.5.671 1.5 1.5v1.5h6v2zm-8-3h-4v1h4v-1z" />
                      </svg>
                    </IconButton>
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
