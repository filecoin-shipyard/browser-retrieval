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
    const encoded = encoder.encodeMessage(message);
    const digest = signer.getDigest(encoded);
    const signature = await this.signBytes(digest, privateKey);

    return {
      Message: message,
      Signature: {
        Type: signatureTypes.secp256k1,
        Data: signature,
      },
    };
  },

  async signBytes(bytes, privateKey) {
    const { signature, recid } = secp256k1.ecdsaSign(bytes, privateKey);
    return Buffer.concat([Buffer.from(signature), Buffer.from([recid])]).toString('base64');
  },

  getDigest(message) {
    const blakeContext = blake.blake2bInit(32);
    blake.blake2bUpdate(blakeContext, CID_PREFIX);
    blake.blake2bUpdate(blakeContext, signer.getCID(message));
    return Buffer.from(blake.blake2bFinal(blakeContext));
  },

  getCID(message) {
    const blakeContext = blake.blake2bInit(32);
    blake.blake2bUpdate(blakeContext, message);
    return Buffer.from(blake.blake2bFinal(blakeContext));
  },
};

export default signer;
