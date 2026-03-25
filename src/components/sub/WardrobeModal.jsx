import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shirt, Lock, Check, X, Heart } from 'lucide-react';
import { getAffection, getEquippedOutfit, setEquippedOutfit } from '../../services/relationship';

const WardrobeModal = ({ isOpen, onClose, persona, relationshipScore, onSetOutfit }) => {
    const [affection, setAffection] = useState(relationshipScore || 0);
    const [equippedId, setEquippedId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen && persona) {
            const loadState = async () => {
                const aff = relationshipScore !== undefined ? relationshipScore : await getAffection(persona.id);
                const eq = await getEquippedOutfit(persona.id);
                setAffection(aff);
                setEquippedId(eq || (persona.wardrobe && persona.wardrobe[0]?.id));
            };
            loadState();
        }
    }, [isOpen, persona, relationshipScore]);

    const handleEquip = async (outfitId) => {
        setIsSaving(true);
        await setEquippedOutfit(persona.id, outfitId);
        setEquippedId(outfitId);
        
        // Dispatch refresh event for the card list
        window.dispatchEvent(new CustomEvent('wardrobeUpdated', { detail: { personaId: persona.id } }));

        if (onSetOutfit) {
            const outfitObj = persona.wardrobe.find(o => o.id === outfitId);
            if (outfitObj) onSetOutfit(outfitObj);
        }
        
        setTimeout(() => setIsSaving(false), 500);
    };

    if (!persona || !persona.wardrobe) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="modal-overlay" onClick={onClose} style={{ zIndex: 2000 }}>
                    <motion.div 
                        className="modal-content glass-panel" 
                        onClick={(e) => e.stopPropagation()}
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        style={{ 
                            maxWidth: '700px', 
                            width: '95%', 
                            maxHeight: '90vh', 
                            overflow: 'hidden', 
                            display: 'flex', 
                            flexDirection: 'column',
                            borderRadius: '32px',
                            background: 'rgba(9, 9, 11, 0.95)',
                            border: '1px solid rgba(244, 114, 182, 0.2)'
                        }}
                    >
                        <div className="modal-header" style={{ padding: '2rem 2rem 1rem 2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                        <Shirt className="premium-gradient-text" size={24} />
                                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800' }}>{persona.name}'s Wardrobe</h2>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(244, 114, 182, 0.1)', padding: '6px 12px', borderRadius: '12px', border: '1px solid rgba(244, 114, 182, 0.2)' }}>
                                        <Heart size={14} fill="#f472b6" color="#f472b6" />
                                        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#f472b6' }}>
                                            Bond Level: {Math.floor(affection / 10)} • {affection} Points
                                        </span>
                                    </div>
                                </div>
                                <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer', padding: '10px', borderRadius: '50%' }}>
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '1rem 2rem 2rem 2rem' }}>
                            <div style={{ marginBottom: '2rem' }}>
                                <div style={{ height: '8px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(100, (affection / 100) * 100)}%` }}
                                        style={{ height: '100%', background: 'linear-gradient(90deg, #f472b6, #db2777)', boxShadow: '0 0 15px rgba(244, 114, 182, 0.5)' }}
                                    />
                                </div>
                                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                                    Interact more to unlock exclusive, daring new looks.
                                </p>
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                                gap: '1.5rem'
                            }}>
                                {persona.wardrobe.map((item, i) => {
                                    const isLocked = affection < item.minScore;
                                    const isEquipped = equippedId === item.id;
                                    
                                    return (
                                        <motion.div 
                                            key={item.id}
                                            style={{
                                                background: 'rgba(255,255,255,0.02)',
                                                border: `1px solid ${isEquipped ? '#f472b6' : 'rgba(255,255,255,0.05)'}`,
                                                borderRadius: '24px',
                                                overflow: 'hidden',
                                                position: 'relative',
                                                cursor: isLocked ? 'default' : 'pointer',
                                                transition: 'all 0.3s ease'
                                            }}
                                            whileHover={!isLocked ? { y: -5, background: 'rgba(255,255,255,0.05)' } : {}}
                                            onClick={() => !isLocked && handleEquip(item.id)}
                                        >
                                            {/* Preview Image */}
                                            <div style={{ height: '180px', position: 'relative' }}>
                                                <img 
                                                    src={item.avatar} 
                                                    alt={item.name}
                                                    style={{ 
                                                        width: '100%', 
                                                        height: '100%', 
                                                        objectFit: 'cover',
                                                        filter: isLocked ? 'blur(10px) grayscale(1)' : 'none',
                                                        opacity: isLocked ? 0.3 : 1
                                                    }}
                                                />
                                                {isLocked && (
                                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                        <div style={{ background: 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '50%', backdropFilter: 'blur(10px)' }}>
                                                            <Lock size={20} color="#fff" />
                                                        </div>
                                                        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#fff', background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: '8px' }}>
                                                            {item.minScore} pts
                                                        </span>
                                                    </div>
                                                )}
                                                {isEquipped && (
                                                    <div style={{ position: 'absolute', top: '12px', right: '12px', background: '#f472b6', padding: '6px', borderRadius: '50%', boxShadow: '0 4px 12px rgba(244, 114, 182, 0.4)' }}>
                                                        <Check size={14} color="#fff" strokeWidth={4} />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div style={{ padding: '1rem', textAlign: 'center' }}>
                                                <div style={{ fontWeight: '700', fontSize: '0.9rem', color: isLocked ? 'rgba(255,255,255,0.3)' : '#fff', marginBottom: '4px' }}>
                                                    {item.name}
                                                </div>
                                                {!isLocked && (
                                                    <div style={{ fontSize: '0.7rem', color: isEquipped ? '#f472b6' : 'rgba(255,255,255,0.5)', fontWeight: '600', textTransform: 'uppercase' }}>
                                                        {isEquipped ? 'Active' : 'Click to Equip'}
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
