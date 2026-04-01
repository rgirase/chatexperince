import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame, Zap, Droplets, Heart, Shirt, Palette } from 'lucide-react';
import { AVAILABLE_PONY_MODELS } from '../../config';
import { ADULT_ACTIONS } from '../../data/adultActions';
import { CLOTHING_TYPES, COLORS } from '../../data/imageGenOptions';

const AdultActionsModal = ({ isOpen, onClose, onConfirm, relationshipScore }) => {
    const [selectedModel, setSelectedModel] = useState(localStorage.getItem('lastSelectedPonyModel') || "realismByStableYogi_ponyV3VAE.safetensors");
    const [selectedClothing, setSelectedClothing] = useState('none');
    const [selectedColor, setSelectedColor] = useState('none');
    const [hoveredAction, setHoveredAction] = useState(null);

    const handleActionClick = (action) => {
        // Pass the new clothing and color options to the confirmation handler
        onConfirm(action, selectedModel, selectedClothing, selectedColor);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
                    <motion.div 
                        className="modal-content glass-panel" 
                        onClick={(e) => e.stopPropagation()}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        style={{ maxWidth: '500px', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                    >
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Flame className="premium-gradient-text" style={{ color: '#ef4444' }} size={24} />
                                <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#ef4444' }}>Erotic Actions</h2>
                            </div>
                            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                            <p style={{ color: '#ccc', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                                Trigger a high-intensity erotic generation. Character response and image will be generated in real-time.
                            </p>

                            {/* OUTFIT CUSTOMIZATION */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div>
                                    <div style={{ color: '#fbbf24', fontSize: '0.75rem', marginBottom: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <Shirt size={14} /> STYLE
                                    </div>
                                    <select 
                                        value={selectedClothing}
                                        onChange={(e) => setSelectedClothing(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '8px 10px',
                                            borderRadius: '8px',
                                            background: 'rgba(0,0,0,0.5)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            color: 'white',
                                            fontSize: '0.85rem',
                                            outline: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {CLOTHING_TYPES.map(type => (
                                            <option key={type.id} value={type.id} style={{ background: '#1e1e2e' }}>{type.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <div style={{ color: '#60a5fa', fontSize: '0.75rem', marginBottom: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <Palette size={14} /> COLOR
                                    </div>
                                    <select 
                                        value={selectedColor}
                                        onChange={(e) => setSelectedColor(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '8px 10px',
                                            borderRadius: '8px',
                                            background: 'rgba(0,0,0,0.5)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            color: 'white',
                                            fontSize: '0.85rem',
                                            outline: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {COLORS.map(color => (
                                            <option key={color.id} value={color.id} style={{ background: '#1e1e2e' }}>{color.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* CORE ENGINE SELECTOR */}
                            <div style={{ marginBottom: '1.5rem', background: 'rgba(239, 68, 68, 0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                                <div style={{ color: '#ef4444', fontSize: '0.75rem', marginBottom: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <Zap size={14} /> CORE ENGINE
                                </div>
                                <select 
                                    value={selectedModel}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setSelectedModel(val);
                                        localStorage.setItem('lastSelectedPonyModel', val);
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        background: 'rgba(0,0,0,0.5)',
                                        border: '1px solid rgba(239, 68, 68, 0.2)',
                                        color: 'white',
                                        fontSize: '0.9rem',
                                        outline: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {AVAILABLE_PONY_MODELS.map(model => (
                                        <option key={model.id} value={model.id} style={{ background: '#1e1e2e', color: 'white' }}>
                                            {model.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* ACTIONS GRID */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '1rem' }}>
                                {ADULT_ACTIONS.map((action) => {
                                    // Visual lock logic representation (unlocked for now as per user request to "go ahead")
                                    const isLocked = false; 

                                    return (
                                        <button
                                            key={action.id}
                                            onClick={() => handleActionClick(action)}
                                            onMouseEnter={() => setHoveredAction(action)}
                                            onMouseLeave={() => setHoveredAction(null)}
                                            style={{
                                                padding: '12px',
                                                borderRadius: '12px',
                                                background: hoveredAction?.id === action.id ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.08)',
                                                border: `1px solid ${hoveredAction?.id === action.id ? 'rgba(239, 68, 68, 0.5)' : 'rgba(239, 68, 68, 0.2)'}`,
                                                color: 'white',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '8px',
                                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                transform: hoveredAction?.id === action.id ? 'translateY(-2px)' : 'none',
                                                boxShadow: hoveredAction?.id === action.id ? '0 4px 12px rgba(239, 68, 68, 0.15)' : 'none'
                                            }}
                                        >
                                            <span style={{ fontSize: '1.5rem' }}>{action.icon}</span>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{action.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div style={{ padding: '8px', textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '0.75rem', color: '#a1a1aa' }}>
                                <Heart size={12} style={{ marginRight: '4px', display: 'inline' }} /> 
                                High-fidelity model required for best results.
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AdultActionsModal;
