/* global chrome */

import React from 'react';
import classNames from 'classnames';
import messageTypes from "src/shared/messageTypes";

function OpenInBrowserIndicator({ className, icon, ...rest }) {
  function toggleSendMessage() {
      chrome.runtime.sendMessage({ messageType: messageTypes.openExtensionInBrowser });
  }

  return (
    <div className={classNames(className, 'relative mx-2')} {...rest}>
      <button type="button" className="focus:outline-none" onClick={toggleSendMessage}>
        {icon}
      </button>
    </div>
  );
}

export default OpenInBrowserIndicator;
