/* global chrome */
import { DateTime } from 'luxon';
import React, { useState, useEffect } from 'react';
import Card from 'src/popup/components/Card';
import Label from 'src/popup/components/Label';
import Table from 'src/popup/components/Table';
import TableCell from 'src/popup/components/TableCell';
import TableRow from 'src/popup/components/TableRow';
import { operationsQueue } from 'src/shared/OperationsQueue';

const renderStatus = ({ status, invokeAt }) => {
  if (!status || status === 'waiting') {
    return DateTime.fromJSDate(invokeAt).diff(DateTime.local()).toFormat('hh:mm:ss');
  }

  return status;
};

const renderOpsTable = (ops) => {
  if (!ops) {
    return <>No operations</>;
  }

  return (
    <Table>
      <tbody>
        {ops.map((op) => (
          <TableRow key={op.id}>
            <TableCell width="250px">{op.label}</TableCell>
            <TableCell width="80px" title={op.invokeAt?.toISOString()}>{renderStatus(op)}</TableCell>
            <TableCell>{op.output || '-'}</TableCell>
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
