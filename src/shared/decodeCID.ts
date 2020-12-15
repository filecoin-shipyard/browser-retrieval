import CID from 'cids'
import multibaseConstants from 'multibase/src/constants'
import multicodecLib from 'multicodec'
import multihash from 'multihashes'

export const decodeCID = (value) => {
  const cid = new CID(value).toJSON()
  const decoded = cid.version === 1 ? decodeCidV1(value, cid) : decodeCidV0(value, cid)

  if (!decoded) {
    throw new Error(`Unknown CID version ${cid.version} ${cid}`)
  }

  return {
    version: cid.version,
    hashAlg: decoded.multihash.name,
    rawLeaves: true,
    format: decoded.multicodec.name,

    importOptions:
      cid.version === 0
        ? undefined
        : {
            cidVersion: cid.version,
            hashAlg: decoded.multihash.name,
            rawLeaves: true,
            maxChunkSize: 1048576,
            maxChildrenPerNode: 1024,
          },
  }
}

const decodeCidV0 = (value, cid) => {
  return {
    cid,
    multibase: {
      name: 'base58btc',
      code: 'implicit',
    },
    multicodec: {
      name: cid.codec,
      code: 'implicit',
    },
    multihash: multihash.decode(cid.hash),
  }
}

const decodeCidV1 = (value, cid) => {
  return {
    cid,
    multibase: multibaseConstants.codes[value.substring(0, 1)],
    multicodec: {
      name: cid.codec,
      code: multicodecLib.getNumber(cid.codec),
    },
    multihash: multihash.decode(cid.hash),
  }
}
