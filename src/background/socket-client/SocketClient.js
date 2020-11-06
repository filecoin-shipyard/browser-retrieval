import pushable from 'it-pushable';
import socketIO from 'socket.io-client';
import getOptions from 'src/shared/getOptions.js';

import { messageRequestTypes, messageResponseTypes, messages } from '../../shared/messages';
import { sha256 } from '../../shared/sha256';
import Datastore from '../Datastore';
import ports from '../ports';
import Lotus from '../lotus-client/Lotus'

const CID = require('cids')
const multihash = require('multihashes')
const multicodecLib = require('multicodec')
const multibaseConstants = require('multibase/src/constants')

/** @type {SocketClient} */
let singletonSocketClient;

// TODO: TEMP
// --
// this.ongoingDeals[dealId] = {
//   id: dealId,
//   status: dealStatuses.new,
//   customStatus: undefined,
//   cid,
//   params: dealParams,
//   peerMultiaddr,
//   peerWallet,
//   sink,
//   sizeReceived: 0,
//   sizePaid: 0,
//   importerSink,
//   importer: this.datastore.putContent(importerSink),
//   voucherNonce: 1,
// };

export default class SocketClient {
  /** @type {Datastore} Datastore */
  datastore;

  /**
   * @type {ReturnType<pushable>} importSink Sink to pass chunks to
   */
  importSink;

  /** @type {(cid: string, size: number) => void} */
  handleCidReceived;

  socket;
  cid;
  minerID;
  clientToken;

  maxResendAttempts;

  // /**
  //  * @type {{
  //  *   id: dealId,
  //  *   status: dealStatuses.new,
  //  *   customStatus: undefined,
  //  *   cid,
  //  *   params: dealParams,
  //  *   peerMultiaddr,
  //  *   peerWallet,
  //  *   sink,
  //  *   sizeReceived: 0,
  //  *   sizePaid: 0,
  //  *   importerSink,
  //  *   importer: this.datastore.putContent(importerSink),
  //  *   voucherNonce: 1,
  //  * }} ongoingDeals
  //  */
  // ongoingDeals;

  /**
   * @param {{ datastore: Datastore }} services Services
   * @param {ReturnType<getOptions>} options Options
   * @param {{ handleCidReceived: (cid: string, size: number) => void }} Callbacks
   */
  static create({ datastore }, options, { handleCidReceived }) {
    if (singletonSocketClient) {
      return singletonSocketClient;
    }

    const client = new SocketClient();

    // client.ongoingDeals.id

    if (Datastore) {
      client.datastore = datastore;
    }

    client.handleCidReceived = handleCidReceived;

    client.maxResendAttempts = 3;

    client._connect(options);
    client._addHandlers();

    singletonSocketClient = client;

    return client;
  }

  decodeCID (value) {
    const cid = new CID(value).toJSON();
    let decode = undefined;
    if (cid.version === 0) {
      decode = this.decodeCidV0(value, cid)
    }
    if (cid.version === 1) {
      decode = this.decodeCidV1(value, cid)
    }
    if (decode === undefined) {
      throw new Error('Unknown CID version', cid.version, cid)
    }
    return {
      version:cid.version, 
      hashAlg: decode.multihash.name
    }
  }

  decodeCidV0 (value, cid) {
    return {
      cid,
      multibase: {
        name: 'base58btc',
        code: 'implicit'
      },
      multicodec: {
        name: cid.codec,
        code: 'implicit'
      },
      multihash: multihash.decode(cid.hash)
    }
  }

  decodeCidV1 (value, cid) {
    return {
      cid,
      multibase: multibaseConstants.codes[value.substring(0, 1)],
      multicodec: {
        name: cid.codec,
        code: multicodecLib.getNumber(cid.codec)
      },
      multihash: multihash.decode(cid.hash)
    }
  }

  /**
   * @param {{ cid: string; minerID: string }} query query params
   */
  query({ cid, minerID }) {
    this.importSink = pushable();
    let decode = this.decodeCID(cid);
    ports.postLog(`DEBUG: SocketClient.query: cid version ${decode.version} hash algorithm ${decode.hashAlg}`);
    this.datastore.putContent(this.importSink, { cidVersion: decode.version, hashAlg: decode.hashAlg });

    const getQueryCIDMessage = messages.createGetQueryCID({ cid, minerID });
    this.socket.emit(getQueryCIDMessage.message, getQueryCIDMessage);
  }

  // Private:

  _connect({ wsEndpoint }) {
    this.socket = socketIO(wsEndpoint);
  }

  _addHandlers() {
    this._handleCidAvailability();
    this._handleFundsConfirmed();
    this._handleChunk();
  }

  _handleCidAvailability() {
    this.socket.on(messageResponseTypes.cidAvailability, async (message) => {
      console.log(`Got ${messageResponseTypes.cidAvailability} message:`, message);

      this.clientToken = message.client_token;

      if (!message.available) {
        this.socket.disconnect();

        ports.alertError(`CID not available: ${message.cid}`);

        return;
      }

      try {
        ports.postLog(`DEBUG: SocketClient._handleCidAvailability: creating Lotus instance`);
        const lotus = await Lotus.create();
        ports.postLog(`DEBUG: SocketClient._handleCidAvailability: sending ${message.price_attofil} attofil to ${message.payment_wallet}`);
        await lotus.sendFunds(message.price_attofil, message.payment_wallet);
      } catch(error) {
        ports.postLog(`ERROR: SocketClient._handleCidAvailability: error: ${error.message}`);
      }

      const options = await getOptions();

      this.socket.emit(
        messageRequestTypes.fundsConfirmed,
        messages.createFundsSent({ clientToken: this.clientToken, paymentWallet: options.wallet }),
      );
    });
  }

  _handleFundsConfirmed() {
    this.socket.on(messageResponseTypes.fundsConfirmed, (message) => {
      console.log(messageResponseTypes.fundsConfirmed);
      console.log(message);

      // TODO: periodically send this message to check on status
      this.socket.emit(
        messageRequestTypes.queryRetrievalStatus,
        messages.createQueryRetrievalStatus({ cid: message.cid, clientToken: this.clientToken }),
      );
    });

    this.socket.on(messageResponseTypes.fundsConfirmedErrorInsufficientFunds, () => {
      // TODO: something
    });
    this.socket.on(messageResponseTypes.fundsConfirmedErrorPriceChanged, () => {
      // TODO: something
    });
  }

  _handleChunk() {
    this.socket.on(messageResponseTypes.chunk, (message) => {
      console.log('got message from server: chunk');
      console.log('message', message);

      // all chunks were received
      if (message.eof) {
        this.importSink.end();

        this.handleCidReceived(message.cid, message.full_data_len_bytes);

        return;
      }

      const dataBuffer = Buffer.from(message.chunk_data, 'base64');
      const validSha256 = message.chunk_sha256 === sha256(dataBuffer);
      const validSize = dataBuffer.length === message.chunk_len_bytes;

      if (validSha256 && validSize) {
        this.socket.emit(
          messageRequestTypes.chunkReceived,
          messages.createChunkReceived({
            ...message,
            clientToken: this.clientToken,
          }),
        );

        // pushed data needs to be an array of bytes
        this.importSink.push([...dataBuffer]);
      } else {
        if (this.maxResendAttempts > 0) {
          this.maxResendAttempts--;

          this.socket.emit(
            messageRequestTypes.chunkResend,
            messages.createChunkResend({
              ...message,
              clientToken: this.clientToken,
            }),
          );
        } else {
          // give up after N attempts
          this.socket.disconnect();
        }
      }
    });
  }
}
