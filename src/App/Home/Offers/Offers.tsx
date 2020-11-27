import './Offers.css'

import classNames from 'classnames'
import { Button } from 'components/Button'
import { Card } from 'components/Card'
import { IconButton } from 'components/IconButton'
import { Label } from 'components/Label'
import { Table } from 'components/Table'
import { TableCell } from 'components/TableCell'
import { TableRow } from 'components/TableRow'
import { appStore } from 'shared/store/appStore'
import React from 'react'

export function Offers(props) {
  const { dealsStore, offersStore } = appStore

  function downloadFile(cid, offer) {
    const msg = {
      cid,
      offer,
    }

    // TODO: @brunolm implement
    // dispatchers.download(msg)
  }

  const { deals } = dealsStore
  const { offerInfo } = offersStore

  if (!offerInfo?.offers?.length) {
    return null
  }

  const { cid, offers } = offerInfo

  function closeOffers() {
    // TODO: @brunolm implement

    // setOptions({
    //   ...options,
    //   offerInfo: {
    //     cid: undefined,
    //     offers: [],
    //     params: undefined,
    //   },
    // })
  }

  return (
    <Card {...props}>
      <div className="flex">
        <Label className="p-4 pb-2 flex-1">Offers for CID {cid}</Label>
        <IconButton icon="close" onClick={() => closeOffers()} danger className="Offer-close" />
      </div>
      <Table>
        <tbody>
          {offers.map((offer) => (
            <TableRow key={offer.address}>
              <TableCell className="font-mono">
                {/^ws/.test(offer.address) ? 'Storage Miner Network' : offer.address}
              </TableCell>

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
  )
}
