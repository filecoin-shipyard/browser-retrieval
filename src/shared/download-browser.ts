export const downloadBrowser = ({ cid, blob }: { cid: string; blob: Blob }) => {
  const url = URL.createObjectURL(blob)

  const linkElement = document.createElement('a')
  linkElement.href = url

  linkElement.download = cid

  linkElement.click()

  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 0)
}
