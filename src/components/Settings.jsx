import React, { useState, useEffect, useCallback } from 'react';
import { 
    ArrowLeft, Save, Plus, Trash2, Home, RefreshCw, Sparkles, 
    Settings as SettingsIcon, Database, Image as ImageIcon, User, 
    Wifi, WifiOff, CheckCircle, AlertCircle, Cpu
} from 'lucide-react';
import { fetchAvailableModels, getLmStudioUrl, getSdUrl } from '../services/llm';
import * as db from '../services/db';

import { 
    DEFAULT_LM_STUDIO_URL, DEFAULT_SD_URL, DEFAULT_IMAGE_ENGINE, 
    DEFAULT_LM_STUDIO_MODEL, DEFAULT_COMFY_WORKFLOW, DEFAULT_PONY_WORKFLOW,
    AVAILABLE_PONY_MODELS 
} from '../config';

const Settings = ({ onBack, onGoHome, setCustomPersonas, customPersonas, onSwitchServer }) => {
    // Basic Settings
    const [lmStudioUrl, setLmStudioUrl] = useState('');
    const [sdUrl, setSdUrl] = useState('');
    const [imageEngine, setImageEngine] = useState('comfyui');
    const [lmStudioModel, setLmStudioModel] = useState('');
    const [preferredLanguage, setPreferredLanguage] = useState('english');
    const [preferredComicModel, setPreferredComicModel] = useState('');
    
    // UI State
    const [activeTab, setActiveTab] = useState('backend');
    const [availableModels, setAvailableModels] = useState([]);
    const [isLoadingModels, setIsLoadingModels] = useState(false);
    const [comfyWorkflow, setComfyWorkflow] = useState('');
    const [saveToast, setSaveToast] = useState('');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    
    // User Profile
    const [userName, setUserName] = useState('');
    const [userAppearance, setUserAppearance] = useState('');
    const [userBackground, setUserBackground] = useState('');

    // Endpoint Management
    const [lmSavedEndpoints, setLmSavedEndpoints] = useState([]);
    const [sdSavedEndpoints, setSdSavedEndpoints] = useState([]);
    const [testResults, setTestResults] = useState({}); 

    // Initial Load
    useEffect(() => {
        const load = () => {
            const currentLmUrl = localStorage.getItem('lmStudioUrl') || DEFAULT_LM_STUDIO_URL;
            const currentSdUrl = localStorage.getItem('sdUrl') || DEFAULT_SD_URL;
            
            setLmStudioUrl(currentLmUrl);
            setSdUrl(currentSdUrl);
            setImageEngine(localStorage.getItem('imageEngine') || DEFAULT_IMAGE_ENGINE);
            setLmStudioModel(localStorage.getItem('lmStudioModel') || DEFAULT_LM_STUDIO_MODEL);
            setComfyWorkflow(localStorage.getItem('comfyWorkflow') || '');
            setPreferredLanguage(localStorage.getItem('preferredIndianLanguage') || 'english');
            
            setUserName(localStorage.getItem('userName') || '');
            setUserAppearance(localStorage.getItem('userAppearance') || '');
            setUserBackground(localStorage.getItem('userBackground') || '');
            setPreferredComicModel(localStorage.getItem('preferredComicModel') || 'disneyrealcartoonmix_v10.safetensors');

            try {
                const lmEndpoints = JSON.parse(localStorage.getItem('lmSavedEndpoints') || '[]');
                setLmSavedEndpoints(Array.isArray(lmEndpoints) ? lmEndpoints : []);
                const sdEndpoints = JSON.parse(localStorage.getItem('sdSavedEndpoints') || '[]');
                setSdSavedEndpoints(Array.isArray(sdEndpoints) ? sdEndpoints : []);
            } catch (e) {
                console.error("Failed to parse saved endpoints", e);
            }

            // Auto-test connections
            testEndpoint('lm', currentLmUrl);
            testEndpoint('sd', currentSdUrl);
            loadModels(currentLmUrl);
        };
        
        load();
    }, []);

    // Monitor for changes
    useEffect(() => {
        const isChanged = 
            lmStudioUrl !== (localStorage.getItem('lmStudioUrl') || DEFAULT_LM_STUDIO_URL) ||
            sdUrl !== (localStorage.getItem('sdUrl') || DEFAULT_SD_URL) ||
            lmStudioModel !== (localStorage.getItem('lmStudioModel') || DEFAULT_LM_STUDIO_MODEL) ||
            userName !== (localStorage.getItem('userName') || '') ||
            userAppearance !== (localStorage.getItem('userAppearance') || '');
        
        setHasUnsavedChanges(isChanged);
    }, [lmStudioUrl, sdUrl, lmStudioModel, userName, userAppearance]);

    const loadModels = async (url) => {
        if (!url) return;
        setIsLoadingModels(true);
        try {
            const models = await fetchAvailableModels();
            setAvailableModels(models);
            
            if (models.length > 0) {
                const currentModel = localStorage.getItem('lmStudioModel');
                if (!currentModel || currentModel === DEFAULT_LM_STUDIO_MODEL) {
                    setLmStudioModel(models[0].id);
                }
            }
        } catch (e) {
            console.error("Error loading models", e);
        } finally {
            setIsLoadingModels(false);
        }
    };

    const testEndpoint = async (type, url) => {
        setTestResults(prev => ({ ...prev, [url]: { status: 'loading' } }));
        const resolvedUrl = type === 'lm' ? getLmStudioUrl(url) : getSdUrl(url);
        
        try {
            // Determine test endpoint based on service type
            const testUrl = type === 'lm' 
                ? resolvedUrl.split('/chat/completions')[0] + '/models'
                : (imageEngine === 'comfyui' ? `${resolvedUrl}/system_stats` : `${resolvedUrl}/sdapi/v1/options`);

            const res = await fetch(testUrl, { signal: AbortSignal.timeout(5000) });
            if (res.ok) {
                const data = await res.json();
                setTestResults(prev => ({ 
                    ...prev, 
                    [url]: { 
                        status: 'success', 
                        message: type === 'lm' ? `Online (${data.data?.length || 0} models)` : 'Online' 
                    } 
                }));
                if (type === 'lm') loadModels(url);
            } else {
                setTestResults(prev => ({ ...prev, [url]: { status: 'error', message: `Server Error (${res.status})` } }));
            }
        } catch (e) {
            setTestResults(prev => ({ ...prev, [url]: { status: 'error', message: 'Offline / Unreachable' } }));
        }
    };

    const handleSaveSettings = () => {
        localStorage.setItem('lmStudioUrl', lmStudioUrl || DEFAULT_LM_STUDIO_URL);
        localStorage.setItem('sdUrl', sdUrl || DEFAULT_SD_URL);
        localStorage.setItem('imageEngine', imageEngine);
        localStorage.setItem('lmStudioModel', lmStudioModel);
        localStorage.setItem('comfyWorkflow', comfyWorkflow);
        localStorage.setItem('preferredIndianLanguage', preferredLanguage);
        
        localStorage.setItem('userName', userName);
        localStorage.setItem('userAppearance', userAppearance);
        localStorage.setItem('userBackground', userBackground);
        localStorage.setItem('preferredComicModel', preferredComicModel);
        
        localStorage.setItem('lmSavedEndpoints', JSON.stringify(lmSavedEndpoints));
        localStorage.setItem('sdSavedEndpoints', JSON.stringify(sdSavedEndpoints));
        
        setHasUnsavedChanges(false);
        setSaveToast('✅ Configuration synchronized!');
        setTimeout(() => setSaveToast(''), 3000);
    };

    const handleResetToDefaults = async () => {
        if (window.confirm("CRITICAL: This will perform a DEEP RESET of the system. This is required to fix the crash-induced corruption you are seeing. Proceed?")) {
            localStorage.clear();
            
            // Wipe every single table in IndexedDB to purge corruption
            const stores = [
                'chats', 'memories', 'settings', 'conversations', 
                'wardrobe', 'logins', 'unlocked_gallery', 'rewards', 
                'journals', 'lore', 'global_vault', 'persona_events', 'scene_state'
            ];
            
            for (const store of stores) {
                try {
                    await db.clear(store);
                } catch (e) {
                    console.warn(`Could not clear store ${store}`, e);
                }
            }
            
            window.location.reload();
        }
    };

    const addSavedEndpoint = (type, url) => {
        if (!url || url.length < 5) return;
        if (type === 'lm') {
            if (!lmSavedEndpoints.includes(url)) {
                setLmSavedEndpoints(prev => [...prev, url]);
                setHasUnsavedChanges(true);
            }
        } else {
            if (!sdSavedEndpoints.includes(url)) {
                setSdSavedEndpoints(prev => [...prev, url]);
                setHasUnsavedChanges(true);
            }
        }
    };

    const removeSavedEndpoint = (type, url) => {
        if (type === 'lm') {
            setLmSavedEndpoints(prev => prev.filter(e => e !== url));
        } else {
            setSdSavedEndpoints(prev => prev.filter(e => e !== url));
        }
        setHasUnsavedChanges(true);
    };

    const StatusBadge = ({ url }) => {
        const result = testResults[url];
        if (!result) return <span style={{ fontSize: '0.7rem', color: '#71717a' }}>Checking...</span>;
        
        if (result.status === 'loading') return <RefreshCw size={12} className="spin" style={{ color: '#c084fc' }} />;
        if (result.status === 'success') return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontSize: '0.75rem', fontWeight: 'bold' }}>
                <CheckCircle size={14} /> {result.message}
            </div>
        );
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '0.75rem' }}>
                <AlertCircle size={14} /> {result.message}
            </div>
        );
    };

    return (
        <div className="settings-container fade-in" style={{ padding: '1rem', maxWidth: '800px', margin: '0 auto', height: '100vh', overflowY: 'auto', overflowX: 'hidden' }}>
            {saveToast && (
                <div className="save-toast" style={{
                    position: 'fixed', top: '1.5rem', left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(16, 185, 129, 0.95)', color: 'white',
                    padding: '0.75rem 1.5rem', borderRadius: '12px',
                    fontWeight: 'bold', fontSize: '0.9rem', zIndex: 9999,
                    boxShadow: '0 4px 20px rgba(16,185,129,0.3)',
                    backdropFilter: 'blur(10px)'
                }}>
                    {saveToast}
                </div>
            )}

            <div className="settings-header" style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <button className="back-btn" onClick={onBack} style={{ padding: '8px 16px', borderRadius: '10px' }}>
                        <ArrowLeft size={18} /> Back
                    </button>
                    <h1 style={{ margin: 0, fontSize: '2rem', flex: 1 }}>Aura System Settings</h1>
                    <button onClick={onGoHome} className="icon-btn-ghost"><Home size={22} /></button>
                </div>

                {/* System Summary Card */}
                <div className="system-summary-card glass-panel" style={{ padding: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', background: 'rgba(192, 132, 252, 0.03)', border: '1px solid rgba(192, 132, 252, 0.15)' }}>
                    <div style={{ flex: '1 1 120px' }}>
                        <div style={{ fontSize: '0.65rem', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Brain (LLM)</div>
                        <StatusBadge url={lmStudioUrl} />
                    </div>
                    <div className="summary-divider" style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                    <div style={{ flex: '1 1 120px' }}>
                        <div style={{ fontSize: '0.65rem', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Vision (SD)</div>
                        <StatusBadge url={sdUrl} />
                    </div>
                    <div className="summary-divider" style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                    <div style={{ flex: '1 1 120px' }}>
                        <div style={{ fontSize: '0.65rem', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Persona Pool</div>
                        <div style={{ color: 'white', fontSize: '0.8rem', fontWeight: 'bold' }}>{customPersonas.length + 15} Assets</div>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '2rem', padding: '4px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', alignSelf: 'flex-start' }}>
                <button onClick={() => setActiveTab('backend')} className={`tab-btn ${activeTab === 'backend' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Database size={16} /> Backend
                </button>
                <button onClick={() => setActiveTab('vision')} className={`tab-btn ${activeTab === 'vision' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ImageIcon size={16} /> Image Gen
                </button>
                <button onClick={() => setActiveTab('profile')} className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={16} /> Profile
                </button>
            </div>

            <div className="settings-content" style={{ display: 'grid', gap: '2rem' }}>
                {activeTab === 'backend' && (
                    <div className="settings-section fade-in">
                        <div className="section-card glass-panel" style={{ padding: '2rem' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Database size={20} color="#c084fc" /> Intelligence Engine (LM Studio)
                            </h3>
                            
                            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                                <label>Host Endpoint URL</label>
                                <div className="responsive-input-flex">
                                    <input 
                                        type="text" 
                                        value={lmStudioUrl} 
                                        onChange={(e) => setLmStudioUrl(e.target.value)}
                                        placeholder="http://localhost:1234/v1"
                                        className="premium-input"
                                        style={{ flex: 1 }}
                                    />
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => testEndpoint('lm', lmStudioUrl)} className="btn-secondary" style={{ whiteSpace: 'nowrap' }}>Test</button>
                                        <button onClick={() => addSavedEndpoint('lm', lmStudioUrl)} className="icon-btn-outline" title="Save to History"><Plus size={18} /></button>
                                    </div>
                                </div>
                                
                                {lmSavedEndpoints.length > 0 && (
                                    <div className="endpoint-history" style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {lmSavedEndpoints.map(url => (
                                            <div key={url} className={`endpoint-chip ${lmStudioUrl === url ? 'active' : ''}`} style={{
                                                display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px',
                                                background: 'rgba(255,255,255,0.05)', borderRadius: '20px', fontSize: '0.75rem',
                                                border: lmStudioUrl === url ? '1px solid #c084fc' : '1px solid transparent',
                                                cursor: 'pointer'
                                            }} onClick={() => {
                                                setLmStudioUrl(url);
                                                testEndpoint('lm', url);
                                            }}>
                                                <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</span>
                                                <button onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeSavedEndpoint('lm', url);
                                                }} style={{ background: 'transparent', border: 'none', color: '#ef4444', padding: 0, display: 'flex' }}>
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="input-group">
                                <label>Loaded Model</label>
                                <div className="responsive-input-flex">
                                    <select 
                                        value={lmStudioModel} 
                                        onChange={(e) => setLmStudioModel(e.target.value)}
                                        className="premium-select"
                                        style={{ flex: 1 }}
                                    >
                                        <option value="local-model">Auto-detect (local-model)</option>
                                        {availableModels.map(m => <option key={m.id} value={m.id}>{m.id}</option>)}
                                    </select>
                                    <button onClick={() => loadModels(lmStudioUrl)} className="icon-btn-outline" title="Refresh Models"><RefreshCw size={18} /></button>
                                </div>
                                <p style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '8px' }}>Make sure your model is loaded in LM Studio first.</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'vision' && (
                    <div className="settings-section fade-in">
                        <div className="section-card glass-panel" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <ImageIcon size={20} color="#f472b6" /> Visualization Engine (ComfyUI)
                            </h3>
                            
                            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                                <label>Image API Endpoint</label>
                                <div className="responsive-input-flex">
                                    <input 
                                        type="text" 
                                        value={sdUrl} 
                                        onChange={(e) => setSdUrl(e.target.value)}
                                        placeholder="http://localhost:8000"
                                        className="premium-input"
                                        style={{ flex: 1 }}
                                    />
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => testEndpoint('sd', sdUrl)} className="btn-secondary" style={{ whiteSpace: 'nowrap' }}>Test</button>
                                        <button onClick={() => addSavedEndpoint('sd', sdUrl)} className="icon-btn-outline" title="Save to History"><Plus size={18} /></button>
                                    </div>
                                </div>

                                {sdSavedEndpoints.length > 0 && (
                                    <div className="endpoint-history" style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {sdSavedEndpoints.map(url => (
                                            <div key={url} className={`endpoint-chip ${sdUrl === url ? 'active' : ''}`} style={{
                                                display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px',
                                                background: 'rgba(255,255,255,0.05)', borderRadius: '20px', fontSize: '0.75rem',
                                                border: sdUrl === url ? '1px solid #f472b6' : '1px solid transparent',
                                                cursor: 'pointer'
                                            }} onClick={() => {
                                                setSdUrl(url);
                                                testEndpoint('sd', url);
                                            }}>
                                                <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</span>
                                                <button onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeSavedEndpoint('sd', url);
                                                }} style={{ background: 'transparent', border: 'none', color: '#ef4444', padding: 0, display: 'flex' }}>
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                                <label>Preferred Art Model (Comic/Story)</label>
                                <select 
                                    value={preferredComicModel} 
                                    onChange={(e) => setPreferredComicModel(e.target.value)}
                                    className="premium-select"
                                >
                                    {AVAILABLE_PONY_MODELS.map(m => (
                                        <option key={m.id} value={m.id}>[{m.category}] {m.name}</option>
                                    ))}
                                </select>
                                <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(244,114,182,0.05)', borderRadius: '12px', borderLeft: '3px solid #f472b6' }}>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#f472b6' }}>
                                        <strong>Optimized for:</strong> {AVAILABLE_PONY_MODELS.find(m => m.id === preferredComicModel)?.description}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="section-card glass-panel" style={{ padding: '1.5rem', border: '1px solid rgba(192, 132, 252, 0.2)' }}>
                            <h4 style={{ margin: '0 0 1rem 0', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Cpu size={18} /> Quick Optimizer
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                <button className="setup-card" onClick={() => {
                                    setComfyWorkflow(JSON.stringify(DEFAULT_COMFY_WORKFLOW, null, 2));
                                    setSaveToast('⚡ Optimized for SD 1.5 Realism');
                                }}>
                                    <div className="setup-title">Standard SD 1.5</div>
                                    <div className="setup-desc">Best for Realistic Vision & Juggernaut SD 1.5 models. (512x768)</div>
                                </button>
                                <button className="setup-card pony" onClick={() => {
                                    setComfyWorkflow(JSON.stringify(DEFAULT_PONY_WORKFLOW, null, 2));
                                    setSaveToast('🦄 Optimized for Pony V6 / XL');
                                }}>
                                    <div className="setup-title">Pony Diffusion XL</div>
                                    <div className="setup-desc">Optimized for high-fidelity 2D/3D and complex tags. (832x1216)</div>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'profile' && (
                    <div className="settings-section fade-in">
                        <div className="section-card glass-panel" style={{ padding: '2rem' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <User size={20} color="#3b82f6" /> User Persona
                            </h3>
                            
                            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                                <label>Display Name</label>
                                <input 
                                    type="text" 
                                    value={userName} 
                                    onChange={(e) => setUserName(e.target.value)}
                                    placeholder="Your name in clinical/RP notes"
                                    className="premium-input"
                                />
                            </div>

                            <div className="input-group">
                                <label>Your Identity / Appearance</label>
                                <textarea 
                                    value={userAppearance} 
                                    onChange={(e) => setUserAppearance(e.target.value)}
                                    placeholder="Describe your physical features, age, and role (e.g., student, guest, younger stepbrother). The AI uses this to personalize interactions."
                                    className="premium-input"
                                    rows={4}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Actions */}
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '1.5rem', 
                    padding: '1.5rem 0', 
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    marginTop: '1rem'
                }}>
                    <button 
                        onClick={handleSaveSettings} 
                        className={`btn-primary ${hasUnsavedChanges ? 'pulse' : ''}`}
                        style={{ flex: 1, height: '54px', fontSize: '1.1rem' }}
                    >
                        <Save size={20} /> Synchronize All Settings
                    </button>
                    <button 
                        onClick={handleResetToDefaults} 
                        className="btn-danger-outline"
                        title="Danger Zone: Hard Reset"
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>
                
                {hasUnsavedChanges && (
                    <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#f472b6', animation: 'fadeIn 0.5s ease' }}>
                        * You have unsaved changes that haven't been applied to the system yet.
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .tab-btn {
                    padding: 10px 20px;
                    border-radius: 10px;
                    border: none;
                    background: transparent;
                    color: #71717a;
                    font-weight: 600;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .endpoint-chip {
                    transition: all 0.2s ease;
                }
                .endpoint-chip:hover {
                    background: rgba(255,255,255,0.1) !important;
                }
                .endpoint-chip.active {
                    background: rgba(192, 132, 252, 0.1) !important;
                }
                .tab-btn.active {
                    background: rgba(192, 132, 252, 0.15);
                    color: white;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                .premium-input, .premium-select {
                    background: rgba(0,0,0,0.4);
                    border: 1px solid #3f3f46;
                    color: white;
                    padding: 0.85rem 1rem;
                    borderRadius: 12px;
                    font-size: 0.95rem;
                    transition: all 0.2s ease;
                }
                .premium-input:focus, .premium-select:focus {
                    border-color: #c084fc;
                    box-shadow: 0 0 0 3px rgba(192, 132, 252, 0.1);
                    outline: none;
                }
                .btn-secondary {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid #3f3f46;
                    color: white;
                    padding: 0 1.5rem;
                    border-radius: 12px;
                    font-weight: 600;
                    cursor: pointer;
                }
                .btn-secondary:hover {
                    background: rgba(255,255,255,0.1);
                }
                .icon-btn-outline {
                    background: rgba(192, 132, 252, 0.05);
                    border: 1px solid rgba(192, 132, 252, 0.3);
                    color: #c084fc;
                    width: 48px;
                    display: flex;
                    alignItems: center;
                    justifyContent: center;
                    border-radius: 12px;
                    cursor: pointer;
                }
                .setup-card {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.08);
                    padding: 1.25rem;
                    border-radius: 16px;
                    text-align: left;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .setup-card:hover {
                    background: rgba(255,255,255,0.05);
                    border-color: rgba(255,255,255,0.2);
                    transform: translateY(-2px);
                }
                .setup-card.pony:hover {
                    border-color: #8b5cf6;
                    box-shadow: 0 10px 30px rgba(139, 92, 246, 0.1);
                }
                .setup-title {
                    font-weight: bold;
                    color: white;
                    margin-bottom: 6px;
                    font-size: 1rem;
                }
                .setup-desc {
                    font-size: 0.75rem;
                    color: #71717a;
                    line-height: 1.4;
                }
                .btn-danger-outline {
                    background: transparent;
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    color: #ef4444;
                    width: 54px;
                    height: 54px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 14px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-danger-outline:hover {
                    background: rgba(239, 68, 68, 0.05);
                    border-color: #ef4444;
                }
                .responsive-input-flex {
                    display: flex;
                    gap: 10px;
                }
                @media (max-width: 600px) {
                    .responsive-input-flex {
                        flex-direction: column;
                    }
                    .summary-divider {
                        display: none;
                    }
                }
                .btn-primary {
                    background: var(--aura-gradient, linear-gradient(135deg, #a855f7, #ec4899, #f43f5e));
                    color: white;
                    border: none;
                    padding: 0.85rem 1.5rem;
                    border-radius: 12px;
                    font-weight: bold;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    transition: all 0.2s ease;
                }
                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(168, 85, 247, 0.3);
                }
                .input-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .input-group label {
                    font-size: 0.8rem;
                    color: #a1a1aa;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .section-card {
                    display: flex;
                    flex-direction: column;
                }
                .icon-btn-ghost {
                    background: transparent;
                    border: none;
                    color: #a1a1aa;
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 50%;
                    transition: all 0.2s;
                }
                .icon-btn-ghost:hover {
                    background: rgba(255,255,255,0.05);
                    color: white;
                }
                .pulse {
                    animation: subtle-pulse 2s infinite;
                }
                @keyframes subtle-pulse {
                    0% { box-shadow: 0 0 0 0 rgba(192, 132, 252, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(192, 132, 252, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(192, 132, 252, 0); }
                }
            ` }} />
        </div>
    );
};

export default Settings;
