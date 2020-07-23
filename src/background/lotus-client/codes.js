import { Buffer } from 'buffer';
import CID from 'cids';
import ports from '../ports';

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
  codes.paymentChannel = await makeBuiltin('fil/1/paymentchannel');
}

make().catch(error => {
  console.error(error);
  ports.postLog(`ERROR: make lotus client codes failed: ${error.message}`);
});

export default codes;
