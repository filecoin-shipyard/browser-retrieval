export const messageRequestTypes = {
  queryCid: 'query_cid',

  fundsConfirmed: 'funds_confirmed',

  queryRetrievalStatus: 'query_retrieval_status',

  chunkReceived: 'chunk_received',
  chunkResend: 'chunk_resend',
};

export const messageResponseTypes = {
  cidAvailability: 'cid_availability',

  fundsConfirmed: 'funds_confirmed',
  fundsConfirmedErrorInsufficientFunds: 'funds_confirmed_error_insufficient_funds',
  fundsConfirmedErrorPriceChanged: 'funds_confirmed_error_price_changed',

  chunk: 'chunk',
};

export const messages = {
  createGetQueryCID({ cid, minerID }) {
    return {
      message: messageRequestTypes.queryCid,
      cid,
      miner: minerID,
    };
  },

  createFundsSent() {
    return {
      message: messageRequestTypes.fundsConfirmed,
      client_token: 'HIgP2JW9wHdlTYb89rjEy9/IQDR02EwMvtg4XN5Y/kY=',
      payment_wallet: 'f1stoztiw5sxeyvezjttq5727wfdkooweskpue5fa',
    };
  },

  createQueryRetrievalStatus(cid) {
    return {
      message: messageRequestTypes.queryRetrievalStatus,
      cid,
      client_token: 'HIgP2JW9wHdlTYb89rjEy9/IQDR02EwMvtg4XN5Y/kY=',
    };
  },

  createChunkReceived({ cid, id }) {
    return {
      message: messageRequestTypes.chunkReceived,
      cid,
      id,
    };
  },

  createChunkResend({ cid, id }) {
    return {
      message: messageRequestTypes.chunkResend,
      cid,
      id,
    };
  },
};
