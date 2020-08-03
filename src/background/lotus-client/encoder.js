import { addressAsBytes } from '@zondax/filecoin-signing-tools/js/src/utils';
import cbor from 'cbor';
import base32Decode from 'base32-decode';
import BigNumber from 'bignumber.js';
import codes from './codes';

const encoder = {
  encodePaymentChannelParams(from, to) {
    const params = cbor.encode([addressAsBytes(from), addressAsBytes(to)]);
    const enc = cbor.encode([codes.paymentChannel, params]);
    return enc.toString('hex');
  },

  encodeVoucher(voucher) {
    const amountHex = new BigNumber(voucher.Amount).toString(16);
    const amountHexFixed = amountHex.length % 2 ? `0${amountHex}` : amountHex;
    const amountBytes = Buffer.concat([
      Buffer.from('00', 'hex'),
      Buffer.from(amountHexFixed, 'hex'),
    ]);

    const enc = cbor.encode([
      encoder.addressAsBytes(voucher.ChannelAddr),
      0, // TimeLockMin
      0, // TimeLockMax
      Buffer.from(''), // SecretPreimage
      null, // Extra
      voucher.Lane,
      voucher.Nonce,
      amountBytes,
      0, // MinSettleHeight
      [], // Merges
      null, // Signature
    ]);

    return enc.toString('hex');
  },

  // not using zondax's addressAsBytes because of https://github.com/Zondax/filecoin-signing-tools/issues/243
  addressAsBytes(address) {
    const protocolIndicator = address[1];
    const address_decoded = base32Decode(address.slice(2).toUpperCase(), 'RFC4648');
    const payload = address_decoded.slice(0, -4);
    const protocolIndicatorByte = `0${protocolIndicator}`;
    return Buffer.concat([Buffer.from(protocolIndicatorByte, 'hex'), Buffer.from(payload)]);
  },
};

export default encoder;
