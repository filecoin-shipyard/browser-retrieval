import socketIO from 'socket.io-client';

import { messageRequestTypes, messageResponseTypes, messages } from '../../shared/messages';
import { sha256 } from '../../shared/sha256';

export default class SocketClient {
  socket;
  cid;
  minerID;

  static create(options, { cid, minerID }) {
    const client = new SocketClient();

    client.cid = cid;
    client.minerID = minerID;

    client._connect(options);
    client._addHandlers();

    return client;
  }

  query() {
    console.log('messages', messages)

    const getQueryCIDMessage = messages.createGetQueryCID({ cid: this.cid, minerID: this.minerID });
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
    this.socket.on(messageResponseTypes.cidAvailability, (message) => {
      console.log(messageResponseTypes.cidAvailability);
      console.log(message);

      if (!message.available) {
        // TODO: give up

        return;
      }

      this.socket.emit(messageRequestTypes.fundsConfirmed, messages.createFundsSent());
    });
  }

  _handleFundsConfirmed() {
    this.socket.on(messageResponseTypes.fundsConfirmed, (message) => {
      console.log(messageResponseTypes.fundsConfirmed);
      console.log(message);

      // TODO: periodically send this message to check on status
      this.socket.emit(messageRequestTypes.queryRetrievalStatus, messages.createQueryRetrievalStatus(this.cid));
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

      const dataBuffer = Buffer.from(message.chunk_data, 'base64');
      const validSha256 = message.chunk_sha256 === sha256(dataBuffer);
      const validSize = dataBuffer.length === message.chunk_len_bytes;

      if (validSha256 && validSize) {
        this.socket.emit(messageRequestTypes.chunkReceived, messages.createChunkReceived(message));

        // TODO: proccess received data
        console.log('chunk is valid');
      } else {
        this.socket.emit(messageRequestTypes.chunkResend, messages.createChunkResend(message));

        console.log('chunk is NOT valid, sending `chunkResend`');
      }
    });
  }
}
