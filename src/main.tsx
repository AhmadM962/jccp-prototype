import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import '@fontsource-variable/inter'; // self-hosted — no CDN dependency (on-premise)
import App from './App';
import './index.css';

// HashRouter (URLs like /#/dashboard) so the app works as static files on GitHub Pages —
// no server-side rewrite needed, and it does not depend on the repository name.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
);
