import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './index.scss';
import App from './App';
import './translation/i18n'
import reportWebVitals from './reportWebVitals';
import { unstable_FeatureFlags as FeatureFlags } from '@carbon/ibm-products';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <FeatureFlags enableSidepanelResizer>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </FeatureFlags>
);
reportWebVitals();
