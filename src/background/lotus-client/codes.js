import { Buffer } from 'buffer';
import multihash from 'multihashing-async';
import CID from 'cids';
import ports from '../ports';

async function makeBuiltin(string) {
  const buffer = Buffer.from(string);
  const hash = await multihash(buffer, 'identity');
  const cid = new CID(1, 'raw', hash).toString();
  return cid;
}

const codes = {};

async function make() {
  codes.paymentChannel = await makeBuiltin('fil/2/paymentchannel');
}

make().catch(error => {
  console.error(error);
  ports.postLog(`ERROR: make lotus client codes failed: ${error.message}`);
});

export default codes;
