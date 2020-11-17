const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  env: {
    extensionPath: process.env.EXTENSION_PATH,
  },
};
