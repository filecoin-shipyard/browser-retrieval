import { DateTime } from 'luxon';

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
}

export const operations = new Operations();
