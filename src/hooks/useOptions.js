/*global chrome*/

import React, { useContext, useState, useEffect } from 'react';

const OptionsContext = React.createContext();

const defaultValues = {
  port: 1234,
  pricePerByte: { '*': 0.0000000001 },
};

export function OptionsProvider(props) {
  const [options, setOptions] = useState();
  console.log(options);

  useEffect(() => {
    chrome.storage.local.get(Object.keys(defaultValues), result =>
      setOptions({ ...defaultValues, ...result }),
    );
  }, []);

  function set(data) {
    chrome.storage.local.set(data);
    setOptions(data);
  }

  return <OptionsContext.Provider value={[options, set]} {...props} />;
}

export const OptionsConsumer = OptionsContext.Consumer;

function useOptions() {
  return useContext(OptionsContext);
}

export default useOptions;
