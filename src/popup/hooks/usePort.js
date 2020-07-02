/* global chrome */

import { useState, useEffect } from 'react';

function usePort(channel) {
  const [state, setState] = useState();

  useEffect(() => {
    chrome.runtime
      .connect({ name: channel })
      .onMessage.addListener(({ [channel]: message }) => setState(message));
  }, [channel]);

  return state;
}

export default usePort;
