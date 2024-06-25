import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './index.scss';
import App from './App';
import './translation/i18n'
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
reportWebVitals();
