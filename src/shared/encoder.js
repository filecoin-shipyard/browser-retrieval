import cbor from 'cbor';
import base32Decode from 'base32-decode';
import codes from './codes';
import addressProtocols from './addressProtocols';

const encoder = {
  encodeMessage(message) {
    return cbor.encode([
      message.Version || 0,
      encoder.addressAsBytes(message.To),
      encoder.addressAsBytes(message.From),
      message.Nonce,
      encoder.bigNumberAsBytes(message.Value),
      encoder.bigNumberAsBytes(message.GasPrice),
      message.GasLimit,
      message.Method,
      Buffer.from(message.Params || '', 'base64'),
    ]);
  },

  encodePaymentChannelParams(from, to) {
    const params = cbor.encode([encoder.addressAsBytes(from), encoder.addressAsBytes(to)]);
    return cbor.encode([codes.paymentChannel, params]);
  },

  encodeVoucher(voucher) {
    return cbor.encode([
      encoder.addressAsBytes(voucher.ChannelAddr),
      0, // TimeLockMin
      0, // TimeLockMax
      Buffer.from(''), // SecretPreimage
      null, // Extra
      voucher.Lane,
      voucher.Nonce,
      encoder.bigNumberAsBytes(voucher.Amount),
      0, // MinSettleHeight
      [], // Merges
      null, // Signature
    ]);
  },

  addressAsBytes(address) {
    const protocolIndicator = address[1];
    const protocolIndicatorByte = `0${protocolIndicator}`;

    if (parseInt(protocolIndicator, 10) === addressProtocols.id) {
      return Buffer.concat([
        Buffer.from(protocolIndicatorByte, 'hex'),
        Buffer.from([parseInt(address.slice(2))]),
      ]);
    }

    const addressDecoded = base32Decode(address.slice(2).toUpperCase(), 'RFC4648');
    const payload = addressDecoded.slice(0, -4);
    return Buffer.concat([Buffer.from(protocolIndicatorByte, 'hex'), Buffer.from(payload)]);
  },

  bigNumberAsBytes(bigNumber) {
    const hex = bigNumber.toString(16);
    const hexFixed = hex.length % 2 ? `0${hex}` : hex;
    return Buffer.concat([Buffer.from('00', 'hex'), Buffer.from(hexFixed, 'hex')]);
  },
};

export default encoder;
