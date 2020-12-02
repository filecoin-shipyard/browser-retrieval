import classNames from 'classnames'
import { Card } from 'components/Card'
import { Table } from 'components/Table'
import { TableCell } from 'components/TableCell'
import { TableRow } from 'components/TableRow'
import { appStore } from 'shared/store/appStore'
import React from 'react'

import { Deal } from './Deal'
import { observer } from 'mobx-react-lite'

export const Deals = observer<any>(({ className, ...rest }) => {
  const { dealsStore } = appStore

  if (!dealsStore.hasOngoingDeals()) {
    return null
  }

  const inbound = dealsStore.inboundDeals
  const outbound = dealsStore.outboundDeals

  return (
    <Card className={classNames(className)} {...rest}>
      <Table>
        <thead>
          <TableRow head>
            <TableCell buttons head></TableCell>
            <TableCell head>CID</TableCell>
            <TableCell head>Status</TableCell>
            <TableCell head>Progress</TableCell>
            <TableCell number head>
              Size
            </TableCell>
          </TableRow>
        </thead>
        <tbody>
          {inbound?.map((deal) => (
            <Deal key={deal.id} deal={deal} inbound />
          ))}
          {outbound?.map((deal) => (
            <Deal key={deal.id} deal={deal} />
          ))}
        </tbody>
      </Table>
    </Card>
  )
})
