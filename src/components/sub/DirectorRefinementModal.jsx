import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wand2, Sliders, Target, Sparkles, Image as ImageIcon, Info, Zap } from 'lucide-react';

const DirectorRefinementModal = ({ 
    isOpen, 
    onClose, 
    targetImage, 
    onConfirm, 
    persona 
}) => {
    const [strength, setStrength] = useState(0.4);
    const [instruction, setInstruction] = useState('');
    const [aspectRatio, setAspectRatio] = useState('portrait');

    if (!isOpen || !targetImage) return null;

    const handleConfirm = () => {
        // Construct the refinement prompt
        const prompt = instruction ? `(Refined: ${instruction}:1.3), ${persona.tagline}` : persona.tagline;
        onConfirm(targetImage.url, prompt, strength, targetImage.id);
        onClose();
    };

    return (
        <AnimatePresence>
            <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="modal-content glass-panel director-console" 
                    onClick={e => e.stopPropagation()} 
                    style={{ maxWidth: '600px', width: '95%', border: '1px solid rgba(168, 85, 247, 0.3)' }}
                >
                    <div className="modal-header">
                        <h2 className="premium-gradient-text" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Wand2 size={24} /> DIRECTOR'S CONSOLE
                        </h2>
                        <button className="close-btn" onClick={onClose}><X size={20} /></button>
                    </div>

                    <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        
                        {/* Preview Section */}
                        <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: '#000' }}>
                            <img 
                                src={targetImage.url} 
                                alt="Original" 
                                style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', display: 'block' }} 
                            />
                            <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                                SOURCE COMPOSITION
                            </div>
                        </div>

                        {/* Analysis Note */}
                        <div style={{ padding: '12px', background: 'rgba(168, 85, 247, 0.05)', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.1)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            <Info size={18} style={{ color: '#a855f7', flexShrink: 0 }} />
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#a1a1aa', lineHeight: '1.4' }}>
                                Refinement uses <span style={{ color: '#fff', fontWeight: 'bold' }}>Img2Img</span> tech to re-render the scene. Higher strength values allow the AI to deviate more from the original layout to fix errors or change details.
                            </p>
                        </div>

                        {/* Refinement Strength */}
                        <section>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--primary-color)' }}>
                                    <Sliders size={16} /> REFINEMENT STRENGTH
                                </label>
                                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>
                                    {strength < 0.3 ? "Subtle Touch-up" : strength < 0.5 ? "Detailed Fix" : "Scene Evolution"} ({strength})
                                </span>
                            </div>
                            <input 
                                type="range" 
                                min="0.1" 
                                max="0.75" 
                                step="0.05"
                                value={strength} 
                                onChange={(e) => setStrength(parseFloat(e.target.value))}
                                className="intensity-slider"
                                style={{ width: '100%' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                                <span>Preserve Identity</span>
                                <span>Re-imagine Scene</span>
                            </div>
                        </section>

                        {/* Instruction Injection */}
                        <section>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--primary-color)' }}>
                                <Target size={16} /> REFINEMENT DIRECTIVE
                            </label>
                            <textarea 
                                value={instruction}
                                onChange={(e) => setInstruction(e.target.value)}
                                placeholder="Example: fix hands, change outfit to a blue dress, add more jewelry, more realistic eyes..."
                                style={{
                                    width: '100%',
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px',
                                    padding: '12px',
                                    color: '#fff',
                                    fontSize: '0.9rem',
                                    fontFamily: 'inherit',
                                    minHeight: '80px',
                                    resize: 'none',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'rgba(168, 85, 247, 0.5)'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                            />
                        </section>

                    </div>

                    <div className="modal-footer" style={{ marginTop: '20px' }}>
                        <button 
                            className="send-btn" 
                            style={{ 
                                width: '100%', 
                                borderRadius: '12px', 
                                height: '48px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                gap: '10px',
                                fontSize: '1rem',
                                background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)'
                            }} 
                            onClick={handleConfirm}
                        >
                            <Zap size={18} /> INITIATE REFINEMENT
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default DirectorRefinementModal;
