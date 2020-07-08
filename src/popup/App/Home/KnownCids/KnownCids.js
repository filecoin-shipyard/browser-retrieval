/* global chrome */

import React from 'react';
import usePort from 'src/popup/hooks/usePort';
import Card from 'src/popup/components/Card';
import TableRow from 'src/popup/components/TableRow';
import TableCell from 'src/popup/components/TableCell';
import IconButton from 'src/popup/components/IconButton';
import Label from 'src/popup/components/Label';
import channels from 'src/shared/channels';
import messageTypes from 'src/shared/messageTypes';

function KnownCids(props) {
  const pins = usePort(channels.pins);

  if (!pins || !pins.length) {
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
          {pins.sort().map(cid => (
            <TableRow key={cid}>
              <TableCell className="font-mono">{cid}</TableCell>
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
