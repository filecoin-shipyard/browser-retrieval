import './Toast.css';

import classNames from 'classnames';
import React from 'react';
import useLocalStorage from 'react-use-localstorage';

import * as toast from '../../../shared/toast';

function Toast({ className, ...rest }) {
  const [messagesJson, setMessagesJson] = useLocalStorage('toast', '[]');

  const messages = JSON.parse(messagesJson);

  if (!messages || !messages.length) {
    return null;
  }

  const dismiss = (id) => {
    toast.dismiss(id, setMessagesJson)
  }

  return (
    <div className={classNames(className, 'p-4 toast')} {...rest}>
      {messages.map((msg) => (
        <div key={msg.id} className={classNames(msg.type, 'toast-item')}>
          <div>{msg.message}</div>
          <button className="dismiss" onClick={() => dismiss(msg.id)}>
            dismiss
          </button>
        </div>
      ))}
    </div>
  );
}

export default Toast;
