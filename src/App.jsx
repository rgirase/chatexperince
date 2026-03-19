import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Settings as SettingsIcon, Server, Shield, Smartphone, Zap, Image as ImageIcon } from 'lucide-react';
import { updateAura } from './services/reputation';
import PersonaList from './components/PersonaList';
import ChatInterface from './components/ChatInterface';
import Settings from './components/Settings';
import Gallery from './components/Gallery';
import { personas as defaultPersonas } from './data/personas';

let hasPushedHistory = false;

function App() {
  console.log("[App] Start rendering...");
  
  // Hyper-safe state initialization
  const [selectedPersona, setSelectedPersona] = React.useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = React.useState(false);
  const [customPersonas, setCustomPersonas] = React.useState([]);
  const [panicMode, setPanicMode] = React.useState(false);
  const [activeServerUrl, setActiveServerUrl] = React.useState('');
  const [savedServers, setSavedServers] = React.useState([]);
  const [imageUpdateKey, setImageUpdateKey] = React.useState(0);

  const [userAura, setUserAura] = React.useState(() => {
    try {
      const saved = window.localStorage ? localStorage.getItem('userAura') : null;
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("[App] Failed to parse userAura", e);
      return null;
    }
  });

  // Universal View State Management
  const [activeView, setActiveView] = React.useState(() => {
    try {
      return window.localStorage ? (localStorage.getItem('activeView') || 'home') : 'home';
    } catch (e) {
      return 'home';
    }
  });
  
  const [lastPersonaId, setLastPersonaId] = React.useState(() => {
    try {
      return window.localStorage ? (localStorage.getItem('lastPersonaId') || null) : null;
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
      const storedServers = localStorage.getItem('savedServers');
      servers = storedServers ? JSON.parse(storedServers) : [];
      if (!Array.isArray(servers)) servers = [];
      
      // Inject presets if they don't exist
      const presets = [
        { id: 'mac', name: 'Mac', url: 'http://192.168.1.233:1234' },
        { id: 'tailscale', name: 'Tailscale PC', url: 'http://100.87.53.100:1234' },
        { id: 'pc', name: 'PC', url: 'http://169.254.83.107:1234' }
      ];
      
      let modified = false;
      presets.forEach(preset => {
        if (!servers.find(s => s.url === preset.url)) {
          servers.push(preset);
          modified = true;
        }
      });
      
      if (modified) {
        localStorage.setItem('savedServers', JSON.stringify(servers));
      }
    } catch (e) {
      console.error('[App] Failed to parse savedServers, clearing.', e);
      localStorage.removeItem('savedServers');
      // Fallback to presets
      servers = [
        { id: 'mac', name: 'Mac', url: 'http://192.168.1.233:1234' },
        { id: 'tailscale', name: 'Tailscale PC', url: 'http://100.87.53.100:1234' },
        { id: 'pc', name: 'PC', url: 'http://169.254.83.107:1234' }
      ];
      localStorage.setItem('savedServers', JSON.stringify(servers));
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
    setIsSettingsOpen(false);
    setIsGalleryOpen(false);
    
    setActiveView('chat');
    localStorage.setItem('activeView', 'chat');
    localStorage.setItem('lastPersonaId', persona.id);
    setLastPersonaId(persona.id);
  };

  const handleOpenSettings = () => {
    window.history.pushState({ view: 'settings' }, '');
    hasPushedHistory = true;
    setSelectedPersona(null);
    setIsGalleryOpen(false);
    setIsSettingsOpen(true);
    setActiveView('settings');
    localStorage.setItem('activeView', 'settings');
  };

  const handleOpenGallery = () => {
    window.history.pushState({ view: 'gallery' }, '');
    hasPushedHistory = true;
    setSelectedPersona(null);
    setIsSettingsOpen(false);
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
      try {
        const servers = JSON.parse(localStorage.getItem('savedServers') || '[]');
        setSavedServers(Array.isArray(servers) ? servers : []);
        setActiveServerUrl(localStorage.getItem('lmStudioUrl') || '');
      } catch (e) {
        console.error('[App] Failed to re-sync servers', e);
      }
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
    <div className="app-container">
        {/* Dynamic Immersive Background */}
        <AnimatePresence>
          {selectedPersona && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.15 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                inset: 0,
                backgroundImage: `url(${selectedPersona.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(60px) brightness(0.5)',
                zIndex: -1,
                pointerEvents: 'none'
              }}
            />
          )}
        </AnimatePresence>
        {/* ... existing content ... */}
        {!selectedPersona && !isSettingsOpen && !isGalleryOpen && (
          <header className="header fade-in">
            {/* ... */}
            <div
              className="header-title premium-gradient-text"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              style={{ userSelect: 'none', WebkitUserSelect: 'none', fontSize: '1.6rem' }}
            >
              Aura Roleplay
            </div>


            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {/* Server Quick Switcher */}
              {savedServers.length > 0 && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  background: 'rgba(255,255,255,0.03)', 
                  borderRadius: '12px', 
                  padding: '4px 10px', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  marginRight: '4px',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#a855f7', marginRight: '8px', boxShadow: '0 0 8px #a855f7' }}></div>
                  <select 
                    value={activeServerUrl} 
                    onChange={(e) => handleSwitchServer(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: '#a1a1aa', fontSize: '0.75rem', outline: 'none', cursor: 'pointer', fontWeight: '500' }}
                  >
                    <option value="" disabled>Server</option>
                    {savedServers.map(s => (
                      <option key={s.id} value={s.url}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

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
            key={selectedPersona.id}
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
            savedServers={savedServers}
            activeServerUrl={activeServerUrl}
            onSwitchServer={handleSwitchServer}
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
        <nav className="bottom-nav glass-panel" style={{ 
          borderBottom: 'none', 
          borderLeft: 'none', 
          borderRight: 'none', 
          borderRadius: '24px 24px 0 0',
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}>
          <button 
            className={`nav-item ${activeView === 'home' ? 'active' : ''}`}
            onClick={handleGoHome}
          >
            <Home size={22} color={activeView === 'home' ? '#a855f7' : '#71717a'} />
            <span style={{ color: activeView === 'home' ? '#fff' : '#71717a' }}>Home</span>
          </button>
          <button 
            className={`nav-item ${activeView === 'gallery' ? 'active' : ''}`}
            onClick={handleOpenGallery}
          >
            <ImageIcon size={22} color={activeView === 'gallery' ? '#a855f7' : '#71717a'} />
            <span style={{ color: activeView === 'gallery' ? '#fff' : '#71717a' }}>Gallery</span>
          </button>
          <button 
            className={`nav-item ${activeView === 'settings' ? 'active' : ''}`}
            onClick={handleOpenSettings}
          >
            <SettingsIcon size={22} color={activeView === 'settings' ? '#a855f7' : '#71717a'} />
            <span style={{ color: activeView === 'settings' ? '#fff' : '#71717a' }}>Settings</span>
          </button>
        </nav>
      </div>
  );
}

export default App;
