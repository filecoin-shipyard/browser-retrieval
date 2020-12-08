console.log('using jest.config.ts')
console.log('--------------------')

const config = {
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testEnvironment: './e2e/puppeteer-environment.js',
  testMatch: ['**/e2e/**/*.spec.ts'],
  verbose: false,
  clearMocks: true,
  testTimeout: 1000 * 60 * 10,
}

export default config
