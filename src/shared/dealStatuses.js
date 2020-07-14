const dealStatuses = {
  new: 'DealStatusNew',
  awaitingAcceptance: 'DealStatusAwaitingAcceptance',
  accepted: 'DealStatusAccepted',
  paymentChannelReady: 'DealStatusPaymentChannelReady',
  blocksComplete: 'DealStatusBlocksComplete',
  finalizing: 'DealStatusFinalizing',
  // paymentChannelCreating: 'DealStatusPaymentChannelCreating',
  // paymentChannelAddingFunds: 'DealStatusPaymentChannelAddingFunds',
  // paymentChannelAllocatingLane: 'DealStatusPaymentChannelAllocatingLane',
  // failed: 'DealStatusFailed',
  // rejected: 'DealStatusRejected',
  // fundsNeeded: 'DealStatusFundsNeeded',
  // ongoing: 'DealStatusOngoing',
  // fundsNeededLastPayment: 'DealStatusFundsNeededLastPayment',
  // completed: 'DealStatusCompleted',
  // dealNotFound: 'DealStatusDealNotFound',
  // verified: 'DealStatusVerified',
  // errored: 'DealStatusErrored',
};

export default dealStatuses;
