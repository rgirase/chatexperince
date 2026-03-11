import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';

const Settings = ({ onBack, setCustomPersonas, customPersonas }) => {
    const [lmStudioUrl, setLmStudioUrl] = useState('');
    const [sdUrl, setSdUrl] = useState('');
    const [imageEngine, setImageEngine] = useState('a1111');
    const [comfyWorkflow, setComfyWorkflow] = useState('');
    const [newPersona, setNewPersona] = useState({ name: '', tagline: '', systemPrompt: '', initialMessage: '' });

    useEffect(() => {
        // Load existing settings
        setLmStudioUrl(localStorage.getItem('lmStudioUrl') || 'http://127.0.0.1:1234/v1');
        setSdUrl(localStorage.getItem('sdUrl') || 'http://127.0.0.1:7860');
        setImageEngine(localStorage.getItem('imageEngine') || 'a1111');
        setComfyWorkflow(localStorage.getItem('comfyWorkflow') || '');
    }, []);

    const handleSaveUrls = () => {
        localStorage.setItem('lmStudioUrl', lmStudioUrl);
        localStorage.setItem('sdUrl', sdUrl);
        localStorage.setItem('imageEngine', imageEngine);
        localStorage.setItem('comfyWorkflow', comfyWorkflow);
        alert('URLs saved successfully!');
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

    return (
        <div className="persona-list-container fade-in" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <div className="header" style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                <button className="back-btn" onClick={onBack} style={{ marginRight: '1rem' }}>
                    <ArrowLeft size={20} />
                    Back
                </button>
                <h1 style={{ margin: 0 }}>Settings</h1>
            </div>

            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <h2 style={{ marginBottom: '1.5rem', color: '#c084fc' }}>Backend Configuration</h2>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a1a1aa' }}>LM Studio API URL</label>
                    <input
                        type="text"
                        value={lmStudioUrl}
                        onChange={(e) => setLmStudioUrl(e.target.value)}
                        placeholder="http://127.0.0.1:1234/v1"
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid #3f3f46', color: 'white' }}
                    />
                    <small style={{ color: '#71717a', display: 'block', marginTop: '0.5rem' }}>The base URL for local LLM inference.</small>
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
                    </select>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a1a1aa' }}>Image API URL</label>
                    <input
                        type="text"
                        value={sdUrl}
                        onChange={(e) => setSdUrl(e.target.value)}
                        placeholder="http://127.0.0.1:7860"
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid #3f3f46', color: 'white' }}
                    />
                    <small style={{ color: '#71717a', display: 'block', marginTop: '0.5rem' }}>A1111 default: 7860 | ComfyUI default: 8188</small>
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
                    onClick={handleSaveUrls}
                    style={{ background: 'rgba(192, 132, 252, 0.2)', color: '#c084fc', border: '1px solid #c084fc', padding: '0.75rem 1.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                >
                    <Save size={18} style={{ marginRight: '8px' }} />
                    Save URLs
                </button>
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
