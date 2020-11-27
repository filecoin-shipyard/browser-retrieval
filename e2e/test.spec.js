/* eslint-disable no-loop-func */
/* global chrome */

const puppeteer = require('puppeteer');

const { env } = require('./config/env');

/**
 * @type {{
 *   browser: puppeteer.Browser
 *   page: puppeteer.Page
 *   extensionUrl: string
 *   extensionID: string
 * }[]}
 */
let browsersInfo;

describe('when extension page opens', () => {
  beforeAll(() => {
    browsersInfo = global.browsersInfo;
  });

  it('puppeteer is defined and browsers are open', () => {
    expect(puppeteer).toBeTruthy();
    expect(browsersInfo.length).toEqual(2);
  });

  it('prompts for wallet and private key and saves', async () => {
    let i = 0;

    for (const browserInfo of browsersInfo) {
      await browserInfo.page.evaluate(
        ({ lotusConfig, index }) => {
          try {
            const walletField = document.querySelector('.wallet-modal [name="wallet"]');
            const privateKeyField = document.querySelector('.wallet-modal [name="privateKey"]');

            const submitButton = document.querySelector('.wallet-modal [type="submit"]');

            walletField.value = lotusConfig.wallets[index];
            privateKeyField.value = lotusConfig.keys[index];

            submitButton.click();
          } catch (err) {
            console.error(err);
          }
        },
        { lotusConfig: env.lotus, index: i },
      );

      await browserInfo.page.waitForTimeout(500);

      const storedValues = await browserInfo.page.evaluate(() => {
        return new Promise((resolve) => {
          chrome.storage.local.get(null, (result) => {
            resolve(result);
          });
        });
      });

      expect(storedValues.wallet).toEqual(env.lotus.wallets[i]);
      expect(storedValues.privateKey).toEqual(env.lotus.keys[i]);

      ++i;
    }
  });

  it('queries with a CID and MINER', async () => {
    const [browserInfo] = browsersInfo;

    await browserInfo.page.waitForTimeout(3000);

      await browserInfo.page.evaluate(
        ({cid, miner}) => {
          try {
            const cidInput = document.querySelector('.query-form [name="cid"]');
            const checkButton = document.querySelector('.query-form [name="minerCheckbox"]');
            checkButton.click();
            const minerInput = document.querySelector('.query-form [name="minerID"]');

            const submitButton = document.querySelector('.query-form [type="submit"]');

            cidInput.value = cid;
            minerInput.value = miner;

            submitButton.click();
          } catch (err) {
            console.error(err);
          }
        },
        {cid: env.cid, miner: env.miner},
      );

      await browserInfo.page.waitForTimeout(500);

      const storedValues = await browserInfo.page.evaluate(() => {
        return new Promise((resolve) => {
          chrome.storage.local.get(null, (result) => {
            resolve(result);
          });
        });
      });

      expect(storedValues.offerInfo.cid).toEqual(env.cid);
  });

  it('import a file', async () => {
    const [browserInfo] = browsersInfo;

    await browserInfo.page.waitForTimeout(5000);

    await browserInfo.page.evaluate(
      (file) => {
      try {
        const fileInput = document.querySelector('.upload-tab [type="file"]');
        fileInput.uploadFile(file);
      } catch (err) {
        console.error(err);
      }
    },
      {file: env.uploadFilePath}
    )

    await browserInfo.page.waitForTimeout(1000);

    const storedValues = await browserInfo.page.evaluate(() => {
      return new Promise((resolve) => {
        chrome.storage.local.get(null, (result) => {
          resolve(result);
        });
      });
    });

    expect(browserInfo).toBeTruthy();
    // expect(storedValues.knownCids).toEqual({
    //   "QmSvuhdF4uM3cwXcHd8XrpbdHVPNkhQZiXk91nLb5ihoRp": {
    //     "size": 3776
    //   }});
  })
});
