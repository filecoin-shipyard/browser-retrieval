import { Buffer } from 'buffer';
import cbor from 'cbor';
import base32Encode from 'base32-encode';
import blake2b from './blake2b';

const decoder = {
  decodePaymentChannelAddressFromReceipt(receipt, testnet) {
    const bytes = Buffer.from(receipt, 'base64');
    const hex = bytes.toString('hex');
    const params = cbor.decode(hex);
    return decoder.bytesToAddress(params[1], testnet);
  },

  bytesToAddress(bytes, testnet) {
    const checksum = blake2b(bytes, 4);
    const prefix = `${testnet ? 't' : 'f'}${bytes[0]}`;
    const encoded = base32Encode(Buffer.concat([bytes.slice(1), checksum]), 'RFC4648', {
      padding: false,
    }).toLowerCase();
    return `${prefix}${encoded}`;
  },
};

export default decoder;
