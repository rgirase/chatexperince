import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, Trash2, Home, RefreshCw } from 'lucide-react';
import { fetchAvailableModels } from '../services/llm';

const DEFAULT_LM_STUDIO = 'http://192.168.1.233:1234/v1';
const DEFAULT_SD_URL = 'http://127.0.0.1:7860';

const Settings = ({ onBack, onGoHome, setCustomPersonas, customPersonas }) => {
    const [lmStudioUrl, setLmStudioUrl] = useState('');
    const [savedServers, setSavedServers] = useState([]);
    const [newServerName, setNewServerName] = useState('');
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

    useEffect(() => {
        // Load existing settings
        setLmStudioUrl(localStorage.getItem('lmStudioUrl') || DEFAULT_LM_STUDIO);
        setSdUrl(localStorage.getItem('sdUrl') || DEFAULT_SD_URL);
        setImageEngine(localStorage.getItem('imageEngine') || 'a1111');
        setLmStudioModel(localStorage.getItem('lmStudioModel') || 'local-model');
        setComfyWorkflow(localStorage.getItem('comfyWorkflow') || '');
        setPreferredLanguage(localStorage.getItem('preferredIndianLanguage') || 'english');
        
        // Load user profile
        setUserName(localStorage.getItem('userName') || '');
        setUserAppearance(localStorage.getItem('userAppearance') || '');
        setUserBackground(localStorage.getItem('userBackground') || '');

        // Load saved servers
        const servers = JSON.parse(localStorage.getItem('savedServers') || '[]');
        setSavedServers(servers);

        // Fetch models if URL exists
        const initialUrl = localStorage.getItem('lmStudioUrl') || DEFAULT_LM_STUDIO;
        if (initialUrl) {
            loadModels(initialUrl);
        }
    }, []);

    const loadModels = async (url) => {
        setIsLoadingModels(true);
        try {
            const models = await fetchAvailableModels();
            setAvailableModels(models);
            
            // Auto-select first model if current is default/invalid and models are available
            if (models.length > 0) {
                const currentModel = localStorage.getItem('lmStudioModel');
                if (!currentModel || currentModel === 'local-model') {
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
        localStorage.setItem('lmStudioUrl', lmStudioUrl || DEFAULT_LM_STUDIO);
        localStorage.setItem('sdUrl', sdUrl || DEFAULT_SD_URL);
        localStorage.setItem('imageEngine', imageEngine);
        localStorage.setItem('lmStudioModel', lmStudioModel);
        localStorage.setItem('comfyWorkflow', comfyWorkflow);
        localStorage.setItem('preferredIndianLanguage', preferredLanguage);
        
        // Save user profile
        localStorage.setItem('userName', userName);
        localStorage.setItem('userAppearance', userAppearance);
        localStorage.setItem('userBackground', userBackground);
        
        // Save servers
        localStorage.setItem('savedServers', JSON.stringify(savedServers));
        
        setSaveToast('✅ Settings and User Profile saved!');
        setTimeout(() => setSaveToast(''), 3000);
    };

    const handleAddServer = () => {
        if (!newServerName || !lmStudioUrl) {
            alert("Name and URL are required to save a server profile.");
            return;
        }
        const newServer = { id: Date.now(), name: newServerName, url: lmStudioUrl };
        const updated = [...savedServers, newServer];
        setSavedServers(updated);
        localStorage.setItem('savedServers', JSON.stringify(updated));
        setNewServerName('');
        setSaveToast(`✅ Server "${newServerName}" saved!`);
        setTimeout(() => setSaveToast(''), 3000);
    };

    const handleConnectServer = (url) => {
        setLmStudioUrl(url);
        localStorage.setItem('lmStudioUrl', url);
        loadModels(url); // Auto-load models for the new server
        setSaveToast('✅ Connected! Model list updated.');
        setTimeout(() => setSaveToast(''), 3000);
    };

    const handleDeleteServer = (id) => {
        const updated = savedServers.filter(s => s.id !== id);
        setSavedServers(updated);
        localStorage.setItem('savedServers', JSON.stringify(updated));
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
            image: `https://api.dicebear.com/7.x/initials/svg?seed=${newPersona.name}`, // Fallback avatar
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
        localStorage.removeItem(`chat_${id}`); // Clean up chat history
    };

    const handleTestLmStudio = async () => {
        try {
            const res = await fetch(`${lmStudioUrl.replace(/\/$/, '')}/models`);
            if (res.ok) {
                const data = await res.json();
                setAvailableModels(data.data || []);
                alert("✅ Success: LM Studio is connected and responding!");
            } else {
                alert(`❌ LM Studio returned error: ${res.status}`);
            }
        } catch (e) {
            alert(`❌ LM Studio Connection Failed: ${e.message}\n\nTroubleshooting:\n1. Ensure LM Studio is RUNNING.\n2. Enable "CORS: On" in LM Studio Server settings.\n3. Verify the URL matches exactly.`);
        }
    };

    const handleTestSd = async () => {
        const urlBase = sdUrl.replace(/\/$/, '');
        let testUrl = `${urlBase}/sdapi/v1/options`; // Default for A1111 / Draw Things
        
        if (imageEngine === 'comfyui') testUrl = `${urlBase}/system_stats`;
        if (imageEngine === 'diffusionbee') testUrl = `${urlBase}/status`;

        try {
            const res = await fetch(testUrl);
            if (res.ok) {
                alert(`✅ Success: ${imageEngine.toUpperCase()} is connected!`);
            } else {
                alert(`❌ ${imageEngine.toUpperCase()} returned status: ${res.status}`);
            }
        } catch (e) {
            alert(`❌ Connection Failed: ${e.message}\n\nPotential Causes:\n1. Server is not running.\n2. CORS is blocking the request (especially in Draw Things).\n3. Wrong URL or Port.\n4. If using mobile, ensure you use your Computer's IP (not 127.0.0.1).`);
        }
    };

    return (
        <div className="persona-list-container fade-in" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            {/* Toast Notification */}
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
                  title="Go to Home"
                >
                    <Home size={20} />
                </button>
            </div>

            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <h2 style={{ marginBottom: '1.5rem', color: '#c084fc' }}>Backend Configuration</h2>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a1a1aa' }}>LM Studio API URL</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="text"
                            value={lmStudioUrl}
                            onChange={(e) => setLmStudioUrl(e.target.value)}
                            placeholder="http://192.168.1.233:1234/v1"
                            style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid #3f3f46', color: 'white' }}
                        />
                        <button 
                            onClick={handleTestLmStudio}
                            style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid #22c55e', cursor: 'pointer' }}
                        >
                            Test
                        </button>
                    </div>
                    <small style={{ color: '#71717a', display: 'block', marginTop: '0.5rem' }}>The active server URL used for chat.</small>

                    <div style={{ marginTop: '1.5rem' }}>
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
                            <button 
                                onClick={() => loadModels(lmStudioUrl)}
                                disabled={isLoadingModels}
                                style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(192, 132, 252, 0.1)', color: '#c084fc', border: '1px solid #c084fc', cursor: 'pointer' }}
                                title="Refresh model list"
                            >
                                <RefreshCw size={18} className={isLoadingModels ? 'spin' : ''} />
                            </button>
                        </div>
                        <small style={{ color: '#71717a', display: 'block', marginTop: '0.5rem' }}>Select the model currently loaded in LM Studio.</small>
                    </div>
                    
                    <div style={{ marginTop: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid #27272a' }}>
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: '#c084fc' }}>Quick Save Current Server</h4>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="text"
                                value={newServerName}
                                onChange={(e) => setNewServerName(e.target.value)}
                                placeholder="Nickname (e.g., Office Mac)"
                                style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid #3f3f46', color: 'white', fontSize: '0.9rem' }}
                            />
                            <button onClick={handleAddServer} style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: 'rgba(192, 132, 252, 0.2)', color: '#c084fc', border: '1px solid #c084fc', cursor: 'pointer', fontSize: '0.9rem' }}>
                                Save Profile
                            </button>
                        </div>
                    </div>

                    {savedServers.length > 0 && (
                        <div style={{ marginTop: '1rem' }}>
                            <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: '#a1a1aa' }}>Saved Server Profiles</h4>
                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                {savedServers.map(server => (
                                    <div key={server.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', border: '1px solid #3f3f46' }}>
                                        <div style={{ overflow: 'hidden' }}>
                                            <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{server.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#71717a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{server.url}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button 
                                                onClick={() => handleConnectServer(server.url)}
                                                style={{ padding: '0.35rem 0.75rem', borderRadius: '4px', background: lmStudioUrl === server.url ? '#c084fc' : 'rgba(192, 132, 252, 0.1)', color: lmStudioUrl === server.url ? 'black' : '#c084fc', border: '1px solid #c084fc', cursor: 'pointer', fontSize: '0.75rem' }}
                                            >
                                                {lmStudioUrl === server.url ? 'Active' : 'Connect'}
                                            </button>
                                            <button onClick={() => handleDeleteServer(server.id)} style={{ padding: '0.35rem', color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
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

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a1a1aa' }}>Image API URL</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="text"
                            value={sdUrl}
                            onChange={(e) => setSdUrl(e.target.value)}
                            placeholder="http://127.0.0.1:7860"
                            style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid #3f3f46', color: 'white' }}
                        />
                        <button 
                            onClick={handleTestSd}
                            style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid #22c55e', cursor: 'pointer' }}
                        >
                            Test
                        </button>
                    </div>
                    <small style={{ color: '#71717a', display: 'block', marginTop: '0.5rem' }}>A1111: 7860 | ComfyUI: 8188 | Diffusion Bee: 1111</small>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a1a1aa' }}>Preferred Indian Language</label>
                    <select
                        value={preferredLanguage}
                        onChange={(e) => setPreferredLanguage(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid #3f3f46', color: 'white' }}
                    >
                        <option value="english">English (Default)</option>
                        <option value="hindi">Hindi</option>
                        <option value="marathi">Marathi</option>
                    </select>
                    <small style={{ color: '#71717a', display: 'block', marginTop: '0.5rem' }}>Forces Indian characters to respond in the selected language.</small>
                </div>

                {imageEngine === 'comfyui' && (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a1a1aa' }}>ComfyUI Workflow JSON (API Format)</label>
                        <textarea
                            value={comfyWorkflow}
                            onChange={(e) => setComfyWorkflow(e.target.value)}
                            placeholder='Paste your ComfyUI API JSON here. Within the text node you use for prompts, put exactly: __PROMPT__'
                            rows={8}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid #3f3f46', color: 'white', fontFamily: 'monospace', fontSize: '0.8rem', resize: 'vertical' }}
                        />
                        <small style={{ color: '#71717a', display: 'block', marginTop: '0.5rem' }}>Enable "Enable Dev mode Options" in ComfyUI settings, click "Save (API Format)", and paste here. Replace your text prompt with <strong>__PROMPT__</strong>.</small>
                    </div>
                )}

                <button
                    onClick={handleSaveSettings}
                    style={{ background: 'rgba(192, 132, 252, 0.2)', color: '#c084fc', border: '1px solid #c084fc', padding: '0.75rem 1.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '1.5rem' }}
                >
                    <Save size={18} style={{ marginRight: '8px' }} />
                    Save All Settings
                </button>
            </div>

            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <h2 style={{ marginBottom: '1.5rem', color: '#c084fc' }}>User Profile (Who are you?)</h2>
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a1a1aa' }}>Your Name</label>
                    <input
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="e.g., Rahul"
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid #3f3f46', color: 'white' }}
                    />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a1a1aa' }}>Your Appearance</label>
                    <textarea
                        value={userAppearance}
                        onChange={(e) => setUserAppearance(e.target.value)}
                        placeholder="Describe your height, build, hair style, etc."
                        rows={2}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid #3f3f46', color: 'white', resize: 'vertical' }}
                    />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a1a1aa' }}>Your Role / Background</label>
                    <textarea
                        value={userBackground}
                        onChange={(e) => setUserBackground(e.target.value)}
                        placeholder="What do you do? What is your status? (e.g. A wealthy businessman, a fitness enthusiast, his favorite student)"
                        rows={2}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid #3f3f46', color: 'white', resize: 'vertical' }}
                    />
                </div>
                <button
                    onClick={handleSaveSettings}
                    style={{ background: 'rgba(192, 132, 252, 0.2)', color: '#c084fc', border: '1px solid #c084fc', padding: '0.75rem 1.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                >
                    <Save size={18} style={{ marginRight: '8px' }} />
                    Save Profile
                </button>
            </div>

            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <h2 style={{ marginBottom: '1.5rem', color: '#c084fc' }}>Android / Mobile Connectivity</h2>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px', border: '1px solid #27272a' }}>
                    <p style={{ color: '#f3f4f6', marginBottom: '1rem' }}>To use this app on your Android device:</p>
                    <ol style={{ color: '#a1a1aa', paddingLeft: '1.2rem', lineHeight: '1.6' }}>
                        <li>Ensure your PC and Android are on the <strong>same Wi-Fi network</strong>.</li>
                        <li>Find your PC's IP address (e.g., <code>192.168.1.XX</code>).</li>
                        <li>Open Chrome on Android and visit <code>http://[YOUR-IP]:5173</code>.</li>
                        <li><strong>CORS Note:</strong> In LM Studio, go to Server settings and set <strong>CORS: On</strong> to allow the connection.</li>
                        <li><strong>Install as App:</strong> Tap the Chrome menu (⋮) and select "Install app" for a native Android look!</li>
                    </ol>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '2rem' }}>
                <h2 style={{ marginBottom: '1.5rem', color: '#c084fc' }}>Custom Personas</h2>

                {customPersonas.length > 0 && (
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1rem', color: '#a1a1aa', marginBottom: '1rem' }}>Your Created Personas</h3>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {customPersonas.map(p => (
                                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid #3f3f46' }}>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <img src={p.image} alt={p.name} style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '1rem' }} />
                                        <span>{p.name}</span>
                                    </div>
                                    <button onClick={() => handleDeletePersona(p.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px', border: '1px solid #27272a' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Create New Persona</h3>

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <input
                            type="text" placeholder="Name (e.g., Jessica)" value={newPersona.name}
                            onChange={(e) => setNewPersona({ ...newPersona, name: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', border: '1px solid #3f3f46', color: 'white' }}
                        />
                        <input
                            type="text" placeholder="Tagline (e.g., The spunky barista from downtown)" value={newPersona.tagline}
                            onChange={(e) => setNewPersona({ ...newPersona, tagline: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', border: '1px solid #3f3f46', color: 'white' }}
                        />
                        <textarea
                            placeholder="Initial Message (Optional)" value={newPersona.initialMessage}
                            onChange={(e) => setNewPersona({ ...newPersona, initialMessage: e.target.value })}
                            rows={2}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', border: '1px solid #3f3f46', color: 'white', resize: 'vertical' }}
                        />
                        <textarea
                            placeholder="System Prompt (Define personality, behavior, rules here...)" value={newPersona.systemPrompt}
                            onChange={(e) => setNewPersona({ ...newPersona, systemPrompt: e.target.value })}
                            rows={4}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', border: '1px solid #3f3f46', color: 'white', resize: 'vertical' }}
                        />
                        <button
                            onClick={handleAddPersona}
                            style={{ background: 'rgba(192, 132, 252, 0.2)', color: '#c084fc', border: '1px solid #c084fc', padding: '0.75rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        >
                            <Plus size={18} style={{ marginRight: '8px' }} />
                            Create Persona
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
