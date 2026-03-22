import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shirt, X, Lock } from 'lucide-react';

const WardrobeModal = ({ isOpen, onClose, persona, relationshipScore, onSetOutfit }) => {
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
                        style={{ maxWidth: '700px' }}
                    >
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Shirt className="premium-gradient-text" size={24} />
                                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Wardrobe Selection</h2>
                            </div>
                            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="wardrobe-grid" style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                                gap: '1.5rem',
                                padding: '0.5rem'
                            }}>
                                {persona.wardrobe && persona.wardrobe.map((outfit, i) => {
                                    const isLocked = relationshipScore < (outfit.requirement || 0);
                                    return (
                                        <motion.div 
                                            key={i} 
                                            className="glass-panel"
                                            style={{
                                                position: 'relative',
                                                borderRadius: '16px',
                                                overflow: 'hidden',
                                                cursor: isLocked ? 'not-allowed' : 'pointer',
                                                aspectRatio: '2/3',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                background: 'rgba(0,0,0,0.2)'
                                            }}
                                            whileHover={!isLocked ? { scale: 1.05, border: '1px solid rgba(168, 85, 247, 0.5)' } : {}}
                                            onClick={() => !isLocked && onSetOutfit(outfit)}
                                        >
                                            <img 
                                                src={outfit.avatar} 
                                                alt={outfit.name} 
                                                style={{ 
                                                    width: '100%', 
                                                    height: '100%', 
                                                    objectFit: 'cover',
                                                    filter: isLocked ? 'grayscale(0.8) brightness(0.5)' : 'none'
                                                }} 
                                            />
                                            <div style={{
                                                position: 'absolute',
                                                bottom: 0,
                                                left: 0,
                                                right: 0,
                                                padding: '1rem',
                                                background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
                                                textAlign: 'center'
                                            }}>
                                                <div style={{ fontWeight: '800', fontSize: '0.9rem', marginBottom: '0.25rem' }}>{outfit.name}</div>
                                                {isLocked && (
                                                    <div style={{ 
                                                        fontSize: '0.75rem', 
                                                        color: '#f472b6', 
                                                        fontWeight: 'bold',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '4px'
                                                    }}>
                                                        <Lock size={12} /> {outfit.requirement} Bond
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default WardrobeModal;
