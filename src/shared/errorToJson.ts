export const errorToJSON = (err) => {
  if (typeof err === 'string') {
    return {
      stack: new Error().stack,
      message: err,
    }
  }

  const alt: any = {}

  Object.getOwnPropertyNames(err).forEach((key) => {
    alt[key] = err[key]
  }, err)

  return alt
}
