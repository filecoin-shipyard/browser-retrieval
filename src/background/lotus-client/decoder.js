import { Buffer } from 'buffer';
import cbor from 'cbor';

const decoder = {
  decodePaymentChannelAddressFromReceipt(receipt) {
    const hex = Buffer.from(receipt.Return, 'base64').toString('hex');
    const [, addressBuffer] = cbor.decode(hex);
    console.log(addressBuffer);
    // TODO: decode address from buffer as per https://github.com/filecoin-project/go-address/blob/master/address.go#L380
    return 'address';
  },
};

export default decoder;
