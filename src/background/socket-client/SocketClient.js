import pushable from 'it-pushable';
import socketIO from 'socket.io-client';
import getOptions from 'src/shared/getOptions.js';
import { addOffer, clearOffers } from 'src/shared/offers';

import { messageRequestTypes, messageResponseTypes, messages } from '../../shared/messages';
import { sha256 } from '../../shared/sha256';
import Datastore from '../Datastore';
import ports from '../ports';
import Lotus from '../lotus-client/Lotus';
import { hasOngoingDeals, ongoingDeals } from 'src/background/ongoingDeals';

const CID = require('cids')
const multihash = require('multihashes')
const multicodecLib = require('multicodec')
const multibaseConstants = require('multibase/src/constants')

/** @type {SocketClient} */
let singletonSocketClient;

export default class SocketClient {
  /** @type {Datastore} Datastore */
  datastore;

  /**
   * @type {ReturnType<pushable>} importSink Sink to pass chunks to
   */
  importSink;

  /** @type {(cid: string, size: number) => void} */
  handleCidReceived;

  /** @type {ReturnType<socketIO>} Socket IO */
  socket;

  maxResendAttempts;

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

    if (Datastore) {
      client.datastore = datastore;
    }

    client.handleCidReceived = handleCidReceived;

    client.maxResendAttempts = 3;

    client._initializeSocketIO(options);
    client._addHandlers();

    singletonSocketClient = client;

    return client;
  }

  decodeCID (value) {
    const cid = new CID(value).toJSON();
    let decoded = undefined;
    if (cid.version === 0) {
      decoded = this.decodeCidV0(value, cid)
    }
    if (cid.version === 1) {
      decoded = this.decodeCidV1(value, cid)
    }
    if (decoded === undefined) {
      throw new Error('Unknown CID version', cid.version, cid)
    }
    let rawLeaves = false;
    return {
      version: cid.version, 
      hashAlg: decoded.multihash.name,
      rawLeaves: decoded.multicodec.name === 'raw',
      format: decoded.multicodec.name
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
    
  connect() {
    this.socket.open();
  }

  disconnect() {
    this.socket.close();
  }

  /**
   * @param {{ cid: string; minerID: string }} query query params
   */
  query({ cid, minerID }) {
    this.importSink = pushable();
    let decoded = this.decodeCID(cid);
    ports.postLog(`DEBUG: SocketClient.query: cidVersion ${decoded.version} hashAlg ${decoded.hashAlg} rawLeaves ${decoded.rawLeaves} format ${decoded.format}`);
    this.datastore.putContent(this.importSink, { cidVersion: decoded.version, hashAlg: decoded.hashAlg, rawLeaves: decoded.rawLeaves, format: decoded.format });

    const getQueryCIDMessage = messages.createGetQueryCID({ cid, minerID });
    this.socket.emit(getQueryCIDMessage.message, getQueryCIDMessage);
  }

  async buy({ cid, params, multiaddr }) {
    try {
      ports.postLog(`DEBUG: SocketClient._handleCidAvailability: creating Lotus instance`);
      const lotus = await Lotus.create();
      ports.postLog(
        `DEBUG: SocketClient._handleCidAvailability: sending ${params.price} attofil to ${params.paymentWallet}`,
      );
      await lotus.sendFunds(params.price, params.paymentWallet);
    } catch (error) {
      ports.postLog(`ERROR: SocketClient._handleCidAvailability: error: ${error.message}`);
    }

    const options = await getOptions();
    console.log(ongoingDeals);

    this.socket.emit(
      messageRequestTypes.fundsConfirmed,
      messages.createFundsSent({ clientToken: params.clientToken, paymentWallet: options.wallet }),
    );
  }

  // Private:

  _initializeSocketIO({ wsEndpoint }) {
    this.socket = socketIO(wsEndpoint, { autoConnect: false, transports: ['websocket'] });
  }

  _addHandlers() {
    this._handleCidAvailability();
    this._handleFundsConfirmed();
    this._handleChunk();
  }

  _handleCidAvailability() {
    this.socket.on(messageResponseTypes.cidAvailability, async (message) => {
      console.log(`Got ${messageResponseTypes.cidAvailability} message:`, message);

      if (!message.available) {
        if (!hasOngoingDeals()) {
          this.socket.disconnect();
        }

        ports.alertError(`CID not available: ${message.cid}`);

        return;
      }

      await addOffer({
        cid: message.cid,
        params: {
          price: message.priceAttofil,
          size: message.approxSize,
          clientToken: message.clientToken,
          paymentWallet: message.paymentWallet,
        },
      });
    });
  }

  _handleFundsConfirmed() {
    this.socket.on(messageResponseTypes.fundsConfirmed, (message) => {
      console.log(messageResponseTypes.fundsConfirmed);
      console.log(message);

      // TODO: periodically send this message to check on status
      this.socket.emit(
        messageRequestTypes.queryRetrievalStatus,
        messages.createQueryRetrievalStatus({ cid: message.cid, clientToken: message.clientToken }),
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

        this.handleCidReceived(message.cid, message.fullDataLenBytes);

        return;
      }

      const dataBuffer = Buffer.from(message.chunkData, 'base64');
      const validSha256 = message.chunkSha256 === sha256(dataBuffer);
      const validSize = dataBuffer.length === message.chunkLenBytes;

      if (validSha256 && validSize) {
        this.socket.emit(
          messageRequestTypes.chunkReceived,
          messages.createChunkReceived({
            ...message,
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
