import { Buffer } from 'buffer';
import secp256k1 from 'secp256k1';
import base32Encode from 'base32-encode';
import blake2b from './blake2b';
import encoder from './encoder';
import signatureTypes from './signatureTypes';

const cidPrefix = Buffer.from([0x01, 0x71, 0xa0, 0xe4, 0x02, 0x20]);

const signer = {
  matchWalletAndPrivateKey(wallet, privateKeyString) {
    const privateKey = signer.getPrivateKey(privateKeyString);
    const pubKey = secp256k1.publicKeyCreate(privateKey);

    let uncompressedPublicKey = new Uint8Array(65);
    secp256k1.publicKeyConvert(pubKey, false, uncompressedPublicKey);
    uncompressedPublicKey = Buffer.from(uncompressedPublicKey);

    const payload = blake2b(uncompressedPublicKey, 20);
    const checksum = blake2b(Buffer.concat([Buffer.from('01', 'hex'), payload]), 4);

    const addressWithoutPrefix = base32Encode(Buffer.concat([payload, checksum]), 'RFC4648', {
      padding: false,
    }).toLowerCase();

    return wallet.substring(2) === addressWithoutPrefix;
  },

  getPrivateKey(string) {
    const privateKey =
      string.slice(-1) === '=' ? Buffer.from(string, 'base64') : Buffer.from(string, 'hex');

    if (privateKey.length !== 32) {
      throw new Error('Invalid private key length');
    }

    return privateKey;
  },

  signMessage(message, privateKey) {
    const encoded = encoder.encodeMessage(message);
    const cid = Buffer.concat([cidPrefix, blake2b(encoded, 32)]);
    const signature = signer.signBytes(cid, privateKey);

    return {
      Message: message,
      Signature: {
        Type: signatureTypes.secp256k1,
        Data: signature,
      },
    };
  },

  signBytes(bytes, privateKey) {
    const digest = blake2b(bytes, 32);
    const { signature, recid } = secp256k1.ecdsaSign(digest, privateKey);
    return Buffer.concat([Buffer.from(signature), Buffer.from([recid])]).toString('base64');
  },
};

export default signer;
