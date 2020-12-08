const puppeteer = require('puppeteer')

const getBrowser = async () => {
  const browser = await puppeteer.launch({
    headless: true,
  })

  const page = await browser.newPage()
  await page.goto(`http://localhost:${process.env.PORT || 3000}`)

  return {
    browser,
    page,
  }
}

const getBrowsers = () => {
  return Promise.all([getBrowser(), getBrowser()])
}

module.exports = {
  getBrowsers,
}
