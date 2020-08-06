import { Buffer } from 'buffer';
import cbor from 'cbor';
import base32Encode from 'base32-encode';
import blake from 'blakejs';

const decoder = {
  decodePaymentChannelAddressFromReceipt(receipt, testnet) {
    const bytes = Buffer.from(receipt.Return, 'base64');
    const hex = bytes.toString('hex');
    const params = cbor.decode(hex);
    return decoder.bytesToAddress(params[1], testnet);
  },

  bytesToAddress(bytes, testnet) {
    const checksum = decoder.getChecksum(bytes);
    const prefix = `${testnet ? 't' : 'f'}${bytes[0]}`;
    const encoded = base32Encode(Buffer.concat([bytes.slice(1), checksum]), 'RFC4648', {
      padding: false,
    }).toLowerCase();
    return `${prefix}${encoded}`;
  },

  getChecksum(payload) {
    const blakeContext = blake.blake2bInit(4);
    blake.blake2bUpdate(blakeContext, payload);
    return Buffer.from(blake.blake2bFinal(blakeContext));
  },
};

export default decoder;
