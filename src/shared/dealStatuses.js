const dealStatuses = {
  client: {
    awaitingAcceptance: 'DealStatusAwaitingAcceptance',
    paymentChannelReady: 'DealStatusPaymentChannelReady',
    paymentSent: 'DealStatusPaymentSent',
    lastPaymentSent: 'DealStatusLastPaymentSent',
  },
  provider: {
    accepted: 'DealStatusAccepted',
    fundsNeeded: 'DealStatusFundsNeeded',
    fundsNeededLastPayment: 'DealStatusFundsNeededLastPayment',
    completed: 'DealStatusCompleted',
  },
};

export default dealStatuses;
