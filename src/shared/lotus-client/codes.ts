import { Buffer } from 'buffer'
import CID from 'cids'
import multihash from 'multihashing-async'

import { appStore } from '../store/appStore'

async function makeBuiltin(string) {
  const buffer = Buffer.from(string)
  const hash = await multihash(buffer, 'identity')
  const cid = new CID(1, 'raw', hash).toString()

  return cid
}

const codesCache: any = {}

async function make() {
  try {
    codesCache.paymentChannel = await makeBuiltin('fil/2/paymentchannel')
  } catch (error) {
    console.error(error)

    appStore.logsStore.logError(`make lotus client codes failed: ${error.message}`)
  }
}

make()

export const codes = codesCache
