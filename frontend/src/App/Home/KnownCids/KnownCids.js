/* global chrome */

import React from 'react';
import prettyBytes from 'pretty-bytes';
import useOptions from '../../../hooks/useOptions';
import Card from '../../../components/Card';
import Table from '../../../components/Table';
import TableRow from '../../../components/TableRow';
import TableCell from '../../../components/TableCell';
import IconButton from '../../../components/IconButton';
import Label from '../../../components/Label';
import messageTypes from '../../../shared/messageTypes';

function KnownCids(props) {
  const [{ knownCids }] = useOptions();
  let knownCidsIds = {};

  if (knownCids) {
     knownCidsIds = Object.keys(knownCids);
  }


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
      <Label className="p-4 pb-2">Known CIDs</Label>
      <Table>
        <tbody>
          {knownCidsIds.sort().map(cid => (
            <TableRow key={cid}>
              <TableCell className="font-mono">{cid}</TableCell>
              <TableCell number>
                {Boolean(knownCids[cid].size) && prettyBytes(knownCids[cid].size)}
              </TableCell>
              <TableCell buttons>
                <div className="flex">
                  <IconButton className="mr-4" icon="download" onClick={() => downloadFile(cid)} />
                  <IconButton icon="trash" onClick={() => deleteFile(cid)} danger />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>
    </Card>
  );
}

export default KnownCids;
