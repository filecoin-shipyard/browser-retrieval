/* global chrome */

import React from 'react';
import classNames from 'classnames';
import Card from 'src/popup/components/Card';
import Label from 'src/popup/components/Label';
import IconButton from 'src/popup/components/IconButton';
import Pre from 'src/popup/components/Pre';
import usePort from 'src/popup/hooks/usePort';
import channels from 'src/shared/channels';
import messageTypes from 'src/shared/messageTypes';
import './Logs.css';

function Logs({ className, ...rest }) {
  const logs = usePort(channels.logs);

  function sendClearLogsMessage() {
    chrome.runtime.sendMessage({ messageType: messageTypes.clearLogs });
  }

  return (
    <Card className={classNames(className, 'p-4')} {...rest}>
      <div className="flex">
        <Label className="flex-grow mb-2">Logs:</Label>
        <IconButton icon="trash" onClick={sendClearLogsMessage} />
      </div>
      <Pre className="Logs--pre">{logs || ' '}</Pre>
    </Card>
  );
}

export default Logs;
