import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ACOS_SYMBOL } from './acos-logo';
import './brand-tokens.css';
import './styles.css';
import './live.css';
import './marketing.css';
import './refine.css';
import './acos.css';
import './staff.css';
import './access-routes.css';
import './admin-parity.css';
import './insurance-operations.css';
import './pilot.css';
import './brand-identity.css';
import './brand-luminous.css';

const iconLink = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
if (iconLink) {
  iconLink.href = ACOS_SYMBOL;
  iconLink.type = 'image/png';
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
);
