import React from 'react';
import ReactDOM from 'react-dom';
import App from 'src/popup/App';
import { OptionsProvider } from 'src/popup/hooks/useOptions';
import 'src/popup/styles/tailwind.generated.css';

ReactDOM.render(
  <React.StrictMode>
    <OptionsProvider>
      <App />
    </OptionsProvider>
  </React.StrictMode>,
  document.getElementById('root'),
);
