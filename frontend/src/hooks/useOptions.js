import React, { useContext, useState, useEffect } from 'react';
import getOptions from '../shared/getOptions';
import setOptions from '../shared/setOptions';

const OptionsContext = React.createContext();

export function OptionsProvider(props) {
  const [optionsState, setOptionsState] = useState();

  useEffect(() => {
    getOptions().then(setOptionsState);
  }, []);

  const setOptionsGlobal = (data) => {
    const options = {...optionsState, ...data};
    setOptions(options).then(setOptionsState);
  };

  return <OptionsContext.Provider value={[optionsState, setOptionsGlobal]} {...props} />;
}

export const OptionsConsumer = OptionsContext.Consumer;

function useOptions() {
  return useContext(OptionsContext);
}

export default useOptions;
