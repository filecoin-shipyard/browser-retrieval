import { Buffer } from 'buffer';
import cbor from 'cbor';
import { getChecksum } from '@zondax/filecoin-signing-tools/js/src/utils';
import base32Encode from 'base32-encode';

const decoder = {
  decodePaymentChannelAddressFromReceipt(receipt, testnet) {
    const bytes = Buffer.from(receipt.Return, 'base64');
    const hex = bytes.toString('hex');
    const params = cbor.decode(hex);
    return decoder.bytesToAddress(params[1], testnet);
  },

  // not using zondax's bytesToAddress because of https://github.com/Zondax/filecoin-signing-tools/issues/243
  bytesToAddress(bytes, testnet) {
    const checksum = getChecksum(bytes);
    const prefix = `${testnet ? 't' : 'f'}${bytes[0]}`;
    const encoded = base32Encode(Buffer.concat([bytes.slice(1), checksum]), 'RFC4648', {
      padding: false,
    }).toLowerCase();
    return `${prefix}${encoded}`;
  },
};

export default decoder;
