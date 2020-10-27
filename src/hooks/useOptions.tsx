import React, { useContext, useEffect, useState } from 'react'

import { getOptions } from '../shared/options/getOptions'
import { onOptionsChanged } from '../shared/options/onOptionsChanged'
import { setOptions } from '../shared/options/setOptions'

const OptionsContext = React.createContext({})

export const OptionsProvider = (props) => {
  const [optionsState, setOptionsState] = useState<any>()

  useEffect(() => {
    const opts = getOptions()
    setOptionsState(opts)
  }, [])

  useEffect(() => {
    return onOptionsChanged(() => setOptionsState(getOptions()))
  }, [optionsState])

  return <OptionsContext.Provider value={[optionsState, setOptions]} {...props} />
}

export const OptionsConsumer = OptionsContext.Consumer

export const useOptions = () => {
  return useContext(OptionsContext)
}
