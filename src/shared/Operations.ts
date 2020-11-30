import { DateTime } from 'luxon'

import { appStore } from 'shared/store/appStore'

/**
 * Functions to be executed in a certain scheduled time.
 */
export class Operations {
  // Example
  async testQueue(lotus, metadata) {
    console.log('lotus', lotus)
    console.log('metadata', metadata)
    console.log('luxon', DateTime)

    return 'yo this works'
  }

  // Collect a payment channel after 12-hour wait
  async collectChannel(lotus, metadata) {
    const paymentChannelAddr = metadata.paymentChannelAddr
    appStore.logsStore.logDebug(
      `LUXON: Opterations.collectChannel: collectChannel on paymentChannelAddr=${paymentChannelAddr}`,
    )
    await lotus.collectPaymentChannel(paymentChannelAddr)

    return 'Channel collected'
  }
}

export const operations = new Operations()
