import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, Trash2, Home, RefreshCw, Sparkles } from 'lucide-react';
import { fetchAvailableModels, getLmStudioUrl, getSdUrl } from '../services/llm';
import * as db from '../services/db';

import { DEFAULT_LM_STUDIO_URL, DEFAULT_SD_URL, DEFAULT_IMAGE_ENGINE, DEFAULT_LM_STUDIO_MODEL, DEFAULT_COMFY_WORKFLOW } from '../config';

const Settings = ({ onBack, onGoHome, setCustomPersonas, customPersonas, onSwitchServer }) => {
    const [lmStudioUrl, setLmStudioUrl] = useState('');
    const [sdUrl, setSdUrl] = useState('');
    const [imageEngine, setImageEngine] = useState('a1111');
    const [lmStudioModel, setLmStudioModel] = useState('');
    const [availableModels, setAvailableModels] = useState([]);
    const [isLoadingModels, setIsLoadingModels] = useState(false);
    const [comfyWorkflow, setComfyWorkflow] = useState('');
    const [preferredLanguage, setPreferredLanguage] = useState('english');
    const [newPersona, setNewPersona] = useState({ name: '', tagline: '', systemPrompt: '', initialMessage: '' });
    const [saveToast, setSaveToast] = useState('');
    
    // User Profile Profile States
    const [userName, setUserName] = useState('');
    const [userAppearance, setUserAppearance] = useState('');
    const [userBackground, setUserBackground] = useState('');

    // Endpoint Management States
    const [lmSavedEndpoints, setLmSavedEndpoints] = useState([]);
    const [sdSavedEndpoints, setSdSavedEndpoints] = useState([]);
    const [testResults, setTestResults] = useState({}); // { url: { status: 'success'|'error'|'loading', message: '' } }

    useEffect(() => {
        // Load existing settings
        setLmStudioUrl(localStorage.getItem('lmStudioUrl') || DEFAULT_LM_STUDIO_URL);
        setSdUrl(localStorage.getItem('sdUrl') || DEFAULT_SD_URL);
        setImageEngine(localStorage.getItem('imageEngine') || DEFAULT_IMAGE_ENGINE);
        setLmStudioModel(localStorage.getItem('lmStudioModel') || DEFAULT_LM_STUDIO_MODEL);
        setComfyWorkflow(localStorage.getItem('comfyWorkflow') || '');
        setPreferredLanguage(localStorage.getItem('preferredIndianLanguage') || 'english');
        
        // Load user profile
        setUserName(localStorage.getItem('userName') || '');
        setUserAppearance(localStorage.getItem('userAppearance') || '');
        setUserBackground(localStorage.getItem('userBackground') || '');

        // Load saved endpoints
        try {
            const lmEndpoints = JSON.parse(localStorage.getItem('lmSavedEndpoints') || '[]');
            setLmSavedEndpoints(Array.isArray(lmEndpoints) ? lmEndpoints : []);
            
            const sdEndpoints = JSON.parse(localStorage.getItem('sdSavedEndpoints') || '[]');
            setSdSavedEndpoints(Array.isArray(sdEndpoints) ? sdEndpoints : []);
            
            // Migration from old savedServers
            if (lmEndpoints.length === 0) {
                const oldServers = JSON.parse(localStorage.getItem('savedServers') || '[]');
                if (oldServers.length > 0) {
                    const migrated = oldServers.map(s => ({ id: s.id, name: s.name, url: s.url }));
                    setLmSavedEndpoints(migrated);
                    localStorage.setItem('lmSavedEndpoints', JSON.stringify(migrated));
                }
            }
        } catch (e) {
            console.error("Failed to parse saved endpoints", e);
        }

        // Fetch models
        const currentUrl = localStorage.getItem('lmStudioUrl') || DEFAULT_LM_STUDIO_URL;
        loadModels(currentUrl);
    }, []);

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
                    localStorage.setItem('lmStudioModel', models[0].id);
                }
            }
        } catch (e) {
            console.error("Error loading models", e);
        } finally {
            setIsLoadingModels(false);
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
        
        localStorage.setItem('lmSavedEndpoints', JSON.stringify(lmSavedEndpoints));
        localStorage.setItem('sdSavedEndpoints', JSON.stringify(sdSavedEndpoints));
        
        setSaveToast('✅ Settings saved!');
        setTimeout(() => setSaveToast(''), 3000);
    };

    const handleResetToDefaults = async () => {
        if (window.confirm("Reset all settings to system defaults? This will clear all chats, custom personas and user profile.")) {
            localStorage.clear();
            // Clear IndexedDB
            await db.clear('chats');
            await db.clear('memories');
            await db.clear('personas');
            await db.clear('settings');
            window.location.reload();
        }
    };

    const handleAddLmEndpoint = () => {
        const name = prompt("Enter a nickname for this LM Studio endpoint:");
        if (!name) return;
        const newEndpoint = { id: Date.now(), name, url: lmStudioUrl };
        const updated = [...lmSavedEndpoints, newEndpoint];
        setLmSavedEndpoints(updated);
        localStorage.setItem('lmSavedEndpoints', JSON.stringify(updated));
        setSaveToast(`✅ LM Studio profile "${name}" saved!`);
        setTimeout(() => setSaveToast(''), 3000);
    };

    const handleAddSdEndpoint = () => {
        const name = prompt("Enter a nickname for this Image API endpoint:");
        if (!name) return;
        const newEndpoint = { id: Date.now(), name, url: sdUrl, engine: imageEngine };
        const updated = [...sdSavedEndpoints, newEndpoint];
        setSdSavedEndpoints(updated);
        localStorage.setItem('sdSavedEndpoints', JSON.stringify(updated));
        setSaveToast(`✅ Image API profile "${name}" saved!`);
        setTimeout(() => setSaveToast(''), 3000);
    };

    const handleDeleteEndpoint = (type, id) => {
        if (type === 'lm') {
            const updated = lmSavedEndpoints.filter(e => e.id !== id);
            setLmSavedEndpoints(updated);
            localStorage.setItem('lmSavedEndpoints', JSON.stringify(updated));
        } else {
            const updated = sdSavedEndpoints.filter(e => e.id !== id);
            setSdSavedEndpoints(updated);
            localStorage.setItem('sdSavedEndpoints', JSON.stringify(updated));
        }
    };

    const handleConnectEndpoint = (type, endpoint) => {
        if (type === 'lm') {
            setLmStudioUrl(endpoint.url);
            localStorage.setItem('lmStudioUrl', endpoint.url);
            loadModels(endpoint.url);
            if (onSwitchServer) onSwitchServer(endpoint.url);
        } else {
            setSdUrl(endpoint.url);
            setImageEngine(endpoint.engine || 'comfyui');
            localStorage.setItem('sdUrl', endpoint.url);
            localStorage.setItem('imageEngine', endpoint.engine || 'comfyui');
        }
        setSaveToast('✅ Switched to ' + endpoint.name);
        setTimeout(() => setSaveToast(''), 3000);
    };

    const testEndpoint = async (type, url) => {
        setTestResults(prev => ({ ...prev, [url]: { status: 'loading' } }));
        const resolvedUrl = type === 'lm' ? getLmStudioUrl(url) : getSdUrl(url);
        const testUrl = type === 'lm' 
            ? resolvedUrl.replace('/chat/completions', '/models')
            : (imageEngine === 'comfyui' ? `${resolvedUrl}/system_stats` : `${resolvedUrl}/sdapi/v1/options`);

        try {
            const res = await fetch(testUrl);
            if (res.ok) {
                setTestResults(prev => ({ ...prev, [url]: { status: 'success', message: 'Online' } }));
            } else {
                setTestResults(prev => ({ ...prev, [url]: { status: 'error', message: `Status ${res.status}` } }));
            }
        } catch (e) {
            setTestResults(prev => ({ ...prev, [url]: { status: 'error', message: 'Offline' } }));
        }
    };

    const handleDeletePersona = async (id) => {
        const updated = customPersonas.filter(p => p.id !== id);
        setCustomPersonas(updated);
        await db.setItem('settings', 'customPersonas', updated);
        await db.removeItem('chats', `chat_${id}`);
        await db.removeItem('memories', `milestones_${id}`);
        await db.removeItem('memories', `moments_${id}`);
        await db.removeItem('settings', `persona_img_${id}`);
        alert(`Deleted persona and all associated chat data.`);
    };

    const handleQuickSetupComfyUI = () => {
        const workflow = DEFAULT_COMFY_WORKFLOW;
        setSdUrl(DEFAULT_SD_URL);
        setImageEngine('comfyui');
        setComfyWorkflow(JSON.stringify(workflow, null, 2));
        setSaveToast('🚀 ComfyUI Setup for SDXL!');
        setTimeout(() => setSaveToast(''), 3000);
    };

    const handleQuickSetupSD15 = () => {
        const workflow = {
            "3": { "inputs": { "seed": 42, "steps": 20, "cfg": 7, "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": 1, "model": ["4", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["5", 0] }, "class_type": "KSampler" },
            "4": { "inputs": { "ckpt_name": "Realistic_Vision_V6.safetensors" }, "class_type": "CheckpointLoaderSimple" },
            "5": { "inputs": { "width": 512, "height": 768, "batch_size": 1 }, "class_type": "EmptyLatentImage" },
            "6": { "inputs": { "text": "high quality, photorealistic, cinematic, __PROMPT__", "clip": ["4", 1] }, "class_type": "CLIPTextEncode" },
            "7": { "inputs": { "text": "lowres, bad anatomy, bad hands, text, error", "clip": ["4", 1] }, "class_type": "CLIPTextEncode" },
            "8": { "inputs": { "samples": ["3", 0], "vae": ["4", 2] }, "class_type": "VAEDecode" },
            "9": { "inputs": { "filename_prefix": "ChatExperience", "images": ["8", 0] }, "class_type": "SaveImage" }
        };
        setSdUrl('http://127.0.0.1:8000');
        setImageEngine('comfyui');
        setComfyWorkflow(JSON.stringify(workflow, null, 2));
        setSaveToast('⚡ ComfyUI Setup for SD 1.5!');
        setTimeout(() => setSaveToast(''), 3000);
    };

    return (
        <div className="persona-list-container fade-in" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            {saveToast && (
                <div style={{
                    position: 'fixed', top: '1.5rem', left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(16, 185, 129, 0.95)', color: 'white',
                    padding: '0.75rem 1.5rem', borderRadius: '12px',
                    fontWeight: 'bold', fontSize: '0.9rem', zIndex: 9999,
                    boxShadow: '0 4px 20px rgba(16,185,129,0.3)',
                    animation: 'fadeIn 0.2s ease'
                }}>
                    {saveToast}
                </div>
            )}

            <div className="header" style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                <button className="back-btn" onClick={onBack} style={{ marginRight: '1rem' }}>
                    <ArrowLeft size={20} />
                    Back
                </button>
                <h1 style={{ margin: 0 }}>Settings</h1>
                <button 
                  className="back-btn" 
                  onClick={onGoHome} 
                  style={{ marginLeft: 'auto', background: 'rgba(161, 161, 170, 0.1)', color: '#a1a1aa', border: 'none' }}
                >
                    <Home size={20} />
                </button>
            </div>

            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <h2 style={{ marginBottom: '1.5rem', color: '#c084fc' }}>Backend Configuration</h2>

                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <label style={{ color: '#a1a1aa' }}>LM Studio API URL</label>
                        <button onClick={handleAddLmEndpoint} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#c084fc', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                            <Plus size={14} /> Save Profile
                        </button>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="text"
                            value={lmStudioUrl}
                            onChange={(e) => setLmStudioUrl(e.target.value)}
                            placeholder="http://192.168.86.28:1234/v1"
                            style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid #3f3f46', color: 'white' }}
                        />
                        <button 
                            onClick={() => testEndpoint('lm', lmStudioUrl)} 
                            disabled={testResults[lmStudioUrl]?.status === 'loading'}
                            style={{ 
                                padding: '0.75rem', borderRadius: '8px', 
                                background: testResults[lmStudioUrl]?.status === 'success' ? 'rgba(34, 197, 94, 0.2)' : (testResults[lmStudioUrl]?.status === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)'), 
                                color: testResults[lmStudioUrl]?.status === 'success' ? '#22c55e' : (testResults[lmStudioUrl]?.status === 'error' ? '#ef4444' : '#22c55e'), 
                                border: `1px solid ${testResults[lmStudioUrl]?.status === 'success' ? '#22c55e' : (testResults[lmStudioUrl]?.status === 'error' ? '#ef4444' : '#22c55e')}`, 
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                minWidth: '80px',
                                justifyContent: 'center'
                            }}
                        >
                            {testResults[lmStudioUrl]?.status === 'loading' ? <RefreshCw size={16} className="spin" /> : (testResults[lmStudioUrl]?.status === 'success' ? 'Online' : (testResults[lmStudioUrl]?.status === 'error' ? 'Offline' : 'Test'))}
                        </button>
                    </div>
                    
                    {lmSavedEndpoints.length > 0 && (
                        <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {lmSavedEndpoints.map(e => (
                                <div key={e.id} style={{ 
                                    display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 10px', 
                                    background: lmStudioUrl === e.url ? 'rgba(192, 132, 252, 0.2)' : 'rgba(255,255,255,0.05)', 
                                    borderRadius: '8px', border: `1px solid ${lmStudioUrl === e.url ? '#c084fc' : '#3f3f46'}`,
                                    fontSize: '0.8rem'
                                }}>
                                    <span style={{ color: lmStudioUrl === e.url ? 'white' : '#a1a1aa', cursor: 'pointer' }} onClick={() => handleConnectEndpoint('lm', e)}>
                                        {e.name}
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <button onClick={() => testEndpoint('lm', e.url)} style={{ background: 'transparent', border: 'none', color: testResults[e.url]?.status === 'success' ? '#22c55e' : (testResults[e.url]?.status === 'error' ? '#ef4444' : '#71717a'), cursor: 'pointer', padding: 0 }}>
                                            <RefreshCw size={12} className={testResults[e.url]?.status === 'loading' ? 'spin' : ''} />
                                        </button>
                                        <button onClick={() => handleDeleteEndpoint('lm', e.id)} style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer', padding: 0 }}>
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a1a1aa' }}>Active Model</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <select
                            value={lmStudioModel}
                            onChange={(e) => setLmStudioModel(e.target.value)}
                            style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid #3f3f46', color: 'white' }}
                        >
                            <option value="local-model">Default (local-model)</option>
                            {availableModels.map(model => (
                                <option key={model.id} value={model.id}>{model.id}</option>
                            ))}
                        </select>
                        <button onClick={() => loadModels(lmStudioUrl)} disabled={isLoadingModels} style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(192, 132, 252, 0.1)', color: '#c084fc', border: '1px solid #c084fc', cursor: 'pointer' }}>
                            <RefreshCw size={18} className={isLoadingModels ? 'spin' : ''} />
                        </button>
                    </div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a1a1aa' }}>Stable Diffusion Engine</label>
                    <select
                        value={imageEngine}
                        onChange={(e) => setImageEngine(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid #3f3f46', color: 'white' }}
                    >
                        <option value="a1111">Automatic1111</option>
                        <option value="comfyui">ComfyUI</option>
                        <option value="drawthings">Draw Things (Mac)</option>
                        <option value="diffusionbee">Diffusion Bee (Mac)</option>
                    </select>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <label style={{ color: '#a1a1aa' }}>Image API URL</label>
                        <button onClick={handleAddSdEndpoint} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#c084fc', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                            <Plus size={14} /> Save Profile
                        </button>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="text"
                            value={sdUrl}
                            onChange={(e) => setSdUrl(e.target.value)}
                            placeholder="http://192.168.86.28:8000"
                            style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid #3f3f46', color: 'white' }}
                        />
                        <button 
                            onClick={() => testEndpoint('sd', sdUrl)} 
                            disabled={testResults[sdUrl]?.status === 'loading'}
                            style={{ 
                                padding: '0.75rem', borderRadius: '8px', 
                                background: testResults[sdUrl]?.status === 'success' ? 'rgba(34, 197, 94, 0.2)' : (testResults[sdUrl]?.status === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)'), 
                                color: testResults[sdUrl]?.status === 'success' ? '#22c55e' : (testResults[sdUrl]?.status === 'error' ? '#ef4444' : '#22c55e'), 
                                border: `1px solid ${testResults[sdUrl]?.status === 'success' ? '#22c55e' : (testResults[sdUrl]?.status === 'error' ? '#ef4444' : '#22c55e')}`, 
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                minWidth: '80px',
                                justifyContent: 'center'
                            }}
                        >
                            {testResults[sdUrl]?.status === 'loading' ? <RefreshCw size={16} className="spin" /> : (testResults[sdUrl]?.status === 'success' ? 'Online' : (testResults[sdUrl]?.status === 'error' ? 'Offline' : 'Test'))}
                        </button>
                    </div>
                    
                    {sdSavedEndpoints.length > 0 && (
                        <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {sdSavedEndpoints.map(e => (
                                <div key={e.id} style={{ 
                                    display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 10px', 
                                    background: sdUrl === e.url ? 'rgba(192, 132, 252, 0.2)' : 'rgba(255,255,255,0.05)', 
                                    borderRadius: '8px', border: `1px solid ${sdUrl === e.url ? '#c084fc' : '#3f3f46'}`,
                                    fontSize: '0.8rem'
                                }}>
                                    <span style={{ color: sdUrl === e.url ? 'white' : '#a1a1aa', cursor: 'pointer' }} onClick={() => handleConnectEndpoint('sd', e)}>
                                        {e.name}
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <button onClick={() => testEndpoint('sd', e.url)} style={{ background: 'transparent', border: 'none', color: testResults[e.url]?.status === 'success' ? '#22c55e' : (testResults[e.url]?.status === 'error' ? '#ef4444' : '#71717a'), cursor: 'pointer', padding: 0 }}>
                                            <RefreshCw size={12} className={testResults[e.url]?.status === 'loading' ? 'spin' : ''} />
                                        </button>
                                        <button onClick={() => handleDeleteEndpoint('sd', e.id)} style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer', padding: 0 }}>
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ marginBottom: '2rem', background: 'rgba(192, 132, 252, 0.05)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(192, 132, 252, 0.2)' }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#c084fc', fontSize: '1rem' }}>ComfyUI Quick Setup</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <button onClick={handleQuickSetupComfyUI} style={{ background: 'linear-gradient(135deg, #ec4899 0%, #c084fc 100%)', color: 'white', border: 'none', padding: '0.6rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Setup SDXL</button>
                        <button onClick={handleQuickSetupSD15} style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid #22c55e', padding: '0.6rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Setup SD 1.5</button>
                    </div>
                </div>

                {imageEngine === 'comfyui' && (
                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a1a1aa' }}>ComfyUI Workflow JSON</label>
                        <textarea
                            value={comfyWorkflow}
                            onChange={(e) => setComfyWorkflow(e.target.value)}
                            placeholder='Paste ComfyUI API JSON here...'
                            rows={6}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid #3f3f46', color: '#6ee7b7', fontFamily: 'monospace', fontSize: '0.8rem', resize: 'vertical' }}
                        />
                    </div>
                )}

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={handleSaveSettings} style={{ flex: 1, background: 'rgba(192, 132, 252, 0.2)', color: '#c084fc', border: '1px solid #c084fc', padding: '0.85rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 'bold' }}>
                        <Save size={20} style={{ marginRight: '8px' }} /> Save All Settings
                    </button>
                    <button onClick={handleResetToDefaults} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444', padding: '0.85rem', borderRadius: '10px', cursor: 'pointer' }} title="Reset to Defaults">
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <h2 style={{ marginBottom: '1.5rem', color: '#c084fc' }}>User Profile</h2>
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a1a1aa' }}>Your Name</label>
                    <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="e.g., Rahul" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid #3f3f46', color: 'white' }} />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a1a1aa' }}>Your Appearance</label>
                    <textarea value={userAppearance} onChange={(e) => setUserAppearance(e.target.value)} placeholder="Describe yourself..." rows={2} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid #3f3f46', color: 'white', resize: 'vertical' }} />
                </div>
                <button onClick={handleSaveSettings} style={{ background: 'rgba(192, 132, 252, 0.2)', color: '#c084fc', border: '1px solid #c084fc', padding: '0.75rem 1.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', cursor: 'pointer', fontWeight: 'bold' }}>
                    <Save size={18} style={{ marginRight: '8px' }} /> Save Profile
                </button>
            </div>

            <div className="glass-panel" style={{ padding: '2rem' }}>
                <h2 style={{ marginBottom: '1.5rem', color: '#c084fc' }}>Custom Personas</h2>
                
                <div style={{ 
                    background: 'rgba(168, 85, 247, 0.05)', 
                    padding: '1.5rem', 
                    borderRadius: '16px', 
                    border: '1px dashed rgba(168, 85, 247, 0.3)',
                    textAlign: 'center',
                    marginBottom: '2rem'
                }}>
                    <div style={{ background: 'rgba(168, 85, 247, 0.1)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                        <Sparkles size={24} color="#a855f7" />
                    </div>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: 'white' }}>Genesis Studio</h3>
                    <p style={{ color: '#a1a1aa', fontSize: '0.9rem', marginBottom: '1rem' }}>
                        Use the new Genesis Studio to create high-quality AI personas with generated prompts and profile pictures.
                    </p>
                    <button 
                        onClick={onGoHome}
                        className="premium-btn" 
                        style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}
                    >
                        Go to Genesis Studio
                    </button>
                </div>
                
                {customPersonas.length > 0 && (
                    <div style={{ marginTop: '2rem', display: 'grid', gap: '0.75rem' }}>
                        {customPersonas.map(p => (
                            <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', border: '1px solid #3f3f46' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <img src={p.image} alt={p.name} style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                                    <span style={{ fontWeight: 'bold' }}>{p.name}</span>
                                </div>
                                <button onClick={() => handleDeletePersona(p.id)} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Settings;
