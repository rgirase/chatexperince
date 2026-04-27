import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Settings as SettingsIcon, Server, Shield, Smartphone, Zap, Image as ImageIcon, Sparkles, Heart, MessageCircle } from 'lucide-react';
import { updateAura } from './services/reputation';
import PersonaList from './components/PersonaList';
import ChatInterface from './components/ChatInterface';
import Settings from './components/Settings';
import GenesisWizard from './components/GenesisWizard';
import { personas as defaultPersonas } from './data/personas';
import { lyra_storyteller } from './data/characters/lyra_storyteller';
import StreakBonus from './components/sub/StreakBonus';
import * as db from './services/db';
import VaultModal from './components/sub/VaultModal';
import NeuralLink from './components/sub/NeuralLink';
import TheOracle from './components/sub/TheOracle';
import ProfileManager from './components/sub/ProfileManager'; // New import
import { auraLife } from './services/AutonomousService';

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
  const [isBooting, setIsBooting] = React.useState(true);
  const [isVaultOpen, setIsVaultOpen] = React.useState(false);
  const [nuxStep, setNuxStep] = React.useState(() => {
    try {
      const complete = localStorage.getItem('nux_signal_complete') === 'true';
      const step = localStorage.getItem('nux_step');
      if (step) return parseInt(step);
      return complete ? 2 : 0; // Migrate from old flag
    } catch (e) {
      return 0;
    }
  });
  
  // Streak State
  const [streak, setStreak] = useState(0);
  const [lastLoginDate, setLastLoginDate] = useState('');

  // Profile State
  const [profiles, setProfiles] = useState([]);
  const [activeProfileId, setActiveProfileId] = useState(db.getCurrentUserId());
  const [isProfileManagerOpen, setIsProfileManagerOpen] = useState(false);

  const [userAura, setUserAura] = React.useState(() => {
    try {
      const saved = window.localStorage ? localStorage.getItem('userAura') : null;
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("[App] Failed to parse userAura", e);
      return null;
    }
  });

  useEffect(() => {
    auraLife.boot();
  }, []);

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
      console.log(`[App] Initializing data for user ${activeProfileId} at ${new Date().toLocaleTimeString()}...`);
      const start = Date.now();
      
      // Safety timeout: Never stay in booting state longer than 2.5s
      const timeoutId = setTimeout(() => {
        if (isBooting) {
            console.warn("[App] loadAllData is taking too long. Forcing boot completion.");
            setIsBooting(false);
        }
      }, 2500);

      // 0. Load Profiles
      const currentProfiles = await db.getProfiles();
      setProfiles(currentProfiles);
      
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

      // 2. Load Image Overrides (Migration + Batch Fetch)
      const finalPersonas = [];
      const settingsMap = await db.getAllMapped('settings');
      
      for (const p of loadedPersonas) {
        const key = `persona_img_${p.id}`;
        let savedImg = settingsMap[key];
        
        if (!savedImg) {
          const localImg = localStorage.getItem(key);
          if (localImg) {
            savedImg = localImg;
            await db.setItem('settings', key, savedImg);
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

        // NUX Check for Signal Bridge
        if (nuxStep < 1 && localStorage.getItem('nux_signal_complete') !== 'true' && localStorage.getItem('nux_step') === null) {
        setNuxStep(0);
      }
      } catch (e) {
        console.error("[App] Failed to update streak", e);
      } finally {
        clearTimeout(timeoutId);
        setIsBooting(false);
        console.log(`[App] Data loaded in ${Date.now() - start}ms`);
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
      }
    };

    let lastEscape = 0;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        const now = Date.now();
        if (now - lastEscape < 500) setPanicMode(true);
        lastEscape = now;
      }
    };

    let lastShake = 0;
    const handleMotion = (e) => {
      try {
        if (e.accelerationIncludingGravity) {
          const { x, y, z } = e.accelerationIncludingGravity;
          if (x !== null && y !== null && z !== null) {
            const acceleration = Math.sqrt(x * x + y * y + z * z);
            if (acceleration > 20) { // SHAKE_THRESHOLD
              const now = Date.now();
              if (now - lastShake > 1000) {
                setPanicMode(true);
                lastShake = now;
              }
            }
          }
        }
      } catch (err) {}
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);
    
    try {
      if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        // iOS requires user gesture for this, so we just log and wait
      } else if (typeof DeviceMotionEvent !== 'undefined') {
        window.addEventListener('devicemotion', handleMotion);
      }
    } catch (e) {}

    const aura = updateAura();
    setUserAura(aura);
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const start = Date.now();
        // Delay heavy background work to ensure UI responsiveness on resume
        setTimeout(() => {
           console.log(`[App] Syncing aura in background...`);
           setUserAura(updateAura());
        }, 1500); 
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [activeProfileId]); // Reload when profile changes

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
    localStorage.setItem('lastPersonaId', lyra_storyteller.id);
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
