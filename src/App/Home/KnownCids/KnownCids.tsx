import { Card } from 'components/Card'
import { IconButton } from 'components/IconButton'
import { Label } from 'components/Label'
import { Table } from 'components/Table'
import { TableCell } from 'components/TableCell'
import { TableRow } from 'components/TableRow'
import { appStore } from 'shared/store/appStore'
import prettyBytes from 'pretty-bytes'
import React from 'react'

export function KnownCids(props) {

  const { knownCids } = appStore.optionsStore
  const knownCidsIds = Object.keys(knownCids)

  if (!knownCidsIds.length) {
    return null
  }

  function downloadFile(cid) {
    const msg = { cid }
    // TODO: @brunolm migrate
    // chrome.runtime.sendMessage({ messageType: messageTypes.downloadFile, msg });
  }

  function deleteFile(cid) {
    const msg = { cid }
    // TODO: @brunolm migrate
    // chrome.runtime.sendMessage({ messageType: messageTypes.deleteFile, msg });
  }

  return (
    <Card {...props}>
      <Label className="p-4 pb-2">Your CIDs</Label>
      <Table>
        <tbody>
          {knownCidsIds.sort().map((cid) => (
            <TableRow key={cid}>
              <TableCell className="font-mono">{cid}</TableCell>
              <TableCell number>{Boolean(knownCids[cid].size) && prettyBytes(knownCids[cid].size)}</TableCell>
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
  )
}
