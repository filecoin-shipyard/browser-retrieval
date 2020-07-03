/* global chrome */

import React from 'react';
import useOptions from 'src/popup/hooks/useOptions';
import Card from 'src/popup/components/Card';
import TableRow from 'src/popup/components/TableRow';
import TableCell from 'src/popup/components/TableCell';
import IconButton from 'src/popup/components/IconButton';
import Label from 'src/popup/components/Label';

function KnownCids(props) {
  const [{ knownCids }] = useOptions();

  if (!knownCids.length) {
    return null;
  }

  function downloadCid(cid) {
    chrome.storage.local.get([cid], ({ [cid]: data }) => {
      const blob = new Blob([data], { type: 'octet/stream' });
      const url = URL.createObjectURL(blob);

      const anchor = document.createElement('a');
      anchor.style = 'display: none';
      anchor.href = url;
      anchor.download = cid;

      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    });
  }

  return (
    <Card {...props}>
      <Label className="p-4">Known CIDs:</Label>
      <table>
        <tbody>
          {knownCids.sort().map(cid => (
            <TableRow>
              <TableCell className="font-mono" large>
                {cid}
              </TableCell>
              <TableCell buttons>
                {cid !== '*' && (
                  <IconButton onClick={() => downloadCid(cid)}>
                    <svg
                      className="fill-current"
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 21l-8-9h6v-12h4v12h6l-8 9zm9-1v2h-18v-2h-2v4h22v-4h-2z" />
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

export default KnownCids;
