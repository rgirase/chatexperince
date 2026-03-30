import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Wand2 } from 'lucide-react';

const SelfiePromptModal = ({ isOpen, onClose, onConfirm }) => {
    const [prompt, setPrompt] = useState("");

    const handleSubmit = () => {
        onConfirm(prompt);
        setPrompt("");
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="modal-overlay" onClick={onClose}>
                    <motion.div 
                        className="modal-content glass-panel" 
                        onClick={(e) => e.stopPropagation()}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        style={{ maxWidth: '500px' }}
                    >
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Camera className="premium-gradient-text" size={24} />
                                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Magic Selfie</h2>
                            </div>
                            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p style={{ color: '#ccc', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                Describe exactly what you want to see. The character's current appearance and location will be added automatically.
                            </p>
                            
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1rem' }}>
                                {[
                                    { label: "Bounce", text: "standing nude, heavy breasts bouncing up and down, rhythmic jiggling" },
                                    { label: "Squeeze", text: "hands reaching in and squeezing heavy breasts together, fingers digging in" },
                                    { label: "Missionary", text: " missionary position, rhythmic grinding, eye contact" },
                                    { label: "Oral Sex", text: "performing oral sex, head moving up and down, intense eye contact" },
                                    { label: "From Behind", text: "bent over, view from behind, massive cock entering, rhythmic thrusting" },
                                    { label: "Bralette Off", text: "unhooking bralette, sliding straps off shoulders, breasts falling out" },
                                    { label: "Bondage", text: "heavy breasts bound tight with rope, skin indentations, erotic" }
                                ].map((act, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setPrompt(prev => prev ? `${prev}, ${act.text}` : act.text)}
                                        style={{
                                            background: 'rgba(251, 191, 36, 0.1)',
                                            border: '1px solid rgba(251, 191, 36, 0.2)',
                                            color: '#fbbf24',
                                            padding: '4px 10px',
                                            borderRadius: '8px',
                                            fontSize: '0.75rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            fontWeight: '600'
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(251, 191, 36, 0.2)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(251, 191, 36, 0.1)'; }}
                                    >
                                        {act.label}
                                    </button>
                                ))}
                            </div>

                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Example: wearing a tight red dress, sitting on a leather sofa, looking seductive..."
                                style={{
                                    width: '100%',
                                    background: 'rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    color: 'white',
                                    padding: '1rem',
                                    height: '100px',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    resize: 'none',
                                    marginBottom: '1.5rem'
                                }}
                                autoFocus
                            />
                            <button 
                                onClick={handleSubmit}
                                className="premium-gradient-btn"
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    background: 'var(--user-msg-bg)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    cursor: 'pointer'
                                }}
                            >
                                <Wand2 size={20} /> Generate Magic Photo
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default SelfiePromptModal;
