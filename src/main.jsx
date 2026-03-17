import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
window.appIsMounted = true;

/**
 * Service Worker Strategy: Kill Switch Mode
 * 
 * We register sw.js once — but sw.js is a "kill switch" that immediately
 * clears all caches and then unregisters itself.
 * 
 * After run, no SW will be active, and the browser fetches fresh from network.
 * This permanently fixes stale-cache blank screens on mobile.
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('[App] Kill-switch SW registered, caches will be cleared.', reg);
      })
      .catch(err => console.log('[App] SW registration failed:', err));
  });
}
