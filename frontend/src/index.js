import React from 'react';
import ReactDOM from 'react-dom';
import App from './App/App';
import { OptionsProvider } from './hooks/useOptions';
import './styles/tailwind.generated.css';

ReactDOM.render(
    <React.StrictMode>
        <OptionsProvider>
            <App />
        </OptionsProvider>
    </React.StrictMode>,
    document.getElementById('root'),
);
