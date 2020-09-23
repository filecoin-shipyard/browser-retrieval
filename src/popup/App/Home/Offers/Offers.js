/* global chrome */
import './Offers.css';

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

function downloadFile(cid) {
  chrome.runtime.sendMessage({ messageType: messageTypes.downloadFile, cid });
}

function Offers(props) {
  const [options, setOptions] = useOptions();
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
      },
    });
  }

  return (
    <Card {...props}>
      <div class="flex">
        <Label className="p-4 pb-2 flex-1">Offers for CID {cid}</Label>
        <IconButton icon="close" onClick={() => closeOffers(cid)} danger className="Offer-close" />
      </div>
      <Table>
        <tbody>
          {offers.map((offer) => (
            <TableRow key={cid}>
              <TableCell className="font-mono">{offer.address}</TableCell>

              <TableCell number>{offer.price} attoFIL</TableCell>

              <TableCell buttons>
                <div className="flex">
                  <Button type="submit" onClick={() => downloadFile(cid)}>
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
