import React, { useState, useEffect, useRef } from 'react';
import { Settings as SettingsIcon, Image as ImageIcon, MessageCircle, Home, Book, Sparkles } from 'lucide-react';
import { updateAura } from './services/reputation';
import PersonaList from './components/PersonaList';
import ChatInterface from './components/ChatInterface';
import Settings from './components/Settings';
import Gallery from './components/Gallery';
import { personas as defaultPersonas } from './data/personas';

const safeReset = () => {
  if (confirm('This will clear corrupted data to fix the blank screen. Your chats are safe. Proceed?')) {
    // Clear all settings keys but preserve chat histories
    const keysToPreserve = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('chat_')) keysToPreserve.push([key, localStorage.getItem(key)]);
    }
    localStorage.clear();
    keysToPreserve.forEach(([k, v]) => localStorage.setItem(k, v));
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
    }
    caches.keys().then(names => Promise.all(names.map(n => caches.delete(n))));
    window.location.reload();
  }
};

// A true React class-based ErrorBoundary — the ONLY way to catch React render errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      const errMsg = this.state.error?.message || 'Unknown error';
      return (
        <div style={{ padding: '2rem', color: 'white', background: '#09090b', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <h2 style={{ color: '#ef4444' }}>Something went wrong</h2>
          <p style={{ fontSize: '0.9rem', color: '#a1a1aa' }}>A rendering error occurred. Tap the button below to fix it.</p>
          <div style={{ padding: '1rem', background: 'rgba(255,0,0,0.1)', borderRadius: '8px', border: '1px solid rgba(255,0,0,0.2)', maxWidth: '90%', overflow: 'auto' }}>
            <code style={{ fontSize: '0.7rem', color: '#ef4444' }}>{errMsg}</code>
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

let hasPushedHistory = false;

function App() {
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [customPersonas, setCustomPersonas] = useState([]);
  const [panicMode, setPanicMode] = useState(false);
  const [activeServerUrl, setActiveServerUrl] = useState('');
  const [savedServers, setSavedServers] = useState([]);
  const [imageUpdateKey, setImageUpdateKey] = useState(0);
  const [userAura, setUserAura] = useState(() => {
    try {
      const saved = localStorage.getItem('userAura');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Failed to parse userAura", e);
      return null;
    }
  });

  // Universal View State Management
  const [activeView, setActiveView] = useState(() => {
    try {
      return localStorage.getItem('activeView') || 'home';
    } catch (e) {
      return 'home';
    }
  });
  
  const [lastPersonaId, setLastPersonaId] = useState(() => {
    try {
      return localStorage.getItem('lastPersonaId') || null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    let loadedPersonas = [...defaultPersonas];
    try {
      const stored = localStorage.getItem('customPersonas');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setCustomPersonas(parsed);
          loadedPersonas = [...loadedPersonas, ...parsed];
        }
      }
    } catch (e) {
      console.error('[App] Failed to parse customPersonas from localStorage, clearing.', e);
      localStorage.removeItem('customPersonas');
    }

    // Apply image overrides from localStorage
    loadedPersonas = loadedPersonas.map(p => {
      try {
        const savedImg = localStorage.getItem(`persona_img_${p.id}`);
        if (savedImg) return { ...p, image: savedImg };
      } catch (e) { /* ignore */ }
      return p;
    });

    // Load server info
    let servers = [];
    try {
      servers = JSON.parse(localStorage.getItem('savedServers') || '[]');
      if (!Array.isArray(servers)) servers = [];
    } catch (e) {
      console.error('[App] Failed to parse savedServers, clearing.', e);
      localStorage.removeItem('savedServers');
    }
    setSavedServers(servers);
    setActiveServerUrl(localStorage.getItem('lmStudioUrl') || '');

    // Always ensure a 'home' entry exists at the base of the history stack.
    // This prevents history.back() from ever navigating out of the app.
    const savedView = localStorage.getItem('activeView') || 'home';
    window.history.replaceState({ view: 'home' }, '');

    if (savedView === 'settings') {
      setIsSettingsOpen(true);
    } else if (savedView === 'gallery') {
      setIsGalleryOpen(true);
    } else if (savedView === 'chat') {
      const targetId = localStorage.getItem('lastPersonaId');
      if (targetId) {
        const found = loadedPersonas.find(p => p.id === targetId);
        if (found) {
          setSelectedPersona(found);
        } else {
          // Failsafe if persona deleted
          setActiveView('home');
          localStorage.setItem('activeView', 'home');
        }
      }
    }

    const handlePopState = (e) => {
      const stateView = e.state?.view || 'home';
      // Handle all possible pop states
      if (stateView === 'home') {
        if (localStorage.getItem('activeView') === 'chat') {
          localStorage.setItem('lastPersonaTab', 'active');
        }
        setSelectedPersona(null);
        setIsSettingsOpen(false);
        setIsGalleryOpen(false);
        setActiveView('home');
        localStorage.setItem('activeView', 'home');
        hasPushedHistory = false;
      } else if (stateView === 'settings') {
        // If somehow we pop back to settings state, just go home safely
        setIsSettingsOpen(false);
        setIsGalleryOpen(false);
        setSelectedPersona(null);
        setActiveView('home');
        localStorage.setItem('activeView', 'home');
        hasPushedHistory = false;
      } else {
        // Unknown state: go home as a fallback
        setIsSettingsOpen(false);
        setIsGalleryOpen(false);
        setSelectedPersona(null);
        setActiveView('home');
        localStorage.setItem('activeView', 'home');
        hasPushedHistory = false;
      }
    };

    let lastEscape = 0;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        const now = Date.now();
        if (now - lastEscape < 500) {
          setPanicMode(true);
        }
        lastEscape = now;
      }
    };

    let lastShake = 0;
    const SHAKE_THRESHOLD = 20; // m/s^2
    const handleMotion = (e) => {
      if (e.accelerationIncludingGravity) {
        const { x, y, z } = e.accelerationIncludingGravity;
        if (x !== null && y !== null && z !== null) {
          const acceleration = Math.sqrt(x * x + y * y + z * z);
          // Earth gravity is ~9.8. Anything over 20 implies a strong shake.
          if (acceleration > SHAKE_THRESHOLD) {
            const now = Date.now();
            if (now - lastShake > 1000) { // Debounce 1 second
              setPanicMode(true);
              lastShake = now;
            }
          }
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);
    
    // Enable Device Motion with safety check for mobile stability
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      // iOS 13+ requires explicit permission
      console.log("DeviceMotion permission required");
    } else if (typeof DeviceMotionEvent !== 'undefined') {
      window.addEventListener('devicemotion', handleMotion);
    }

    // Restore exact view state
    const aura = updateAura();
    setUserAura(aura);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, []);

  const getProcessedPersonas = () => {
    let loadedPersonas = [...defaultPersonas, ...customPersonas];
    return loadedPersonas.map(p => {
      const savedImg = localStorage.getItem(`persona_img_${p.id}`);
      if (savedImg) {
        return { ...p, image: savedImg };
      }
      return p;
    });
  };

  const handleSelectPersona = (persona) => {
    window.history.pushState({ view: 'chat' }, '');
    hasPushedHistory = true;
    
    // Use the latest version with overrides
    const processed = getProcessedPersonas().find(p => p.id === persona.id) || persona;
    setSelectedPersona(processed);
    
    setActiveView('chat');
    localStorage.setItem('activeView', 'chat');
    localStorage.setItem('lastPersonaId', persona.id);
    setLastPersonaId(persona.id);
  };

  const handleOpenSettings = () => {
    window.history.pushState({ view: 'settings' }, '');
    hasPushedHistory = true;
    setIsSettingsOpen(true);
    setActiveView('settings');
    localStorage.setItem('activeView', 'settings');
  };

  const handleOpenGallery = () => {
    window.history.pushState({ view: 'gallery' }, '');
    hasPushedHistory = true;
    setIsGalleryOpen(true);
    setActiveView('gallery');
    localStorage.setItem('activeView', 'gallery');
  };

  const handleBack = () => {
    if (activeView === 'chat') {
      localStorage.setItem('lastPersonaTab', 'active');
    }
    // For settings and gallery: always go directly home to avoid history stack issues
    // For chat: use browser history so swipe-back works
    if (activeView === 'chat' && hasPushedHistory) {
      window.history.back();
      hasPushedHistory = false;
    } else {
      handleGoHome();
    }
  };

  const handleGoHome = () => {
    window.history.replaceState({ view: 'home' }, '');
    setSelectedPersona(null);
    setIsSettingsOpen(false);
    setIsGalleryOpen(false);
    setActiveView('home');
    localStorage.setItem('activeView', 'home');
    hasPushedHistory = false;
    
    // Refresh Aura when returning home
    setUserAura(updateAura());
  };

  const handleSwitchServer = (url) => {
    setActiveServerUrl(url);
    localStorage.setItem('lmStudioUrl', url);
  };

  const handleSelectImage = (personaId, newImage) => {
    // Update both default and custom personas in state
    const updatePersonaList = (list) => 
      list.map(p => p.id === personaId ? { ...p, image: newImage } : p);

    // We also need to update the currently selected persona if it matches
    if (selectedPersona && selectedPersona.id === personaId) {
      setSelectedPersona({ ...selectedPersona, image: newImage });
    }

    // Re-trigger the persona loading logic by updating state
    setCustomPersonas(prev => updatePersonaList(prev));
    setImageUpdateKey(prev => prev + 1);
  };

  // Re-sync server list when entering/leaving settings or on refresh
  useEffect(() => {
    if (!isSettingsOpen) {
      const servers = JSON.parse(localStorage.getItem('savedServers') || '[]');
      setSavedServers(servers);
      setActiveServerUrl(localStorage.getItem('lmStudioUrl') || '');
    }
  }, [isSettingsOpen]);

  const longPressTimerRef = useRef(null);
  const handleTouchStart = () => {
    longPressTimerRef.current = setTimeout(() => {
      setPanicMode(true);
    }, 1500); // 1.5 second long press
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  };

  if (panicMode) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'white', zIndex: 9999 }}>
        <iframe src="https://en.wikipedia.org/wiki/Financial_modeling" style={{ width: '100%', height: '100%', border: 'none' }} title="Emergency Screen" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="app-container">
        {/* ... existing content ... */}
        {!selectedPersona && !isSettingsOpen && !isGalleryOpen && (
          <header className="header fade-in">
            {/* ... */}
            <div
              className="header-title"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
            >
              <span role="img" aria-label="sparkles">✨</span>
              Aura Roleplay
            </div>

            {/* User Aura Display */}
            {userAura && userAura.color && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: `rgba(${parseInt(userAura.color.slice(1,3), 16) || 0}, ${parseInt(userAura.color.slice(3,5), 16) || 0}, ${parseInt(userAura.color.slice(5,7), 16) || 0}, 0.1)`,
                  border: `1px solid ${userAura.color}44`,
                  padding: '4px 12px',
                  borderRadius: '20px',
                  marginLeft: '1rem',
                  cursor: 'help'
                }}
                title={`Your current Aura: ${userAura.name || 'Neutral'}. Based on your communication style across all characters.`}
              >
                <Sparkles size={14} color={userAura.color} />
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: userAura.color }}>{userAura.name || 'Neutral'}</span>
              </motion.div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {/* Server Quick Switcher */}
              {savedServers.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', padding: '2px 8px', border: '1px solid #3f3f46', marginRight: '4px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#c084fc', marginRight: '6px' }}></div>
                  <select 
                    value={activeServerUrl} 
                    onChange={(e) => handleSwitchServer(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: '#d4d4d8', fontSize: '0.75rem', outline: 'none', cursor: 'pointer', maxWidth: '100px' }}
                  >
                    <option value="" disabled>Select Server</option>
                    {savedServers.map(s => (
                      <option key={s.id} value={s.url}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={handleOpenGallery}
                style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: '0.5rem' }}
                title="Progression Gallery"
              >
                <ImageIcon size={24} />
              </button>
              <button
                onClick={handleOpenSettings}
                style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: '0.5rem' }}
                title="Settings"
              >
                <SettingsIcon size={24} />
              </button>
            </div>
          </header>
        )}

        {selectedPersona ? (
          <ChatInterface
            persona={selectedPersona}
            allPersonas={getProcessedPersonas()}
            onBack={handleBack}
            onGoHome={handleGoHome}
            onSelectImage={handleSelectImage}
          />
        ) : isSettingsOpen ? (
          <Settings
            onBack={handleBack}
            onGoHome={handleGoHome}
            customPersonas={customPersonas}
            setCustomPersonas={setCustomPersonas}
          />
        ) : isGalleryOpen ? (
          <Gallery
            onBack={handleBack}
            allPersonas={getProcessedPersonas()}
            onSelectImage={handleSelectImage}
          />
        ) : (
          <PersonaList 
            onSelectPersona={handleSelectPersona} 
            customPersonas={customPersonas}
            allPersonas={getProcessedPersonas()}
          />
        )}

        {/* Mobile Bottom Navigation */}
        <nav className="bottom-nav">
          <button 
            className={`nav-item ${activeView === 'home' ? 'active' : ''}`}
            onClick={handleGoHome}
          >
            <Home size={24} />
            <span>Home</span>
          </button>
          <button 
            className={`nav-item ${activeView === 'gallery' ? 'active' : ''}`}
            onClick={handleOpenGallery}
          >
            <ImageIcon size={24} />
            <span>Gallery</span>
          </button>
          <button 
            className={`nav-item ${activeView === 'settings' ? 'active' : ''}`}
            onClick={handleOpenSettings}
          >
            <SettingsIcon size={24} />
            <span>Settings</span>
          </button>
        </nav>
      </div>
    </ErrorBoundary>
  );
}

export default App;
