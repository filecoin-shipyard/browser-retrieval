const { env } = require('./env');
const puppeteer = require('puppeteer');

const { extensionPath } = env;

const getBrowser = async () => {
  const browser = await puppeteer.launch({
    headless: false, // extension are allowed only in the head-full mode
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  });

  const extensionName = 'Filecoin Retrieval';

  const targets = await browser.targets();
  const extensionTarget = targets.find(({ _targetInfo }) => {
    return _targetInfo.title === extensionName && _targetInfo.type === 'background_page';
  });

  const extensionUrl = extensionTarget._targetInfo.url || '';
  const [, , extensionID] = extensionUrl.split('/');

  const extensionPage = `chrome-extension://${extensionID}/home.html`;

  const page = await browser.newPage();
  await page.goto(extensionPage);

  return {
    browser,
    page,
    extensionUrl,
    extensionID,
  };
};

const getBrowsers = () => {
  return Promise.all([getBrowser(), getBrowser()]);
};

module.exports = {
  getBrowsers,
};
