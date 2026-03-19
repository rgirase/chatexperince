import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, Trash2, Home, RefreshCw } from 'lucide-react';
import { fetchAvailableModels } from '../services/llm';

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
            
            // Auto-select first model if current is default/invalid and models are available
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
        
        // Save user profile
        localStorage.setItem('userName', userName);
        localStorage.setItem('userAppearance', userAppearance);
        localStorage.setItem('userBackground', userBackground);
        
        // Save endpoints
        localStorage.setItem('lmSavedEndpoints', JSON.stringify(lmSavedEndpoints));
        localStorage.setItem('sdSavedEndpoints', JSON.stringify(sdSavedEndpoints));
        
        setSaveToast('✅ Settings saved!');
        setTimeout(() => setSaveToast(''), 3000);
    };

    const handleResetToDefaults = () => {
        if (window.confirm("Reset all settings to system defaults? This will clear your custom URLs and user profile.")) {
            localStorage.clear();
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
        const urlBase = url.replace(/\/$/, '');
        let testUrl = type === 'lm' 
            ? `${urlBase}/models` 
            : (imageEngine === 'comfyui' ? `${urlBase}/system_stats` : `${urlBase}/sdapi/v1/options`);

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

    const handleTestLmStudio = () => testEndpoint('lm', lmStudioUrl);
    const handleTestSd = () => testEndpoint('sd', sdUrl);

    const [isTroubleshooting, setIsTroubleshooting] = useState(false);
    const [troubleshootLog, setTroubleshootLog] = useState([]);

    const runTroubleshooter = async () => {
        setIsTroubleshooting(true);
        setTroubleshootLog([{ type: 'info', msg: 'Starting diagnostic...' }]);
        
        const log = (msg, type = 'info') => setTroubleshootLog(prev => [...prev, { type, msg }]);

        const fetchWithTimeout = async (url, options = {}, timeout = 5000) => {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), timeout);
            try {
                const response = await fetch(url, { ...options, signal: controller.signal });
                clearTimeout(id);
                return response;
            } catch (e) {
                clearTimeout(id);
                throw e;
            }
        };

        try {
            // 1. Basic Reachability
            log(`Testing reachability for ${sdUrl}...`);
            const startTime = Date.now();
            let isReachable = false;
            try {
                await fetchWithTimeout(sdUrl, { mode: 'no-cors' }, 3000);
                isReachable = true;
                log(`Reachability OK (${Date.now() - startTime}ms)`);
            } catch (e) {
                if (sdUrl.includes(':8000')) {
                    const altUrl = sdUrl.replace(':8000', ':8188');
                    log(`8000 slow/failed. Probing 8188...`);
                    try {
                        await fetchWithTimeout(altUrl, { mode: 'no-cors' }, 3000);
                        log(`PORT MISMATCH: Detected ComfyUI on 8188! Update your URL.`, 'warning');
                        isReachable = true;
                    } catch (e2) {}
                }
                
                if (!isReachable) {
                    log(`URL unreachable or timed out.`, 'error');
                    if (sdUrl.includes('192.168.')) log('TIP: You are using local IP. If on PC, try 127.0.0.1.', 'info');
                    log(`Your Tailscale IP is: 100.87.53.100`, 'info');
                }
            }

            // 2. ComfyUI API & Model Check
            if (isReachable && imageEngine === 'comfyui') {
                log('Checking ComfyUI API & Models...');
                let availableCheckpoints = [];
                try {
                    const objInfo = await fetchWithTimeout(`${sdUrl.replace(/\/$/, '')}/object_info`, {}, 5000);
                    if (objInfo.ok) {
                        const data = await objInfo.json();
                        availableCheckpoints = data.CheckpointLoaderSimple?.input?.required?.ckpt_name?.[0] || [];
                        log(`ComfyUI Connected. Found ${availableCheckpoints.length} checkpoints.`);
                        
                        const targetModel = "Juggernaut-XL_v9.safetensors";
                        if (availableCheckpoints.length > 0 && !availableCheckpoints.includes(targetModel)) {
                            log(`MODEL MISSING: "${targetModel}" not found in your models/checkpoints folder.`, 'error');
                            log(`Available: ${availableCheckpoints.slice(0, 3).join(', ')}...`, 'info');
                            log(`TIP: Rename your SDXL model to "${targetModel}" or download it from CivitAI.`, 'warning');
                        } else if (availableCheckpoints.length > 0) {
                            log(`Verified model "${targetModel}" is available.`, 'success');
                        }
                    }
                } catch (e) {
                    log('API Check timed out or failed.', 'error');
                }

                // 3. History Deep Dive
                log('Checking recent generation history...');
                try {
                    const hist = await fetchWithTimeout(`${sdUrl.replace(/\/$/, '')}/history?count=5`, {}, 5000);
                    const data = await hist.json();
                    const promptIds = Object.keys(data);
                    if (promptIds.length > 0) {
                        const lastId = promptIds[promptIds.length - 1];
                        const lastTask = data[lastId];
                        
                        // Check if prompt has the required output nodes (9 or 14 typically)
                        const promptNodes = Object.keys(lastTask.prompt?.[2] || {});
                        if (!promptNodes.includes("9") && !promptNodes.includes("14")) {
                            log('ERROR: Your workflow is missing the SaveImage node (ID 9). Click "Reset Workflow" below to fix!', 'error');
                        }

                        if (lastTask.status?.completed) {
                            const hasImages = Object.values(lastTask.outputs || {}).some(o => o.images && o.images.length > 0);
                            if (hasImages) {
                                log('Last task was SUCCESSFUL and produced images.', 'success');
                            } else {
                                log('Last task finished but NO IMAGES were produced.', 'error');
                                
                                // NEW: Extra check for ComfyUI node errors in status.messages
                                if (lastTask.status?.messages) {
                                    lastTask.status.messages.forEach(msg => {
                                        if (msg[0] === 'execution_error') {
                                            log(`EXECUTION ERROR: ${JSON.stringify(msg[1]?.exception_message || msg[1])}`, 'error');
                                        }
                                    });
                                }

                                // Deep introspection
                                const nodeNames = Object.keys(lastTask.outputs || {}).join(', ');
                                log(`Detected output nodes: ${nodeNames || 'NONE'}`, 'info');
                                
                                if (!nodeNames) {
                                    log("RAW DATA (First 1000 chars):", 'warning');
                                    log(JSON.stringify(lastTask).substring(0, 1000) + '...', 'info');
                                }
                                
                                for(const nid in lastTask.outputs || {}) {
                                    const nodeOut = lastTask.outputs[nid];
                                    if(nodeOut.images) log(`Node ${nid} has 'images' but length is ${nodeOut.images.length}`, 'warning');
                                    if(nodeOut.error) log(`Node ${nid} ERROR: ${JSON.stringify(nodeOut.error)}`, 'error');
                                }
                                
                                console.log("COMFYUI_DIAGNOSTIC_HISTORY:", lastTask);
                            }
                        }
                    } else {
                        log('No task history found. Try requesting a selfie first.', 'info');
                    }
                } catch (e) {
                    log('Could not fetch history.', 'error');
                }
            }
        } catch (globalErr) {
            log(`Diagnostics interrupted: ${globalErr.message}`, 'error');
        } finally {
            setIsTroubleshooting(false);
        }
    };

    const handleAddPersona = () => {
        if (!newPersona.name || !newPersona.systemPrompt) {
            alert("Name and System Prompt are required.");
            return;
        }

        const id = 'custom_' + Date.now();
        const persona = {
            id,
            name: newPersona.name,
            tagline: newPersona.tagline || 'A custom persona',
            image: `https://api.dicebear.com/7.x/initials/svg?seed=${newPersona.name}`,
            systemPrompt: newPersona.systemPrompt,
            initialMessage: newPersona.initialMessage || '*Looks at you* Hello...'
        };

        const updatedPersonas = [...customPersonas, persona];
        setCustomPersonas(updatedPersonas);
        localStorage.setItem('customPersonas', JSON.stringify(updatedPersonas));

        setNewPersona({ name: '', tagline: '', systemPrompt: '', initialMessage: '' });
        alert(`${persona.name} added to your roster!`);
    };

    const handleDeletePersona = (id) => {
        const updated = customPersonas.filter(p => p.id !== id);
        setCustomPersonas(updated);
        localStorage.setItem('customPersonas', JSON.stringify(updated));
        localStorage.removeItem(`chat_${id}`);
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
                        <button onClick={handleTestLmStudio} style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid #22c55e', cursor: 'pointer' }}>
                            Test
                        </button>
                    </div>
                    
                    {/* LM Saved Endpoints */}
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
                        <button onClick={handleTestSd} style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid #22c55e', cursor: 'pointer' }}>
                            Test
                        </button>
                    </div>
                    
                    {/* SD Saved Endpoints */}
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

            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <h2 style={{ marginBottom: '1.5rem', color: '#c084fc' }}>Mobile & Tailscale Connectivity</h2>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', border: '1px solid #27272a' }}>
                    <ol style={{ color: '#a1a1aa', paddingLeft: '1.2rem', lineHeight: '1.8' }}>
                        <li><strong>Local Wi-Fi</strong>: Ensure phone and PC are on the same SSID. PC IP: <code>192.168.86.28</code>.</li>
                        <li><strong>Tailscale</strong>: If using Tailscale, use your <strong>Tailnet IP</strong> (100.x.x.x) in the URL fields above instead of the local IP.</li>
                        <li><strong>ComfyUI Remote Access</strong>: You <u>must</u> start ComfyUI with the <code>--listen 0.0.0.0</code> flag to allow outside connections.</li>
                        <li><strong>LM Studio CORS</strong>: Set <strong>CORS to ON</strong> in LM Studio's server settings.</li>
                        <li><strong>Firewall</strong>: Allow inbound traffic on ports <strong>5173, 8000, 1234</strong> in Windows Defender.</li>
                    </ol>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '2rem' }}>
                <h2 style={{ marginBottom: '1.5rem', color: '#c084fc' }}>Connection Troubleshooter</h2>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', border: '1px solid #27272a' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                        <button 
                            onClick={runTroubleshooter} 
                            disabled={isTroubleshooting}
                            style={{ flex: '1 1 200px', padding: '0.75rem', borderRadius: '8px', background: 'rgba(192, 132, 252, 0.2)', color: '#c084fc', border: '1px solid #c084fc', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            {isTroubleshooting ? 'Running...' : '🔍 Launch Troubleshooter'}
                        </button>
                        <button 
                            onClick={() => { setSdUrl('http://127.0.0.1:8188'); setSaveToast('📍 Switched to Localhost!'); setTimeout(() => setSaveToast(''), 3000); }}
                            style={{ flex: '1 1 100px', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#a1a1aa', border: '1px solid #3f3f46', cursor: 'pointer', fontSize: '0.75rem' }}
                        >
                            Try Localhost
                        </button>
                        <button 
                            onClick={() => { setSdUrl('http://100.87.53.100:8188'); setSaveToast('🌐 Switched to Tailscale!'); setTimeout(() => setSaveToast(''), 3000); }}
                            style={{ flex: '1 1 100px', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#a1a1aa', border: '1px solid #3f3f46', cursor: 'pointer', fontSize: '0.75rem' }}
                        >
                            Try Tailnet
                        </button>
                        <button 
                            onClick={async () => {
                                if(window.confirm("Reset ComfyUI Workflow to factory default? This will SAVE immediately.")) {
                                    const workflowStr = JSON.stringify(DEFAULT_COMFY_WORKFLOW, null, 2);
                                    setComfyWorkflow(workflowStr);
                                    localStorage.setItem('comfyWorkflow', workflowStr);
                                    setSaveToast('🔄 Workflow Reset & SAVED!');
                                    setTimeout(() => setSaveToast(''), 3000);
                                }
                            }}
                            style={{ flex: '1 1 100px', padding: '0.75rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                        >
                            Reset Workflow
                        </button>
                    </div>
                    
                    {troubleshootLog.length > 0 && (
                        <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#09090b', borderRadius: '8px', border: '1px solid #3f3f46', maxHeight: '300px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                            {troubleshootLog.map((item, idx) => (
                                <div key={idx} style={{ marginBottom: '0.4rem', color: item.type === 'error' ? '#ef4444' : (item.type === 'success' ? '#22c55e' : (item.type === 'warning' ? '#f59e0b' : '#a1a1aa')) }}>
                                    {item.type === 'success' ? '✅ ' : (item.type === 'error' ? '❌ ' : (item.type === 'warning' ? '⚠️ ' : 'ℹ️ '))}
                                    {item.msg}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '2rem', marginTop: '2rem' }}>
                <h2 style={{ marginBottom: '1.5rem', color: '#c084fc' }}>Custom Personas</h2>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', border: '1px solid #27272a' }}>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <input type="text" placeholder="Name" value={newPersona.name} onChange={(e) => setNewPersona({ ...newPersona, name: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', border: '1px solid #3f3f46', color: 'white' }} />
                        <textarea placeholder="System Prompt" value={newPersona.systemPrompt} onChange={(e) => setNewPersona({ ...newPersona, systemPrompt: e.target.value })} rows={3} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', border: '1px solid #3f3f46', color: 'white', resize: 'vertical' }} />
                        <button onClick={handleAddPersona} style={{ background: 'rgba(192, 132, 252, 0.2)', color: '#c084fc', border: '1px solid #c084fc', padding: '0.75rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 'bold' }}>
                            <Plus size={18} style={{ marginRight: '8px' }} /> Create Persona
                        </button>
                    </div>
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
