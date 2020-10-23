import { DateTime } from 'luxon';
import ports from 'src/background/ports';

/**
 * Functions to be executed in a certain scheduled time.
 */
export class Operations {
  async testQueue(lotus, metadata) {
    console.log('lotus', lotus);
    console.log('metadata', metadata);
    console.log('luxon', DateTime);

    return 'yo this works';
  }

  async collectChannel(lotus, metadata) {
    const paymentChannelAddr = metadata.paymentChannelAddr;
    ports.postLog(`DEBUG: LUXON: Opterations.collectChannel: collectChannel on paymentChannelAddr=${paymentChannelAddr}`);
    // TODO
  }
}

export const operations = new Operations();
