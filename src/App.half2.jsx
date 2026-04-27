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

  const handleCreateProfile = async (newProfile) => {
    const updated = [...profiles, newProfile];
    setProfiles(updated);
    await db.saveProfiles(updated);
    handleSelectProfile(newProfile.id);
  };

  const handleUpdateProfile = async (updatedProfile) => {
    const updated = profiles.map(p => p.id === updatedProfile.id ? { ...p, ...updatedProfile } : p);
    setProfiles(updated);
    await db.saveProfiles(updated);
  };

  const handleSelectProfile = (id) => {
    db.setCurrentUserId(id);
    setActiveProfileId(id);
    setIsProfileManagerOpen(false);
    // State reset for fresh boot into new profile
    setSelectedPersona(null);
    setIsBooting(true);
    // useEffect [activeProfileId] will trigger loadAllData
  };

  const handleDeleteProfile = async (id) => {
    if (id === 'default') return;
    const updated = profiles.filter(p => p.id !== id);
    setProfiles(updated);
    await db.saveProfiles(updated);
    if (activeProfileId === id) {
      handleSelectProfile('default');
    }
  };

  const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0] || { name: 'User' };

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

  if (isBooting) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#09090b', color: '#a855f7' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
            <Zap size={32} />
        </motion.div>
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
          <VaultModal 
            isOpen={isVaultOpen} 
            onClose={() => setIsVaultOpen(false)} 
            allPersonas={[...defaultPersonas, ...customPersonas]} 
          />

          {nuxStep === 0 && (
            <NeuralLink 
              onComplete={() => {
                localStorage.setItem('nux_step', '1');
                setNuxStep(1);
              }} 
            />
          )}

          {nuxStep === 1 && (
            <TheOracle 
              onPick={(persona) => {
                localStorage.setItem('nux_step', '2');
                localStorage.setItem('nux_signal_complete', 'true');
                setNuxStep(2);
                setSelectedPersona(persona);
                setActiveView('chat');
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

              <div 
                className="sidebar-item" 
                onClick={() => setIsVaultOpen(true)}
                title="The Vault of Memories"
              >
                <Heart size={24} color="#ec4899" />
              </div>

              <div 
                className="sidebar-item" 
                onClick={() => setActiveView('settings')}
                title="Settings"
              >
                <SettingsIcon size={24} />
              </div>

              <div 
                className="sidebar-item" 
                onClick={() => setIsProfileManagerOpen(true)}
                style={{ position: 'relative', width: '36px', height: '36px', padding: 0, borderRadius: '50%', overflow: 'hidden', border: '1px solid rgba(168, 85, 247, 0.5)' }}
                title="Profiles"
              >
                <img src={activeProfile?.avatar} alt="Me" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>
          </header>
        )}

        <ProfileManager 
            isOpen={isProfileManagerOpen}
            onClose={() => setIsProfileManagerOpen(false)}
            profiles={profiles}
            activeProfileId={activeProfileId}
            onSelect={handleSelectProfile}
            onCreate={handleCreateProfile}
            onDelete={handleDeleteProfile}
            onUpdate={handleUpdateProfile}
        />

        {selectedPersona ? (
          <ChatInterface
            key={selectedPersona.id}
            persona={selectedPersona}
            userProfile={activeProfile}
            scenario={selectedScenario}
            allPersonas={processedPersonas}
            onBack={handleBack}
            onGoHome={handleGoHome}
            onSelectImage={handleSelectImage}
          />
        ) : activeView === 'gf' ? (
          <ChatInterface
            key={lyra_storyteller.id}
            persona={lyra_storyteller}
            userProfile={activeProfile}
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
        ) : activeView === 'genesis' ? (
          <GenesisWizard 
            onPersonaCreated={handlePersonaCreated}
            onGoHome={handleGoHome}
          />
        ) : (
          <PersonaList 
            onSelectPersona={handleSelectPersona} 
            customPersonas={customPersonas}
            allPersonas={processedPersonas.filter(p => p.id !== 'lyra_storyteller')}
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
          zIndex: 5000 // Lowered from 999999 to allow modals to be on top
        }}>
          <button 
            className={`nav-item ${activeView === 'home' ? 'active' : ''}`}
            onClick={handleGoHome}
          >
            <Home size={22} color={activeView === 'home' ? '#a855f7' : '#71717a'} />
            <span style={{ color: activeView === 'home' ? '#fff' : '#71717a' }}>Home</span>
          </button>

          <button 
            className={`nav-item ${activeView === 'chat' && selectedPersona?.id !== lyra_storyteller.id ? 'active' : ''}`}
            onClick={() => {
              const lastId = localStorage.getItem('lastPersonaId');
              if (lastId) {
                const persona = processedPersonas.find(p => p.id === lastId);
                if (persona) handleSelectPersona(persona);
                else handleGoHome();
              } else {
                handleGoHome();
              }
            }}
          >
            <MessageCircle size={22} color={activeView === 'chat' && selectedPersona?.id !== lyra_storyteller.id ? '#a855f7' : '#71717a'} />
            <span style={{ color: activeView === 'chat' && selectedPersona?.id !== lyra_storyteller.id ? '#fff' : '#71717a' }}>Chat</span>
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
