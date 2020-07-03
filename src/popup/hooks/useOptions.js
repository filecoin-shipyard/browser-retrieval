/* global chrome */

import React, { useContext, useState, useEffect } from 'react';
import getOptions from 'src/shared/getOptions';
import onOptionsChanged from 'src/shared/onOptionsChanged';

const OptionsContext = React.createContext();

export function OptionsProvider(props) {
  const [options, setOptions] = useState();

  useEffect(() => {
    getOptions().then(setOptions);
  }, []);

  useEffect(() => {
    return onOptionsChanged(() => getOptions().then(setOptions));
  }, [options]);

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
