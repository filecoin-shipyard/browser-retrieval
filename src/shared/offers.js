import getOptions from 'src/shared/getOptions.js';
import setOptions from 'src/shared/setOptions';

export const clearOffers = async () => {
  const options = await getOptions();

  await setOptions({
    ...options,
    offerInfo: {
      cid: undefined,
      offers: [],
      params: undefined,
    },
  });
};

/**
 * @param {Object} offer
 * @param {string} offer.cid
 * @param {string} offer.multiaddrs
 * @param {Object} offer.params
 * @param {number} offer.params.size
 * @param {number} offer.params.pricePerByte
 */
export const addOffer = async ({ cid, multiaddrs, params }) => {
  const options = await getOptions();
  const offers = options.offerInfo?.offers || [];

  if (!multiaddrs) {
    multiaddrs = [options.wsEndpoint];
  }

  await setOptions({
    ...options,
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
  });
};
