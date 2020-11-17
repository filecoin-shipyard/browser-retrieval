console.log('using jest.config.js');

const config = {
  testEnvironment: './e2e/puppeteer-environment.js',
  testMatch: ['**/e2e/**/*.spec.js'],
  verbose: false,
  clearMocks: true,
  testTimeout: 1000 * 60 * 10,
};

module.exports = config;
