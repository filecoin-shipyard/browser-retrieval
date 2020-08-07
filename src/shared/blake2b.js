import { Buffer } from 'buffer';
import blakejs from 'blakejs';

function blake2b(bytes, length) {
  return Buffer.from(blakejs.blake2b(bytes, null, length));
}

export default blake2b;
