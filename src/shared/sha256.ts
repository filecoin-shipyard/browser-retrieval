const crypto = require('crypto')

export const sha256 = (message) => {
  const hash = crypto.createHash('sha256')

  hash.update(message)

  return hash.digest('hex')
}
