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

  createFundsSent({ clientToken, paymentWallet }) {
    return {
      message: messageRequestTypes.fundsConfirmed,
      clientToken,
      paymentWallet,
    };
  },

  createQueryRetrievalStatus({ cid, clientToken }) {
    return {
      message: messageRequestTypes.queryRetrievalStatus,
      cid,
      clientToken,
    };
  },

  createChunkReceived({ cid, id, clientToken }) {
    return {
      message: messageRequestTypes.chunkReceived,
      clientToken,
      cid,
      id,
    };
  },

  createChunkResend({ cid, id, clientToken }) {
    return {
      message: messageRequestTypes.chunkResend,
      clientToken,
      cid,
      id,
    };
  },
};
