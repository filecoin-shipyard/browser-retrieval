/* global chrome */

import React, { useContext, useState, useEffect, useCallback } from 'react';
import getOptions from 'src/shared/getOptions';
import onOptionsChanged from 'src/shared/onOptionsChanged';

const OptionsContext = React.createContext();

export function OptionsProvider(props) {
  const [options, setOptions] = useState();

  const handleOptionsChange = useCallback(
    changes => {
      console.log('options changed');
      setOptions({ ...options, changes });
    },
    [options],
  );

  useEffect(() => {
    getOptions().then(setOptions);
    return onOptionsChanged(handleOptionsChange);
  }, [handleOptionsChange]);

  function set(data) {
    chrome.storage.local.set(data);
  }

  return <OptionsContext.Provider value={[options, set]} {...props} />;
}

export const OptionsConsumer = OptionsContext.Consumer;

function useOptions() {
  return useContext(OptionsContext);
}

export default useOptions;
