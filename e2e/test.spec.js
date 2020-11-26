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

      await browserInfo.page.waitForTimeout(1000);

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

      await browserInfo.page.evaluate(
        () => {
          try {
            const cid = document.querySelector('.query-form [name="cid"]');
            const checkButton = document.querySelector('.query-form [name="minerCheckbox"]');
            checkButton.click();
            const minerID = document.querySelector('.query-form [name="minerID"]');


            const submitButton = document.querySelector('.query-form [type="submit"]');

            cid.value = 'bafk2bzacebhlhbcnhmvover42qq5bx773c522skieho6nhtbz7d2ow3f4sw24';
            minerID.value = 'f019243';


            submitButton.click();
          } catch (err) {
            console.error(err);
          }
        }
      );

      await browserInfo.page.waitForTimeout(4000);

      const storedValues = await browserInfo.page.evaluate(() => {
        return new Promise((resolve) => {
          chrome.storage.local.get(null, (result) => {
            resolve(result);
          });
        });
      });

      expect(storedValues.offerInfo.cid).toEqual('bafk2bzacebhlhbcnhmvover42qq5bx773c522skieho6nhtbz7d2ow3f4sw24');
  });
});
