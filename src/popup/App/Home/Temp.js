import classNames from 'classnames';
import React from 'react';
import socketIO from 'socket.io-client';
import useOptions from 'src/popup/hooks/useOptions';

import { messageRequestTypes, messageResponseTypes, messages } from '../../services/messages';
import { sha256 } from '../../services/sha256';

// temp
const cid = 'bafk2bzacebbhqzi4y546h7gjbduauzha6z33ltequ7hpbvywnttc57xrwcit2';

const handleCidAvailability = (socket) => {
  socket.on(messageResponseTypes.cidAvailability, (message) => {
    console.log(messageResponseTypes.cidAvailability);
    console.log(message);

    if (!message.available) {
      // TODO: give up

      return;
    }

    socket.emit(messageRequestTypes.fundsConfirmed, messages.createFundsSent());
  });
};

const handleFundsConfirmed = (socket) => {
  socket.on(messageResponseTypes.fundsConfirmed, (message) => {
    console.log(messageResponseTypes.fundsConfirmed);
    console.log(message);

    // TODO: periodically send this message to check on status
    socket.emit(messageRequestTypes.queryRetrievalStatus, messages.createQueryRetrievalStatus(cid));
  });

  socket.on(messageResponseTypes.fundsConfirmedErrorInsufficientFunds, () => {
    // TODO: something
  });
  socket.on(messageResponseTypes.fundsConfirmedErrorPriceChanged, () => {
    // TODO: something
  });
};

const handleChunk = (socket) => {
  socket.on(messageResponseTypes.chunk, (message) => {
    const dataBuffer = Buffer.from(message.chunk_data, 'base64');
    const validSha256 = message.chunk_sha256 === sha256(dataBuffer);
    const validSize = dataBuffer.length === message.chunk_len_bytes;

    if (validSha256 && validSize) {
      socket.emit(messageRequestTypes.chunkReceived, messages.createChunkReceived(message))

      // TODO: proccess received data
    } else {
      socket.emit(messageRequestTypes.chunkReceived, messages.createChunkResend(message))
    }
  });
};

const addHandlers = (socket) => {
  handleCidAvailability(socket);
  handleFundsConfirmed(socket);
  handleChunk(socket);
};

function Temp({ className, ...rest }) {
  const [options] = useOptions();

  console.log('options.wsEndpoin', options.wsEndpoin);

  const socket = socketIO(options.wsEndpoin);
  addHandlers(socket);

  const clickme = () => {
    const getQueryCIDMessage = messages.createGetQueryCID(cid);
    socket.emit(getQueryCIDMessage.message, getQueryCIDMessage);
  };

  return (
    <div className={classNames(className, 'p-4')} {...rest}>
      <div>
        <button onClick={clickme}>CLICK ME</button>
      </div>
    </div>
  );
}

export default Temp;
