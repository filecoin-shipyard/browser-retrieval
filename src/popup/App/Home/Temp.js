import classNames from 'classnames';
import React from 'react';
import socketIO from 'socket.io-client';

import { messages } from '../../services/messages';

// temp
const cid = 'bafk2bzacebbhqzi4y546h7gjbduauzha6z33ltequ7hpbvywnttc57xrwcit2';

const addHandlers = (socket) => {
  socket.on('cid_availability', (message) => {
    console.log('cid_availability');
    console.log(message);

    socket.emit('funds_confirmed', messages.createFundsSent());
  });

  socket.on('funds_confirmed', (message) => {
    console.log('funds_confirmed');
    console.log(message);

    // TODO: next step
  })
  socket.on('funds_confirmed_error_insufficient_funds', () => {})
  socket.on('funds_confirmed_error_price_changed', () => {})
}

function Temp({ className, ...rest }) {
  const clickme = () => {
    const socket = socketIO('http://localhost:3000');

    addHandlers(socket)

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
