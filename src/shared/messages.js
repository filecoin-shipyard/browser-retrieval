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

  createFundsSent({ clientToken }) {
    return {
      message: messageRequestTypes.fundsConfirmed,
      client_token: clientToken,
      payment_wallet: 'f1stoztiw5sxeyvezjttq5727wfdkooweskpue5fa',
    };
  },

  createQueryRetrievalStatus({ cid, clientToken }) {
    return {
      message: messageRequestTypes.queryRetrievalStatus,
      cid,
      client_token: clientToken,
    };
  },

  createChunkReceived({ cid, id, clientToken }) {
    return {
      message: messageRequestTypes.chunkReceived,
      client_token: clientToken,
      cid,
      id,
    };
  },

  createChunkResend({ cid, id, clientToken }) {
    return {
      message: messageRequestTypes.chunkResend,
      client_token: clientToken,
      cid,
      id,
    };
  },
};
