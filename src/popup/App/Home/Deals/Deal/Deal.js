import React from 'react';
import prettyBytes from 'pretty-bytes';
import TableRow from 'src/popup/components/TableRow';
import TableCell from 'src/popup/components/TableCell';
import ProgressIndicator from 'src/popup/components/ProgressIndicator';

function Deal({ deal, inbound, ...rest }) {
  const progress = (inbound ? deal.sizeReceived : deal.sizeSent) / deal.params.size;
  console.log(progress);

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
      <TableCell>
        <ProgressIndicator progress={progress} />
      </TableCell>
      <TableCell number>{prettyBytes(deal.params.size)}</TableCell>
    </TableRow>
  );
}

export default Deal;
