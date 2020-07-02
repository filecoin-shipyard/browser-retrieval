/* global chrome */

import React, { useContext, useState, useEffect } from 'react';
import getOptions from 'src/shared/getOptions';

const OptionsContext = React.createContext();

export function OptionsProvider(props) {
  const [options, setOptions] = useState();

  useEffect(() => {
    getOptions().then(setOptions);
  }, []);

  function set(data) {
    chrome.storage.local.set(data);
    setOptions({ ...options, ...data });
  }

  return <OptionsContext.Provider value={[options, set]} {...props} />;
}

export const OptionsConsumer = OptionsContext.Consumer;

function useOptions() {
  return useContext(OptionsContext);
}

export default useOptions;
