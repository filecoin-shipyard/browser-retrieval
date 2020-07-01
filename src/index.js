import React from 'react';
import ReactDOM from 'react-dom';
import App from 'src/App';
import { OptionsProvider } from 'src/hooks/useOptions';
import 'src/styles/tailwind.generated.css';

ReactDOM.render(
  <React.StrictMode>
    <OptionsProvider>
      <App />
    </OptionsProvider>
  </React.StrictMode>,
  document.getElementById('root'),
);
