import React, { useState, useEffect, useRef } from 'react';
import { Settings as SettingsIcon, Image as ImageIcon, MessageCircle, Home, Book } from 'lucide-react';
import PersonaList from './components/PersonaList';
import ChatInterface from './components/ChatInterface';
import Settings from './components/Settings';
import Gallery from './components/Gallery';
import { personas as defaultPersonas } from './data/personas';

let hasPushedHistory = false;

function App() {
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [customPersonas, setCustomPersonas] = useState([]);
  const [panicMode, setPanicMode] = useState(false);
  const [activeServerUrl, setActiveServerUrl] = useState('');
  const [savedServers, setSavedServers] = useState([]);

  // Universal View State Management
  const [activeView, setActiveView] = useState(() => localStorage.getItem('activeView') || 'home');
  const [lastPersonaId, setLastPersonaId] = useState(() => localStorage.getItem('lastPersonaId') || null);

  useEffect(() => {
    const stored = localStorage.getItem('customPersonas');
    let loadedPersonas = [...defaultPersonas];
    if (stored) {
      const parsed = JSON.parse(stored);
      setCustomPersonas(parsed);
      loadedPersonas = [...loadedPersonas, ...parsed];
    }

    // Load server info
    const servers = JSON.parse(localStorage.getItem('savedServers') || '[]');
    setSavedServers(servers);
    setActiveServerUrl(localStorage.getItem('lmStudioUrl') || '');

    // Restore exact view state
    const savedView = localStorage.getItem('activeView') || 'home';
    if (!window.history.state) {
      window.history.replaceState({ view: savedView }, '');
    }

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
    if (typeof DeviceMotionEvent !== 'undefined') {
      window.addEventListener('devicemotion', handleMotion);
    }

    // Removed old hash wiping logic

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
      if (typeof DeviceMotionEvent !== 'undefined') {
        window.removeEventListener('devicemotion', handleMotion);
      }
    };
  }, []);

  const handleSelectPersona = (persona) => {
    window.history.pushState({ view: 'chat' }, '');
    hasPushedHistory = true;
    setSelectedPersona(persona);
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

    if (hasPushedHistory || window.history.state?.view !== 'home') {
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
  };

  const handleSwitchServer = (url) => {
    setActiveServerUrl(url);
    localStorage.setItem('lmStudioUrl', url);
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
    <div className="app-container">
      {!selectedPersona && !isSettingsOpen && !isGalleryOpen && (
        <header className="header fade-in">
          <div
            className="header-title"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
          >
            <span role="img" aria-label="sparkles">✨</span>
            Aura Roleplay
          </div>
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
          allPersonas={[...defaultPersonas, ...customPersonas]}
          onBack={handleBack}
          onGoHome={handleGoHome}
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
          customPersonas={customPersonas}
        />
      ) : (
        <PersonaList onSelectPersona={handleSelectPersona} customPersonas={customPersonas} />
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
  );
}

export default App;
