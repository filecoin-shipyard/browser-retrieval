import { addressAsBytes } from '@zondax/filecoin-signing-tools/js/src/utils';
import cbor from 'cbor';
import codes from './codes';

const encoder = {
  encodePaymentChannelParams(from, to) {
    const params = cbor.encode([addressAsBytes(from), addressAsBytes(to)]);
    const enc = cbor.encode([codes.paymentChannel, params]);
    return enc.toString('hex');
  },

  encodeVoucher(voucher) {
    // TODO: create voucher cbor as per https://github.com/filecoin-project/specs-actors/blob/master/actors/builtin/paych/cbor_gen.go#L552
    return cbor.encode(voucher);
  },
};

export default encoder;
