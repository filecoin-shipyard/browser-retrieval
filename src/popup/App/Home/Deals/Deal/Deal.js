import prettyBytes from 'pretty-bytes';
import React from 'react';
import ProgressIndicator from 'src/popup/components/ProgressIndicator';
import TableCell from 'src/popup/components/TableCell';
import TableRow from 'src/popup/components/TableRow';

import dealStatuses from '../../../../../shared/dealStatuses';

/**
 * @param  {} status
 */
const renderStatus = (status) => {
  switch (status) {
    case dealStatuses.new:
      return <>New</>;

    case dealStatuses.awaitingAcceptance:
      return <>Waiting for acceptance</>;

    case dealStatuses.accepted:
      return <>Accepted</>;

    case dealStatuses.paymentChannelReady:
      return <>Payment channel ready</>;

    case dealStatuses.fundsNeeded:
      return <>Funds needed</>;

    case dealStatuses.ongoing:
      return <>Transferring file</>;

    case dealStatuses.paymentSent:
      return <>Payment sent</>;

    case dealStatuses.fundsNeededLastPayment:
      return <>Funds needed for last payment</>;

    case dealStatuses.lastPaymentSent:
      return <>Last payment sent</>;

    case dealStatuses.finalizing:
      return <>Finalizing</>;

    case dealStatuses.completed:
      return <>Completed</>;

    default:
      return <></>;
  }
};

function Deal({ deal, inbound, ...rest }) {
  const progress = (inbound ? deal.sizeReceived : deal.sizeSent) / deal.params.size;

  return (
    <TableRow {...rest}>
      <TableCell className={inbound ? 'text-green' : 'text-brand'} buttons>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
          <path
            d={
              inbound
                ? 'M7 2v-2h10v2h-10zm0 4h10v-2h-10v2zm10 7v-5h-10v5h-6l11 11 11-11h-6z'
                : 'M17 22v2h-10v-2h10zm0-4h-10v2h10v-2zm-10-7v5h10v-5h6l-11-11-11 11h6z'
            }
          />
        </svg>
      </TableCell>
      <TableCell className="font-mono">{deal.cid}</TableCell>
      <TableCell>{renderStatus(deal.status)}</TableCell>
      <TableCell>
        <ProgressIndicator progress={progress} />
      </TableCell>
      <TableCell number>{prettyBytes(deal.params.size)}</TableCell>
    </TableRow>
  );
}

export default Deal;
