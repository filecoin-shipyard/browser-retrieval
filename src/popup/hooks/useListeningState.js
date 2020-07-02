/* global chrome */

import { useState, useEffect } from 'react';
import channels from '../../shared/channels';

function useListeningState() {
  const [state, setState] = useState();

  useEffect(() => {
    chrome.runtime
      .connect({ name: channels.listening })
      .onMessage.addListener(({ [channels.listening]: message }) => setState(message));
  }, []);

  return state;
}

export default useListeningState;
