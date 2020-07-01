import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App';
import { OptionsProvider } from './hooks/useOptions';

ReactDOM.render(
  <React.StrictMode>
    <OptionsProvider>
      <App />
    </OptionsProvider>
  </React.StrictMode>,
  document.getElementById('root'),
);
