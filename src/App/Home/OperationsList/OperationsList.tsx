import { Card } from 'components/Card'
import { IconButton } from 'components/IconButton'
import { Label } from 'components/Label'
import { Table } from 'components/Table'
import { TableCell } from 'components/TableCell'
import { TableRow } from 'components/TableRow'
import { appStore } from 'shared/store/appStore'
import { DateTime } from 'luxon'
import React, { useEffect, useState } from 'react'

const renderStatus = ({ status, invokeAt }) => {
  if (!status || ['waiting', 'running'].includes(status)) {
    const diff = DateTime.fromJSDate(invokeAt).diff(DateTime.local())

    if (diff.as('milliseconds') > 0) {
      return diff.toFormat('hh:mm:ss')
    }

    return `running for ${-diff.as('seconds') | 0}s`
  }

  return status
}

const dismiss = ({ appStore, operation }) => {
  appStore.operationsStore.dequeue(operation)
}

const renderOpsTable = ({ appStore, operations }) => {
  if (!operations || !operations.length) {
    return <div className="p-4 py-2">No operations</div>
  }

  return (
    <Table>
      <tbody>
        {operations
          .sort((a, b) => {
            const diff = a.invokeAt - b.invokeAt
            if (isNaN(diff)) {
              return -2
            }

            if (!diff) {
              return 0
            }

            return diff > 0 ? 1 : -1
          })
          .map((operation) => (
            <TableRow key={operation.id}>
              <TableCell width="500px">{operation.label}</TableCell>
              <TableCell width="160px" title={operation.invokeAt?.toISOString()}>
                {renderStatus(operation)}
              </TableCell>
              <TableCell>{operation.output || '-'}</TableCell>
              <TableCell>
                {['done', 'failed'].includes(operation.status) ? (
                  <div className="flex">
                    <IconButton icon="trash" onClick={() => dismiss({ appStore, operation })} danger /> &nbsp; &nbsp;
                  </div>
                ) : (
                  <>&nbsp;</>
                )}
              </TableCell>
            </TableRow>
          ))}
      </tbody>
    </Table>
  )
}

export function OperationsList(props) {
  const [, setTime] = useState(Date.now())

  useEffect(() => {
    const interval = setInterval(() => setTime(Date.now()), 1000)
    return () => {
      clearInterval(interval)
    }
  }, [])

  const { operations } = appStore.operationsStore

  return (
    <Card {...props}>
      <Label className="p-4 pb-2">Pending Operations</Label>

      {renderOpsTable({ appStore, operations })}
    </Card>
  )
}
