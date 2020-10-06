export const messages = {
  createGetQueryCID(cid) {
    return {
      message: 'query_cid',
      cid,
      miner: 't01352',
    };
  },

  createFundsSent() {
    return {
      message: 'funds_confirmed',
      client_token: 'HIgP2JW9wHdlTYb89rjEy9/IQDR02EwMvtg4XN5Y/kY=',
      payment_wallet: 'f1stoztiw5sxeyvezjttq5727wfdkooweskpue5fa',
    };
  },
};
