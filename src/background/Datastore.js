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
import ports from './ports.js';
import inspect from 'browser-util-inspect';

class Datastore {
  static async create(...args) {
    const datastore = new Datastore(...args);
    await datastore.initialize();
    return datastore;
  }

  async initialize() {
    this.repo = new Repo('filecoinretrieval');
    await this.repo.init({});
    await this.repo.open();
    this.blockService = new BlockService(this.repo);
    this.ipld = new Ipld({ blockService: this.blockService });
  }

  putFile(file, options) {
    ports.postLog(`DEBUG: Datastore.putFile:  options=${options}, content=${inspect(file)}`)
    return this.putContent(streamFromFile(file), options);
  }

  async putContent(content, options) {
    ports.postLog(`DEBUG: Datastore.putContent:  options=${inspect(options)}`);
    const entry = await last(
      importer(
        [{ content }],
        {
          put: async (data, { cid }) => {
            ports.postLog(`DEBUG: Datastore.putContent.put:  cid=${cid}, data=${inspect(data)}`);
            const block = new Block(data, cid);
            return this.blockService.put(block);
          },
        },
        options,
      ),
    );

    ports.postLog(`DEBUG: Datastore.putContent:  returning {cid:${inspect(entry.cid)}, size:${entry.unixfs ? entry.unixfs.fileSize() : undefined}`);
    return { cid: entry.cid.toString(), size: entry.unixfs ? entry.unixfs.fileSize() : undefined };
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
    const cids = [new CID(cid), ...(node.Links || []).map(({ Hash }) => Hash)];
    await all(this.ipld.removeMany(cids));
  }

  async close() {
    await this.repo.close();
  }
}

export default Datastore;
