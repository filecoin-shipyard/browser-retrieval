import { Card } from 'components/Card'
import { IconButton } from 'components/IconButton'
import { Table } from 'components/Table'
import { TableCell } from 'components/TableCell'
import { TableRow } from 'components/TableRow'
import React from 'react'
import { appStore } from 'shared/store/appStore'

export function PriceTable(props) {
  const { optionsStore } = appStore

  function removePrice(cid) {
    // TODO: @brunolm implement
    // const { [cid]: price, ...pricesPerByte } = optionsStore.pricesPerByte
    // setOptions({ pricesPerByte })
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
          {Object.entries(optionsStore.pricesPerByte)
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
}
