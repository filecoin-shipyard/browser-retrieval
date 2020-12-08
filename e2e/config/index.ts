import * as dotenv from 'dotenv'

dotenv.config()

export const config = {
  lotus: {
    wallets: [process.env.LOTUS_WALLET_1, process.env.LOTUS_WALLET_2],
    keys: [process.env.LOTUS_WALLET_PRIVATE_1, process.env.LOTUS_WALLET_PRIVATE_2],
  },
  cid: process.env.CID,
  miner: process.env.MINER,
  uploadFilePath: process.env.UPLOAD_FILE_PATH,
}
