import React, { useContext, useState, useEffect } from 'react';
import getOptions from 'src/shared/getOptions';
import setOptions from 'src/shared/setOptions';
import onOptionsChanged from 'src/shared/onOptionsChanged';

const OptionsContext = React.createContext();

export function OptionsProvider(props) {
  const [optionsState, setOptionsState] = useState();

  useEffect(() => {
    getOptions().then(setOptionsState);
  }, []);

  useEffect(() => {
    return onOptionsChanged(() => getOptions().then(setOptionsState));
  }, [optionsState]);

  return <OptionsContext.Provider value={[optionsState, setOptions]} {...props} />;
}

export const OptionsConsumer = OptionsContext.Consumer;

function useOptions() {
  return useContext(OptionsContext);
}

export default useOptions;
