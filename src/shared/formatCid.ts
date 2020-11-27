export const formatCid = (cid) => {
  if (!cid) {
    return null
  }

  return cid.substring(0, 3) + '...' + cid.substring(cid.length - 6, cid.length)
}
