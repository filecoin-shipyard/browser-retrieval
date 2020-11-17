/* global chrome */
import './Offers.css';

import classNames from 'classnames';
import React from 'react';
import Button from 'src/popup/components/Button';
import Card from 'src/popup/components/Card';
import IconButton from 'src/popup/components/IconButton';
import Label from 'src/popup/components/Label';
import Table from 'src/popup/components/Table';
import TableCell from 'src/popup/components/TableCell';
import TableRow from 'src/popup/components/TableRow';
import messageTypes from 'src/shared/messageTypes';

import useOptions from '../../../hooks/useOptions';
import usePort from 'src/popup/hooks/usePort';
import channels from 'src/shared/channels';

function Offers(props) {
  const deals = usePort(channels.deals);
  const [options, setOptions] = useOptions();

  function downloadFile(cid, offer) {
    const msg = {
      cid,
      offer,
    };

    chrome.runtime.sendMessage({ messageType: messageTypes.downloadFile, msg });
  }

  const { offerInfo } = options;

  if (!offerInfo?.offers?.length) {
    return null;
  }

  const { cid, offers } = offerInfo;

  function closeOffers() {
    setOptions({
      ...options,
      offerInfo: {
        cid: undefined,
        offers: [],
        params: undefined,
      },
    });
  }

  return (
    <Card {...props}>
      <div className="flex">
        <Label className="p-4 pb-2 flex-1">Offers for CID {cid}</Label>
        <IconButton icon="close" onClick={() => closeOffers(cid)} danger className="Offer-close" />
      </div>
      <Table>
        <tbody>
          {offers.map((offer) => (
            <TableRow key={offer.address}>
              <TableCell className="font-mono">{/^ws/.test(offer.address) ? 'Storage Miner Network' : offer.address}</TableCell>

            <TableCell number>{offer.price} attoFIL</TableCell>

            <TableCell buttons>
              <div className="flex">
                <Button
                  type="submit"
                  onClick={() => downloadFile(cid, offer)}
                  disabled={deals?.inbound.some((deal) => deal.cid === cid)}
                  className={classNames({ disabled: deals?.inbound.some((deal) => deal.cid === cid) })}
                >
                  Buy
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        </tbody>
      </Table>
    </Card>
  );
}

export default Offers;
