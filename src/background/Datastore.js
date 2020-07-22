import CID from 'cids';
import Ipld from 'ipld';
import Block from 'ipld-block';
import Repo from 'ipfs-repo';
import BlockService from 'ipfs-block-service';
import importer from 'ipfs-unixfs-importer';
import exporter from 'ipfs-unixfs-exporter';
import last from 'it-last';
import all from 'it-all';
import { Buffer } from 'buffer';
import streamFromFile from '../shared/streamFromFile';

class Datastore {
  static async create(...args) {
    const datastore = new Datastore(...args);
    await datastore.initialize();
    return datastore;
  }

  async initialize() {
    this.repo = new Repo('ipfs-filecoinretrieval');
    await this.repo.init({});
    await this.repo.open();
    this.blockService = new BlockService(this.repo);
    this.ipld = new Ipld({ blockService: this.blockService });
  }

  putFile(file, options) {
    return this.putContent(streamFromFile(file), options);
  }

  async putContent(content, options) {
    const entry = await last(
      importer(
        [{ content }],
        {
          put: async (data, { cid }) => {
            const block = new Block(data, cid);
            return this.blockService.put(block);
          },
        },
        options,
      ),
    );

    return { cid: entry.cid.toString(), size: entry.unixfs.fileSize() };
  }

  async get(cid) {
    return exporter(cid, this.ipld);
  }

  async cat(cid) {
    const entry = await this.get(cid);
    const bytes = [];

    for await (const buffer of entry.content()) {
      bytes.push(buffer);
    }

    return Buffer.concat(bytes);
  }

  async delete(cid) {
    const { node } = await this.get(cid);
    const cids = [new CID(cid), ...node.Links.map(({ Hash }) => Hash)];
    await all(this.ipld.removeMany(cids));
  }
}

export default Datastore;
