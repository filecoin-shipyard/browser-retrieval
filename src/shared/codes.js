import { Buffer } from 'buffer';
import CID from 'cids';

class EncodableCID extends CID {
  static TAG = 42; // https://github.com/ipld/cid-cbor

  encodeCBOR(encoder) {
    encoder._pushTag(EncodableCID.TAG);
    return encoder.pushAny(Buffer.from(this.toString()));
  }
}

async function makeBuiltin(string) {
  const buffer = Buffer.from(string);
  const hash = Buffer.from([0, buffer.length, ...buffer]);
  return new EncodableCID(1, 'raw', hash, 'identity');
}

const codes = {};

async function make() {
  try {
    codes.paymentChannel = await makeBuiltin('fil/1/paymentchannel');
  } catch (error) {
    console.error(error);
  }
}

make();

export default codes;
