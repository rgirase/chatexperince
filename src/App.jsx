import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Settings as SettingsIcon, Server, Shield, Smartphone, Zap, Image as ImageIcon, Sparkles, Heart } from 'lucide-react';
import { updateAura } from './services/reputation';
import PersonaList from './components/PersonaList';
import ChatInterface from './components/ChatInterface';
import Settings from './components/Settings';
import Gallery from './components/Gallery';
import GenesisWizard from './components/GenesisWizard';
import { personas as defaultPersonas } from './data/personas';
import { personal_gf } from './data/characters/personal_gf';
import StreakBonus from './components/sub/StreakBonus';
import * as db from './services/db';

let hasPushedHistory = false;

function App() {
  console.log("[App] Start rendering...");
  
  // Hyper-safe state initialization
  const [selectedPersona, setSelectedPersona] = React.useState(null);
  const [selectedScenario, setSelectedScenario] = React.useState(null);
  const [customPersonas, setCustomPersonas] = React.useState([]);
  const [panicMode, setPanicMode] = React.useState(false);
  const [activeServerUrl, setActiveServerUrl] = React.useState('');
  const [savedServers, setSavedServers] = React.useState([]);
  const [imageUpdateKey, setImageUpdateKey] = React.useState(0);
  
  // Streak State
  const [streak, setStreak] = useState(0);
  const [lastLoginDate, setLastLoginDate] = useState('');

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
    const loadAllData = async () => {
      let loadedPersonas = [...defaultPersonas];
      
      // 1. Load Custom Personas (Migration + Fetch)
      try {
        let custom = await db.getItem('settings', 'customPersonas');
        if (!custom) {
          const stored = localStorage.getItem('customPersonas');
          if (stored) {
            custom = JSON.parse(stored);
            await db.setItem('settings', 'customPersonas', custom);
            console.log("[Storage] Migrated customPersonas to IndexedDB.");
          }
        }
        if (custom && Array.isArray(custom)) {
          setCustomPersonas(custom);
          loadedPersonas = [...loadedPersonas, ...custom];
        }
      } catch (e) {
        console.error('[App] Failed to load customPersonas', e);
      }

      // 2. Load Image Overrides (Migration + Fetch)
      const finalPersonas = [];
      for (const p of loadedPersonas) {
        let savedImg = await db.getItem('settings', `persona_img_${p.id}`);
        if (!savedImg) {
          const localImg = localStorage.getItem(`persona_img_${p.id}`);
          if (localImg) {
            savedImg = localImg;
            await db.setItem('settings', `persona_img_${p.id}`, savedImg);
          }
        }
        
        const isValid = savedImg && savedImg.length > 10 &&
          (savedImg.startsWith('data:image/') || savedImg.startsWith('http'));
        
        finalPersonas.push(isValid ? { ...p, image: savedImg } : p);
      }

      // 3. Load View State
      const savedView = localStorage.getItem('activeView') || 'home';
      setActiveView(savedView);
      
      if (savedView === 'chat') {
        const targetId = localStorage.getItem('lastPersonaId');
        if (targetId) {
          const found = finalPersonas.find(p => p.id === targetId);
          if (found) setSelectedPersona(found);
          else setActiveView('home');
        }
      } else if (savedView === 'gf') {
        // Handled by activeView state
      } else if (savedView === 'settings') {
        // Handled by activeView state
      } else if (savedView === 'gallery') {
        // Handled by activeView state
      } else if (savedView === 'genesis') {
        // Handled by activeView state
      }

      // Load server info (keep in localStorage as it's small)
      let servers = [];
      try {
        const storedServers = localStorage.getItem('savedServers');
        servers = storedServers ? JSON.parse(storedServers) : [];
        if (!Array.isArray(servers)) servers = [];
        const presets = [
          { id: 'mac', name: 'Mac', url: 'http://192.168.1.233:1234/v1' },
          { id: 'tailscale', name: 'Tailscale PC', url: 'http://100.87.53.100:1234/v1' },
          { id: 'pc', name: 'PC', url: 'http://169.254.83.107:1234/v1' }
        ];
        let modified = false;
        presets.forEach(preset => {
          if (!servers.find(s => s.url === preset.url)) {
            servers.push(preset);
            modified = true;
          }
        });
        if (modified) localStorage.setItem('savedServers', JSON.stringify(servers));
      } catch (e) {
        servers = [{ id: 'pc', name: 'PC', url: 'http://169.254.83.107:1234' }];
      }
      setSavedServers(servers);
      setActiveServerUrl(localStorage.getItem('lmStudioUrl') || '');

      // 4. Load & Update Streak
      try {
        const today = new Date().toDateString();
        const loginData = await db.getItem('logins', 'current_streak') || { count: 0, lastDate: '' };
        
        let newCount = loginData.count;
        let lastDate = loginData.lastDate;

        if (lastDate !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toDateString();

          if (lastDate === yesterdayStr) {
            newCount += 1;
          } else {
            newCount = 1;
          }
          
          await db.setItem('logins', 'current_streak', { count: newCount, lastDate: today });
          setLastLoginDate(lastDate); // Store previous date to check for "Claim"
        } else {
          setLastLoginDate(today);
        }
        setStreak(newCount);
      } catch (e) {
        console.error("[App] Failed to update streak", e);
      }
    };

    loadAllData();

    const handlePopState = (e) => {
      const stateView = e.state?.view || 'home';
      setActiveView(stateView);
      localStorage.setItem('activeView', stateView);
      
      if (stateView === 'home') {
        if (localStorage.getItem('activeView') === 'chat') {
          localStorage.setItem('lastPersonaTab', 'active');
        }
        setSelectedPersona(null);
        hasPushedHistory = false;
      } else if (stateView === 'chat') {
          // Keep current selected persona if possible
      } else {
        setSelectedPersona(null);
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
    const SHAKE_THRESHOLD = 20;
    const handleMotion = (e) => {
      if (e.accelerationIncludingGravity) {
        const { x, y, z } = e.accelerationIncludingGravity;
        if (x !== null && y !== null && z !== null) {
          const acceleration = Math.sqrt(x * x + y * y + z * z);
          if (acceleration > SHAKE_THRESHOLD) {
            const now = Date.now();
            if (now - lastShake > 1000) {
              setPanicMode(true);
              lastShake = now;
            }
          }
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);
    
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      console.log("DeviceMotion permission required");
    } else if (typeof DeviceMotionEvent !== 'undefined') {
      window.addEventListener('devicemotion', handleMotion);
    }

    const aura = updateAura();
    setUserAura(aura);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, []);

  const processedPersonas = React.useMemo(() => {
    return [...defaultPersonas, ...customPersonas];
  }, [customPersonas]);

  const handleSelectPersona = (persona, scenario = null) => {
    window.history.pushState({ view: 'chat' }, '');
    hasPushedHistory = true;
    
    setSelectedPersona(persona);
    setSelectedScenario(scenario);
    setActiveView('chat');
    localStorage.setItem('activeView', 'chat');
    localStorage.setItem('lastPersonaId', persona.id);
    setLastPersonaId(persona.id);
  };

  const handleOpenSettings = () => {
    console.log('[App] handleOpenSettings called');
    window.history.pushState({ view: 'settings' }, '');
    hasPushedHistory = true;
    setSelectedPersona(null);
    setActiveView('settings');
    localStorage.setItem('activeView', 'settings');
  };

  const handleOpenGallery = () => {
    console.log('[App] handleOpenGallery called');
    window.history.pushState({ view: 'gallery' }, '');
    hasPushedHistory = true;
    setSelectedPersona(null);
    setActiveView('gallery');
    localStorage.setItem('activeView', 'gallery');
  };

  const handleOpenGenesis = () => {
    console.log('[App] handleOpenGenesis called');
    window.history.pushState({ view: 'genesis' }, '');
    hasPushedHistory = true;
    setSelectedPersona(null);
    setActiveView('genesis');
    localStorage.setItem('activeView', 'genesis');
  };

  const handleOpenGF = () => {
    console.log('[App] handleOpenGF called');
    window.history.pushState({ view: 'gf' }, '');
    hasPushedHistory = true;
    setSelectedPersona(null);
    setActiveView('gf');
    localStorage.setItem('activeView', 'gf');
    localStorage.setItem('lastPersonaId', personal_gf.id);
  };

  const handlePersonaCreated = (newPersona) => {
    const updatedCustom = [newPersona, ...customPersonas];
    setCustomPersonas(updatedCustom);
    db.setItem('settings', 'customPersonas', updatedCustom);
    setSelectedPersona(newPersona);
    setActiveView('chat'); 
    localStorage.setItem('activeView', 'chat');
    localStorage.setItem('lastPersonaId', newPersona.id);
  };

  const handleBack = () => {
    if (activeView === 'chat') {
      localStorage.setItem('lastPersonaTab', 'active');
    }
    if (activeView === 'chat' && hasPushedHistory) {
      window.history.back();
      hasPushedHistory = false;
      setSelectedPersona(null);
      setSelectedScenario(null);
    } else {
      handleGoHome();
    }
  };

  const handleGoHome = () => {
    window.history.replaceState({ view: 'home' }, '');
    setSelectedPersona(null);
    setSelectedScenario(null);
    setActiveView('home');
    localStorage.setItem('activeView', 'home');
    hasPushedHistory = false;
    setUserAura(updateAura());
  };

  const handleClaimStreak = async () => {
    const today = new Date().toDateString();
    await db.setItem('logins', 'last_claimed_date', today);
    setLastLoginDate(today);
    
    // Add a reward to the rewards store
    const rewardId = `reward_${Date.now()}`;
    await db.setItem('rewards', rewardId, {
      type: 'gift',
      item: streak >= 7 ? 'Vintage Wine' : 'Box of Chocolates',
      date: today
    });
  };

  const handleSwitchServer = (url) => {
    setActiveServerUrl(url);
    localStorage.setItem('lmStudioUrl', url);
  };

  const handleSelectImage = (personaId, newImage) => {
    if (selectedPersona && selectedPersona.id === personaId) {
      setSelectedPersona({ ...selectedPersona, image: newImage });
    }
    setCustomPersonas(prev => prev.map(p => p.id === personaId ? { ...p, image: newImage } : p));
    db.setItem('settings', `persona_img_${personaId}`, newImage);
    setImageUpdateKey(prev => prev + 1);
  };

  useEffect(() => {
    if (activeView !== 'settings') {
      try {
        const servers = JSON.parse(localStorage.getItem('savedServers') || '[]');
        setSavedServers(Array.isArray(servers) ? servers : []);
        setActiveServerUrl(localStorage.getItem('lmStudioUrl') || '');
      } catch (e) {
        console.error('[App] Failed to re-sync servers', e);
      }
    }
  }, [activeView]);

  const longPressTimerRef = useRef(null);
  const handleTouchStart = () => {
    longPressTimerRef.current = setTimeout(() => {
      setPanicMode(true);
    }, 1500); 
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

        {!selectedPersona && activeView === 'home' && (
          <header className="header fade-in">
            <div
              className="header-title premium-gradient-text"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              style={{ userSelect: 'none', WebkitUserSelect: 'none', fontSize: '1.6rem' }}
            >
              Aura Roleplay
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
            scenario={selectedScenario}
            allPersonas={processedPersonas}
            onBack={handleBack}
            onGoHome={handleGoHome}
            onSelectImage={handleSelectImage}
          />
        ) : activeView === 'gf' ? (
          <ChatInterface
            key={personal_gf.id}
            persona={personal_gf}
            allPersonas={processedPersonas}
            onBack={handleBack}
            onGoHome={handleGoHome}
            onSelectImage={handleSelectImage}
          />
        ) : activeView === 'settings' ? (
          <Settings
            onBack={handleBack}
            onGoHome={handleGoHome}
            customPersonas={customPersonas}
            setCustomPersonas={setCustomPersonas}
            savedServers={savedServers}
            activeServerUrl={activeServerUrl}
            onSwitchServer={handleSwitchServer}
          />
        ) : activeView === 'gallery' ? (
          <Gallery
            onBack={handleBack}
            allPersonas={processedPersonas}
            onSelectImage={handleSelectImage}
          />
        ) : activeView === 'genesis' ? (
          <GenesisWizard 
            onPersonaCreated={handlePersonaCreated}
            onGoHome={handleGoHome}
          />
        ) : (
          <PersonaList 
            onSelectPersona={handleSelectPersona} 
            customPersonas={customPersonas}
            allPersonas={processedPersonas}
          />
        )}

        {/* STREAK BONUS NOTIFICATION */}
        {activeView === 'home' && streak > 0 && (
          <StreakBonus 
            streak={streak}
            lastRewardDate={lastLoginDate}
            onClaim={handleClaimStreak}
          />
        )}

        <nav className="bottom-nav-v2 glass-panel" style={{ 
          borderBottom: 'none', 
          borderLeft: 'none', 
          borderRight: 'none', 
          borderRadius: '24px 24px 0 0',
          paddingBottom: 'env(safe-area-inset-bottom)',
          zIndex: 999999 // Ultra-high z-index to stay above everything
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
            className={`nav-item ${activeView === 'genesis' ? 'active' : ''}`}
            onClick={handleOpenGenesis}
          >
            <Sparkles size={22} color={activeView === 'genesis' ? '#a855f7' : '#71717a'} />
            <span style={{ color: activeView === 'genesis' ? '#fff' : '#71717a' }}>Genesis</span>
          </button>
          
          <button 
            className={`nav-item ${activeView === 'gf' ? 'active' : ''}`}
            onClick={handleOpenGF}
          >
            <Heart size={22} color={activeView === 'gf' ? '#ec4899' : '#71717a'} fill={activeView === 'gf' ? '#ec4899' : 'none'} />
            <span style={{ color: activeView === 'gf' ? '#fff' : '#71717a' }}>GF</span>
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
