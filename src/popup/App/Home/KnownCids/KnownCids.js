/* global chrome */

import React from 'react';
import prettyBytes from 'pretty-bytes';
import useOptions from 'src/popup/hooks/useOptions';
import Card from 'src/popup/components/Card';
import TableRow from 'src/popup/components/TableRow';
import TableCell from 'src/popup/components/TableCell';
import IconButton from 'src/popup/components/IconButton';
import Label from 'src/popup/components/Label';
import messageTypes from 'src/shared/messageTypes';

function KnownCids(props) {
  const [{ knownCids }] = useOptions();
  const knownCidsIds = Object.keys(knownCids);

  if (!knownCidsIds.length) {
    return null;
  }

  function downloadFile(cid) {
    chrome.runtime.sendMessage({ messageType: messageTypes.downloadFile, cid });
  }

  function deleteFile(cid) {
    chrome.runtime.sendMessage({ messageType: messageTypes.deleteFile, cid });
  }

  return (
    <Card {...props}>
      <Label className="p-4">Known CIDs:</Label>
      <table>
        <tbody>
          {knownCidsIds.sort().map(cid => (
            <TableRow key={cid}>
              <TableCell className="font-mono">{cid}</TableCell>
              <TableCell number>{prettyBytes(knownCids[cid].size)}</TableCell>
              <TableCell buttons>
                <div className="flex">
                  <IconButton className="mr-4" icon="download" onClick={() => downloadFile(cid)} />
                  <IconButton icon="trash" onClick={() => deleteFile(cid)} danger />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

export default KnownCids;
