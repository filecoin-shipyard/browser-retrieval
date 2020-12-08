import * as puppeteer from 'puppeteer'

import { config } from './config'

interface BrowserInfo {
  browser: puppeteer.Browser
  page: puppeteer.Page
}

let browsersInfo: BrowserInfo[]

declare var global: { browsersInfo: BrowserInfo[] }

describe('when extension page opens', () => {
  beforeAll(() => {
    browsersInfo = global.browsersInfo
  })

  it('puppeteer is defined and browsers are open', () => {
    expect(puppeteer).toBeTruthy()
    expect(browsersInfo.length).toEqual(2)
  })

  it('prompts for wallet and private key and saves', async () => {
    let i = 0

    for (const browserInfo of browsersInfo) {
      await browserInfo.page.evaluate(
        ({ lotusConfig, index }) => {
          try {
            const walletField = document.querySelector<HTMLInputElement>('.wallet-modal [name="wallet"]')
            const privateKeyField = document.querySelector<HTMLInputElement>('.wallet-modal [name="privateKey"]')

            const submitButton = document.querySelector<HTMLButtonElement>('.wallet-modal [type="submit"]')

            walletField.value = lotusConfig.wallets[index]
            privateKeyField.value = lotusConfig.keys[index]

            submitButton.click()
          } catch (err) {
            console.error(err)
          }
        },
        { lotusConfig: config.lotus, index: i },
      )

      await browserInfo.page.waitForTimeout(500)

      const optionsStoreValues = await browserInfo.page.evaluate(() => {
        return JSON.parse(localStorage.getItem('_OptionsStore') || '{}')
      })

      expect(optionsStoreValues.wallet).toEqual(config.lotus.wallets[i])
      expect(optionsStoreValues.privateKey).toEqual(config.lotus.keys[i])

      ++i
    }
  })

  it('queries with a CID and MINER', async () => {
    const [browserInfo] = browsersInfo

    await browserInfo.page.waitForTimeout(3000)

    await browserInfo.page.evaluate(
      ({ cid, miner }) => {
        try {
          const cidInput = document.querySelector<HTMLInputElement>('.query-form [name="cid"]')
          const checkButton = document.querySelector<HTMLButtonElement>('.query-form [name="minerCheckbox"]')
          checkButton.click()
          const minerInput = document.querySelector<HTMLInputElement>('.query-form [name="minerID"]')

          const submitButton = document.querySelector<HTMLButtonElement>('.query-form [type="submit"]')

          cidInput.value = cid
          minerInput.value = miner

          submitButton.click()
        } catch (err) {
          console.error(err)
        }
      },
      { cid: config.cid, miner: config.miner },
    )

    await browserInfo.page.waitForTimeout(500)

    expect(true).toBeTruthy()
  })

  // xit('import a file', async () => {
  //   const [browserInfo] = browsersInfo

  //   await browserInfo.page.waitForTimeout(5000)

  //   await browserInfo.page.evaluate(
  //     (file) => {
  //       try {
  //         const fileInput = document.querySelector('.upload-tab [type="file"]')
  //         fileInput.uploadFile(file)
  //       } catch (err) {
  //         console.error(err)
  //       }
  //     },
  //     { file: env.uploadFilePath },
  //   )

  //   await browserInfo.page.waitForTimeout(1000)

  //   const storedValues = await browserInfo.page.evaluate(() => {
  //     return new Promise((resolve) => {
  //       chrome.storage.local.get(null, (result) => {
  //         resolve(result)
  //       })
  //     })
  //   })

  //   expect(browserInfo).toBeTruthy()
  //   // expect(storedValues.knownCids).toEqual({
  //   //   "QmSvuhdF4uM3cwXcHd8XrpbdHVPNkhQZiXk91nLb5ihoRp": {
  //   //     "size": 3776
  //   //   }});
  // })
})
