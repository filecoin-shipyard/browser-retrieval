import IdbStore from 'datastore-idb';
import { Key } from 'interface-datastore';
import CID from 'cids';
import multihash from 'multihashing-async';

class Datastore extends IdbStore {
  async put(file) {
    const url = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });

    const content = url.split(',')[1];
    const buffer = multihash.Buffer.from(content, 'base64');
    const hash = await multihash(buffer, 'sha2-256');
    const cid = new CID(1, 'multiaddr', hash).toString();

    await super.put(new Key(cid), url);

    return cid;
  }

  async get(cid) {
    const buffer = await super.get(new Key(cid));
    return buffer.toString();
  }

  async delete(cid) {
    await super.delete(new Key(cid));
  }
}

export default Datastore;
