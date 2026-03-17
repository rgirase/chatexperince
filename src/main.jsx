import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

console.log("%c [Aura] main.jsx v4 Loading...", "color: #8b5cf6; font-weight: bold;");

const safeReset = () => {
  if (confirm('This will clear corrupted data to fix the blank screen. Your chats are safe. Proceed?')) {
    // Clear all settings keys but preserve chat histories
    const keysToPreserve = [];
    for (let i = 0; i < localStorage.length; i++) {
        try {
            const key = localStorage.key(i);
            if (key && key.startsWith('chat_')) keysToPreserve.push([key, localStorage.getItem(key)]);
        } catch(e) {}
    }
    localStorage.clear();
    keysToPreserve.forEach(([k, v]) => localStorage.setItem(k, v));
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
    }
    try {
      if (typeof window !== 'undefined' && window.caches && typeof caches !== 'undefined' && caches.keys) {
        caches.keys().then(names => {
          if (Array.isArray(names)) {
            Promise.all(names.map(n => caches.delete(n)));
          }
        }).catch(e => console.warn("[SafeReset] Cache clearing failed safely", e));
      }
    } catch (e) {
      console.warn("[SafeReset] Caches access failed", e);
    }
    window.location.reload();
  }
};

// A true React class-based ErrorBoundary — the ONLY way to catch React render errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught render error:', error, info);
    this.setState({ info });
  }

  render() {
    if (this.state.hasError) {
      const errMsg = this.state.error?.message || 'Unknown error';
      const stack = this.state.info?.componentStack || 'No stack trace available';
      return (
        <div style={{ padding: '2rem', color: 'white', background: '#09090b', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <h2 style={{ color: '#ef4444' }}>Something went wrong</h2>
          <p style={{ fontSize: '0.9rem', color: '#a1a1aa' }}>A rendering error occurred in the main app. Tap the button below to fix it.</p>
          <div style={{ padding: '1rem', background: 'rgba(255,0,0,0.1)', borderRadius: '8px', border: '1px solid rgba(255,0,0,0.2)', maxWidth: '90%', overflow: 'auto', textAlign: 'left' }}>
            <code style={{ fontSize: '0.7rem', color: '#ef4444' }}>{errMsg}</code>
            <pre style={{ fontSize: '0.6rem', color: '#71717a', marginTop: '1rem', whiteSpace: 'pre-wrap' }}>{stack}</pre>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button onClick={() => window.location.reload()} style={{ padding: '0.6rem 1.2rem', background: '#8b5cf6', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>Reload</button>
            <button onClick={safeReset} style={{ padding: '0.6rem 1.2rem', background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>Fix &amp; Reset</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
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
