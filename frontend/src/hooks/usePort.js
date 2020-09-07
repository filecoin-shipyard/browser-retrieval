import { useState, useEffect } from 'react';

function usePort(channel) {
  const [state, setState] = useState();

  // useEffect(() => {
  //   const port = chrome.runtime.connect('', { name: channel });
  //   port.onMessage.addListener(setState);
  //
  //   return () => {
  //     port.disconnect();
  //   };
  // }, [channel]);

  return state;
}

export default usePort;
