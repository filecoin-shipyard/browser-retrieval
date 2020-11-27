import { getOptions, setOptions } from 'shared/options'

export const clearOffers = () => {
  setOptions({
    offerInfo: {
      cid: undefined,
      offers: [],
      params: undefined,
    },
  })
}

interface OfferInput {
  cid: string
  multiaddrs?: string[]
  params: {
    size?: number
    pricePerByte?: number
    price?: any
    clientToken?: string
    paymentWallet?: string
  }
}

export const addOffer = ({ cid, multiaddrs, params }: OfferInput) => {
  const options = getOptions()
  const offers = options.offerInfo?.offers || []

  if (!multiaddrs) {
    multiaddrs = [options.wsEndpoint]
  }

  setOptions({
    offerInfo: {
      cid,
      offers: offers.concat(
        multiaddrs.map((address) => ({
          address,
          price: params.price || params.size * params.pricePerByte,
          params,
        })),
      ),
    },
  })
}
