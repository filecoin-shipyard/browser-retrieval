/* global chrome */
import { DateTime } from 'luxon';
import React, { useEffect, useState } from 'react';
import Card from 'src/popup/components/Card';
import Label from 'src/popup/components/Label';
import Table from 'src/popup/components/Table';
import TableCell from 'src/popup/components/TableCell';
import TableRow from 'src/popup/components/TableRow';
import { operationsQueue } from 'src/shared/OperationsQueue';

const renderStatus = ({ status, invokeAt }) => {
  if (!status || ['waiting', 'running'].includes(status)) {
    const diff = DateTime.fromJSDate(invokeAt).diff(DateTime.local());

    if (diff.as('milliseconds') > 0) {
      return diff.toFormat('hh:mm:ss');
    }

    return `running for ${-diff.as('seconds') | 0}s`;
  }

  return status;
};

const dismiss = (operation) => {
  operationsQueue.remove(operation);
};

/**
 * @param {Array.<any>} ops Operations
 */
const renderOpsTable = (ops) => {
  if (!ops || !ops.length) {
    return <div className="p-4 py-2">No operations</div>;
  }

  return (
    <Table>
      <tbody>
        {ops
          .sort((a, b) => {
            const diff = a.invokeAt - b.invokeAt;
            if (isNaN(diff)) {
              return -2;
            }

            if (!diff) {
              return 0;
            }

            return diff > 0 ? 1 : -1;
          })
          .map((op) => (
            <TableRow key={op.id}>
              <TableCell width="250px">{op.label}</TableCell>
              <TableCell width="80px" title={op.invokeAt?.toISOString()}>
                {renderStatus(op)}
              </TableCell>
              <TableCell>{op.output || '-'}</TableCell>
              {['done', 'failed'].includes(op.status) ? (
                <TableCell>
                  <button onClick={() => dismiss(op)}>dismiss</button>
                </TableCell>
              ) : (
                <>&nbsp;</>
              )}
            </TableRow>
          ))}
      </tbody>
    </Table>
  );
};

function OperationsList(props) {
  // eslint-disable-next-line no-unused-vars
  const [_time, setTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setTime(Date.now()), 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  const ops = operationsQueue.operations;

  return (
    <Card {...props}>
      <Label className="p-4 pb-2">Operations</Label>

      {renderOpsTable(ops)}
    </Card>
  );
}

export default OperationsList;
