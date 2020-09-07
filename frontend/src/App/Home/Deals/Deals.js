import React from 'react';
import classNames from 'classnames';
import channels from '../../../shared/channels';
import usePort from '../../../hooks/usePort';
import Card from '../../../components/Card';
import Table from '../../../components/Table';
import TableRow from '../../../components/TableRow';
import TableCell from '../../../components/TableCell';
import Deal from './Deal/Deal';

function Deals({ className, ...rest }) {
  const deals = usePort(channels.deals);

  if (!deals || (!deals.inbound.length && !deals.outbound.length)) {
    return null;
  }

  return (
    <Card className={classNames(className)} {...rest}>
      <Table>
        <thead>
          <TableRow head>
            <TableCell buttons head/>
            <TableCell head>CID</TableCell>
            <TableCell head>Progress</TableCell>
            <TableCell number head>
              Size
            </TableCell>
          </TableRow>
        </thead>
        <tbody>
          {deals.inbound.map(deal => (
            <Deal key={deal.id} deal={deal} inbound />
          ))}
          {deals.outbound.map(deal => (
            <Deal key={deal.id} deal={deal} />
          ))}
        </tbody>
      </Table>
    </Card>
  );
}

export default Deals;
