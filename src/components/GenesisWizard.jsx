import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Wand2, User, Image as ImageIcon, Check, ArrowRight, Loader2, RefreshCw, X, Save } from 'lucide-react';
import { generatePersonaGenesis, generateProfileImage } from '../services/llm';

const GenesisWizard = ({ onPersonaCreated, onGoHome }) => {
    const [step, setStep] = useState(1); // 1: Idea, 2: Draft, 3: Finalize
    const [idea, setIdea] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [generatedPersona, setGeneratedPersona] = useState(null);
    const [profileImage, setProfileImage] = useState(null);
    const [error, setError] = useState('');

    const handleGeneratePersona = async () => {
        if (!idea.trim()) return;
        setIsGenerating(true);
        setError('');
        try {
            const persona = await generatePersonaGenesis(idea);
            if (persona) {
                setGeneratedPersona(persona);
                setStep(2);
            } else {
                setError('The AI couldn\'t birth this persona. Try a different idea?');
            }
        } catch (e) {
            setError('Connection error. Is LM Studio running?');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateImage = async () => {
        if (!generatedPersona?.visualPrompt) return;
        setIsGeneratingImage(true);
        try {
            const img = await generateProfileImage(generatedPersona.visualPrompt, generatedPersona.name);
            if (img) {
                setProfileImage(img);
            } else {
                setError('Image generation failed. Check your SD/ComfyUI settings.');
            }
        } catch (e) {
            setError('Failed to connect to image generator.');
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const handleFinalize = () => {
        if (!generatedPersona) return;
        
        const newPersona = {
            id: 'custom_' + Date.now(),
            ...generatedPersona,
            image: profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${generatedPersona.name}`,
            gallery: profileImage ? [profileImage] : []
        };
        
        onPersonaCreated(newPersona);
    };

    return (
        <div className="persona-list-container fade-in" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', paddingBottom: '100px' }}>
            <div className="header" style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <h1 className="premium-gradient-text" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Genesis Studio</h1>
                <p style={{ color: '#a1a1aa' }}>Bring your imagination to life with AI</p>
            </div>

            <AnimatePresence mode="wait">
                {step === 1 && (
                    <motion.div 
                        key="step1"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="glass-panel"
                        style={{ padding: '2.5rem' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                            <div style={{ background: 'rgba(168, 85, 247, 0.2)', padding: '10px', borderRadius: '12px' }}>
                                <Sparkles size={24} color="#a855f7" />
                            </div>
                            <h2 style={{ margin: 0 }}>The Spark</h2>
                        </div>
                        
                        <p style={{ color: '#a1a1aa', marginBottom: '1.5rem' }}>
                            Describe the character you envision. Mention their personality, role, or any specific traits.
                        </p>
                        
                        <textarea
                            value={idea}
                            onChange={(e) => setIdea(e.target.value)}
                            placeholder="e.g. A playful college student from Mumbai who loves photography and secret adventures..."
                            rows={4}
                            style={{ 
                                width: '100%', 
                                padding: '1.25rem', 
                                borderRadius: '16px', 
                                background: 'rgba(0,0,0,0.4)', 
                                border: '1px solid #3f3f46', 
                                color: 'white',
                                fontSize: '1.1rem',
                                marginBottom: '1.5rem',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                                resize: 'none'
                            }}
                        />

                        {/* Popular Suggestions */}
                        <div style={{ marginBottom: '2rem' }}>
                            <p style={{ color: '#71717a', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Popular Suggestions</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {[
                                    "Goth Girl", "Strict Boss", "Shy Librarian", "Tsundere", 
                                    "Yandere", "Lonely Warrior", "Dragon Queen", "Elven Scout",
                                    "Trophy Assistant", "Rooftop Tease"
                                ].map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => setIdea(tag)}
                                        style={{
                                            padding: '6px 14px',
                                            borderRadius: '20px',
                                            background: idea === tag ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                            border: `1px solid ${idea === tag ? '#a855f7' : '#3f3f46'}`,
                                            color: idea === tag ? 'white' : '#a1a1aa',
                                            fontSize: '0.85rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (idea !== tag) {
                                                e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                                                e.target.style.borderColor = '#71717a';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (idea !== tag) {
                                                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                                                e.target.style.borderColor = '#3f3f46';
                                            }
                                        }}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <div style={{ 
                                background: 'rgba(239, 68, 68, 0.1)', 
                                border: '1px solid rgba(239, 68, 68, 0.2)', 
                                padding: '1rem', 
                                borderRadius: '12px', 
                                color: '#ef4444', 
                                marginBottom: '1.5rem',
                                fontSize: '0.9rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <X size={18} />
                                {error}
                            </div>
                        )}

                        <button 
                            onClick={handleGeneratePersona}
                            disabled={isGenerating || !idea.trim()}
                            className="premium-btn"
                            style={{ 
                                width: '100%', 
                                padding: '1.25rem', 
                                borderRadius: '16px', 
                                fontSize: '1.1rem',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px'
                            }}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 size={24} className="spin" />
                                    Birthing Persona...
                                </>
                            ) : (
                                <>
                                    <Wand2 size={24} />
                                    Generate Character
                                </>
                            )}
                        </button>
                    </motion.div>
                )}

                {step === 2 && generatedPersona && (
                    <motion.div 
                        key="step2"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        style={{ display: 'grid', gap: '2rem' }}
                    >
                        {/* Persona Identity Panel */}
                        <div className="glass-panel" style={{ padding: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                <div>
                                    <h2 style={{ margin: 0, color: '#a855f7' }}>{generatedPersona.name}</h2>
                                    <p style={{ color: '#d4d4d8', fontSize: '1.1rem', fontStyle: 'italic', marginTop: '4px' }}>
                                        "{generatedPersona.tagline}"
                                    </p>
                                </div>
                                <button onClick={() => setStep(1)} style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ color: '#71717a', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>System Prompt</label>
                                <div style={{ 
                                    background: 'rgba(0,0,0,0.3)', 
                                    padding: '1rem', 
                                    borderRadius: '12px', 
                                    fontSize: '0.9rem', 
                                    color: '#a1a1aa',
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                    marginTop: '8px',
                                    whiteSpace: 'pre-wrap'
                                }}>
                                    {generatedPersona.systemPrompt}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button className="back-btn" onClick={() => setStep(1)} style={{ flex: 1 }}>
                                    <RefreshCw size={18} /> Redraft
                                </button>
                                <button 
                                    className="premium-btn" 
                                    style={{ flex: 2 }}
                                    onClick={() => setStep(3)}
                                >
                                    Proceed to Visuals <ArrowRight size={18} style={{ marginLeft: '8px' }} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div 
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="glass-panel"
                        style={{ padding: '2.5rem', textAlign: 'center' }}
                    >
                        <h2 style={{ marginBottom: '1.5rem' }}>Visual Manifestation</h2>
                        
                        <div style={{ 
                            width: '200px', 
                            height: '300px', 
                            margin: '0 auto 2rem',
                            borderRadius: '24px',
                            background: 'rgba(0,0,0,0.4)',
                            border: '2px dashed rgba(168, 85, 247, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            position: 'relative'
                        }}>
                            {profileImage ? (
                                <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ color: '#71717a' }}>
                                    {isGeneratingImage ? (
                                        <Loader2 size={48} className="spin" color="#a855f7" />
                                    ) : (
                                        <User size={64} opacity={0.2} />
                                    )}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <button 
                                onClick={handleGenerateImage}
                                disabled={isGeneratingImage}
                                className="back-btn"
                                style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', border: '1px solid #a855f7' }}
                            >
                                {isGeneratingImage ? 'Painting Portrait...' : (profileImage ? 'Regenerate Photo' : 'Generate Profile Photo')}
                            </button>
                            
                            <button 
                                onClick={handleFinalize}
                                className="premium-btn"
                                style={{ padding: '1.25rem' }}
                            >
                                <Save size={20} style={{ marginRight: '8px' }} /> Bring {generatedPersona.name} to Life
                            </button>
                            
                            <button className="back-btn" onClick={() => setStep(2)}>
                                Back to Details
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GenesisWizard;
