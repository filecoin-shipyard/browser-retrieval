import { Buffer } from 'buffer';
import blake from 'blakejs';
import secp256k1 from 'secp256k1';
import encoder from './encoder';
import signatureTypes from './signatureTypes';

const CID_PREFIX = Buffer.from([0x01, 0x71, 0xa0, 0xe4, 0x02, 0x20]);

const signer = {
  getPrivateKey(string) {
    const privateKey =
      string.slice(-1) === '=' ? Buffer.from(string, 'base64') : Buffer.from(string, 'hex');

    if (privateKey.length !== 32) {
      throw new Error('Invalid private key length');
    }

    return privateKey;
  },

  async signMessage(message, privateKey) {
    const cid = signer.getCID(message);
    const signature = await this.signBytes(cid, privateKey);

    return {
      Message: message,
      Signature: {
        Type: signatureTypes.secp256k1,
        Data: signature,
      },
    };
  },

  async signBytes(bytes, privateKey) {
    const digest = signer.getDigest(bytes);
    const { signature, recid } = secp256k1.ecdsaSign(digest, privateKey);
    return Buffer.concat([Buffer.from(signature), Buffer.from([recid])]).toString('base64');
  },

  getDigest(bytes) {
    const blakeContext = blake.blake2bInit(32);
    blake.blake2bUpdate(blakeContext, bytes);
    return Buffer.from(blake.blake2bFinal(blakeContext));
  },

  getCID(message) {
    const encoded = encoder.encodeMessage(message);
    return Buffer.concat([CID_PREFIX, signer.getDigest(encoded)]);
  },
};

export default signer;
