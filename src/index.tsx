import { configure } from 'mobx'
import React from 'react'
import ReactDOM from 'react-dom'

import { App } from './App'
import reportWebVitals from './reportWebVitals'
import { appStore } from './shared/store/appStore'

configure({ useProxies: 'ifavailable' })

window.onbeforeunload = (e) => {
  if (!appStore.dealsStore.hasOngoingDeals()) {
    return
  }

  e.returnValue = 'You have ongoing deals, if you leave they will stop. Are you sure?'

  return e.returnValue
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root'),
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
