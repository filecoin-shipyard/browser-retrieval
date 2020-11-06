/* eslint-disable no-unused-vars */

import dealStatuses from 'src/shared/dealStatuses';

/* eslint-enable no-unused-vars */

export const hasOngoingDeals = () => {
  return !!Object.keys(ongoingDeals).length;
};

/**
 * @typedef {Object} Deal
 * @property {number} id
 * @property {dealStatuses} status
 * @property {string} customStatus
 * @property {string} cid
 * @property {dealParams} params
 * @property {string} peerMultiaddr
 * @property {string} peerWallet
 * @property {string} sink
 * @property {number} sizeReceived
 * @property {number} sizePaid
 * @property {pushable} importerSink
 * @property {any} importer
 * @property {string} voucherNonce
 */

/**
 * @type {Object.<string, Deal>} ongoingDeals
 */
export const ongoingDeals = {};
