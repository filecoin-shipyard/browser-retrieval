import { Card } from 'components/Card'
import { IconButton } from 'components/IconButton'
import { Table } from 'components/Table'
import { TableCell } from 'components/TableCell'
import { TableRow } from 'components/TableRow'
import { entries } from 'mobx'
import { observer } from 'mobx-react-lite'
import React from 'react'
import { appStore } from 'shared/store/appStore'

export const PriceTable = observer((props) => {
  const { optionsStore } = appStore

  function removePrice(cid) {
    optionsStore.removePrice(cid)
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
          {(entries(optionsStore.pricesPerByte) as any)
            .sort(([a]: any, [b]: any) => {
              if (a === '*') {
                return -1
              }

              if (b === '*') {
                return 1
              }

              return a - b
            })
            .map(([cid, price]) => (
              <TableRow key={cid}>
                <TableCell className="font-mono" large="true">
                  {cid}
                </TableCell>
                <TableCell number>{price}</TableCell>
                <TableCell buttons>
                  {cid !== '*' && <IconButton icon="trash" onClick={() => removePrice(cid)} danger />}
                </TableCell>
              </TableRow>
            ))}
        </tbody>
      </Table>
    </Card>
  )
})
