const dotenv = require('dotenv');

dotenv.config();

const config = {
  env: {
    extensionPath: process.env.EXTENSION_PATH,
    lotus: {
      wallets: [process.env.LOTUS_WALLET_1, process.env.LOTUS_WALLET_2],
      keys: [process.env.LOTUS_WALLET_PRIVATE_1, process.env.LOTUS_WALLET_PRIVATE_2],
    },
    cid: process.env.CID,
    miner: process.env.MINER,
  },
};

module.exports = config;
