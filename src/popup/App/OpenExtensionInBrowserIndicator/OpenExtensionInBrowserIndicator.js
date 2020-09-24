/* global chrome */

import React from 'react';
import IconButton from "src/popup/components/IconButton";
import messageTypes from "src/shared/messageTypes";
import classNames from "classnames";

function OpenExtensionInBrowserIndicator({ className, ...rest }) {
    function toggleSendMessage() {
        chrome.runtime.sendMessage({ messageType: messageTypes.openExtensionInBrowser });
    }

  return (
      <div className={classNames(className, 'relative mx-2')} {...rest}>
          <IconButton icon="openInBrowser" onClick={toggleSendMessage} />
      </div>
  );
}

export default OpenExtensionInBrowserIndicator;
