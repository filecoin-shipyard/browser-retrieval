import './RecentCids.css'

import { Card } from 'components/Card'
import { Label } from 'components/Label'
import { Table } from 'components/Table'
import { TableCell } from 'components/TableCell'
import { TableRow } from 'components/TableRow'
import { observer } from 'mobx-react-lite'
import React, { useState } from 'react'
import { copyToClipboard } from 'shared/copyToClipboard'
import { formatCid } from 'shared/formatCid'
import { appStore } from 'shared/store/appStore'

export const RecentCids = observer<any>((props) => {
  const { recentCIDStore } = appStore
  const { recentCIDs } = recentCIDStore

  const [buttonMessage, setButtonMessage] = useState({})

  const copy = (cid: string) => {
    copyToClipboard(cid)

    setButtonMessage({
      [cid]: 'Copied!',
    })
  }

  return (
    <Card {...props}>
      <Label className="p-4 pb-2">Recent CIDs</Label>
      <Table>
        <tbody>
          {recentCIDs.map((rcid) => (
            <TableRow key={rcid.cid}>
              <TableCell className="font-mono" title={rcid.cid}>
                {formatCid(rcid.cid)}
              </TableCell>
              <TableCell className="right">
                <button onClick={() => copy(rcid.cid)}>{buttonMessage[rcid.cid] || 'Copy'}</button>
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>
    </Card>
  )
})
