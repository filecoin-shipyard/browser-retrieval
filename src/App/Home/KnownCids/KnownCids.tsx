import { Card } from 'components/Card'
import { IconButton } from 'components/IconButton'
import { Label } from 'components/Label'
import { Table } from 'components/Table'
import { TableCell } from 'components/TableCell'
import { TableRow } from 'components/TableRow'
import { keys } from 'mobx'
import { observer } from 'mobx-react-lite'
import prettyBytes from 'pretty-bytes'
import React from 'react'
import { appStore } from 'shared/store/appStore'

export const KnownCids = observer<any>((props) => {
  const { knownCids } = appStore.optionsStore
  const knownCidsIds = keys(knownCids)

  if (!knownCidsIds.length) {
    return null
  }

  function downloadFile(cid) {
    const msg = { cid }

    appStore.downloadFile(msg)
  }

  function deleteFile(cid) {
    const msg = { cid }

    appStore.deleteFile(msg)
  }

  const sortedCids = knownCidsIds.slice().sort() as string[]

  return (
    <Card {...props}>
      <Label className="p-4 pb-2">Your CIDs</Label>
      <Table>
        <tbody>
          {sortedCids.map((cid) => (
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
})
