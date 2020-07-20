import IdbStore from 'datastore-idb';
import { Key } from 'interface-datastore';
import CID from 'cids';
import multihash from 'multihashing-async';

class Datastore extends IdbStore {
  static async create(...args) {
    const datastore = new Datastore(...args);
    await datastore.open();
    return datastore;
  }

  async putFile(file) {
    const data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => resolve(reader.result);
      reader.readAsArrayBuffer(file);
    });

    // TODO: split data into blocks
    return this.putData(data);
  }

  async putData(data) {
    const buffer = multihash.Buffer.from(data);
    const hash = await multihash(buffer, 'sha2-256');
    const cid = new CID(1, 'multiaddr', hash).toString();
    await this.put(cid, data);
    return { cid, size: buffer.length };
  }

  async put(cid, data) {
    return super.put(new Key(cid), data);
  }

  async get(cid) {
    return super.get(new Key(cid));
  }

  async delete(cid) {
    await super.delete(new Key(cid));
  }
}

export default Datastore;
