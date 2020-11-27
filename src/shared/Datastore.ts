import { Buffer } from 'buffer'
import CID from 'cids'
import BlockService from 'ipfs-block-service'
import Repo from 'ipfs-repo'
import exporter from 'ipfs-unixfs-exporter'
import importer from 'ipfs-unixfs-importer'
import Ipld from 'ipld'
import Block from 'ipld-block'
import all from 'it-all'
import last from 'it-last'

import { streamFromFile } from './streamFromFile'

let datastoreInstance: Datastore

export class Datastore {
  repo: Repo
  blockService: BlockService
  ipld: Ipld

  static async create() {
    if (!datastoreInstance) {
      datastoreInstance = new Datastore()
      await datastoreInstance.initialize()
    }

    return datastoreInstance
  }

  async initialize() {
    this.repo = new Repo('filecoinretrieval')
    await this.repo.init({})
    await this.repo.open()
    this.blockService = new BlockService(this.repo)
    this.ipld = new Ipld({ blockService: this.blockService })
  }

  putFile(file, options) {
    // TODO: @brunolm migrate
    // ports.postLog(`DEBUG: Datastore.putFile:  options=${options}, content=${inspect(file)}`)
    return this.putContent(streamFromFile(file), options)
  }

  async putContent(content, options?) {
    // TODO: @brunolm migrate
    // ports.postLog(`DEBUG: Datastore.putContent:  options=${inspect(options)}`);
    const entry: any = await last(
      importer(
        [{ content }],
        {
          put: async (data, { cid }) => {
            // TODO: @brunolm migrate
            // // ports.postLog(`DEBUG: Datastore.putContent.put:  cid=${cid}, data=${inspect(data)}`);
            // TODO: @brunolm migrate
            // ports.postLog(`DEBUG: Datastore.putContent.put writing CID: ${cid}`)
            const block = new Block(data, cid)
            return this.blockService.put(block)
          },
        },
        options,
      ),
    )

    // TODO: @brunolm migrate
    // ports.postLog(`DEBUG: Datastore.putContent:  returning {cid:${inspect(entry.cid)}, size:${entry.unixfs ? entry.unixfs.fileSize() : undefined}`);
    return { cid: entry.cid.toString(), size: entry.unixfs ? entry.unixfs.fileSize() : undefined }
  }

  async get(cid) {
    return exporter(cid, this.ipld)
  }

  async cat(cid) {
    const entry = await this.get(cid)
    const bytes = []

    for await (const buffer of entry.content()) {
      bytes.push(buffer)
    }

    return Buffer.concat(bytes)
  }

  async delete(cid) {
    const { node } = await this.get(cid)
    const cids = [new CID(cid), ...(node.Links || []).map(({ Hash }) => Hash)]
    await all(this.ipld.removeMany(cids))
  }

  async close() {
    await this.repo.close()
  }
}
