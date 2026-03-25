import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, Globe, Shield, Heart, Award, Sparkles, BookOpen } from 'lucide-react';

const CharacterDetailsModal = ({ isOpen, onClose, persona }) => {
    if (!persona) return null;

    // Helper to extract sections from systemPrompt
    const getSection = (name) => {
        if (!persona.systemPrompt) return null;
        const regex = new RegExp(`${name}:?\\s*([\\s\\S]*?)(?=\\n\\s*[A-Z]{2,}:|\\n\\s*KEY RULES:|\\n\\s*You are not an AI|$)`, 'i');
        const match = persona.systemPrompt.match(regex);
        return match ? match[1].trim() : null;
    };

    const backstory = getSection('BACKSTORY');
    const appearance = getSection('APPEARANCE');
    const behavior = getSection('BEHAVIOR');

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
                    <motion.div 
                        className="modal-content glass-panel" 
                        onClick={(e) => e.stopPropagation()}
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        style={{ 
                            maxWidth: '750px', 
                            width: '95%',
                            maxHeight: '85vh',
                            padding: 0,
                            overflow: 'hidden',
                            position: 'relative',
                            background: 'rgba(9, 9, 11, 0.98)',
                            backdropFilter: 'blur(30px)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '24px',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                        }}
                    >
                        {/* Header Image Section - More Compact */}
                        <div style={{ 
                            height: '220px', 
                            position: 'relative',
                            backgroundImage: `url(${persona.image})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center 20%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-end',
                            padding: '1.5rem'
                        }}>
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(9,9,11,1) 100%)',
                                zIndex: 1
                            }}></div>

                            <button 
                                onClick={onClose} 
                                style={{ 
                                    position: 'absolute',
                                    top: '1rem',
                                    right: '1rem',
                                    background: 'rgba(0,0,0,0.5)', 
                                    border: 'none', 
                                    color: '#fff', 
                                    cursor: 'pointer',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backdropFilter: 'blur(10px)',
                                    zIndex: 10
                                }}
                            >
                                <X size={18} />
                            </button>

                            <div style={{ position: 'relative', zIndex: 2 }}>
                                <div style={{ display: 'flex', gap: '6px', marginBottom: '0.75rem' }}>
                                    <div style={{ 
                                        background: 'rgba(168, 85, 247, 0.25)',
                                        border: '1px solid rgba(168, 85, 247, 0.4)',
                                        padding: '3px 10px',
                                        borderRadius: '100px',
                                        fontSize: '0.7rem',
                                        fontWeight: '800',
                                        color: '#e9d5ff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        <Globe size={11} /> {persona.origin}
                                    </div>
                                    <div style={{ 
                                        background: 'rgba(236, 72, 153, 0.25)',
                                        border: '1px solid rgba(236, 72, 153, 0.4)',
                                        padding: '3px 10px',
                                        borderRadius: '100px',
                                        fontSize: '0.7rem',
                                        fontWeight: '800',
                                        color: '#fbcfe8',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        <Shield size={11} /> {persona.category}
                                    </div>
                                    {persona.tabooRating && (
                                        <div style={{ 
                                            background: 'rgba(239, 68, 68, 0.25)',
                                            border: '1px solid rgba(239, 68, 68, 0.4)',
                                            padding: '3px 10px',
                                            borderRadius: '100px',
                                            fontSize: '0.7rem',
                                            fontWeight: '800',
                                            color: '#fecaca',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}>
                                            <Sparkles size={11} /> Taboo {persona.tabooRating}
                                        </div>
                                    )}
                                </div>
                                <h1 style={{ fontSize: '1.75rem', margin: 0, fontWeight: '900', color: '#fff' }}>{persona.name}</h1>
                                <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.6)', margin: '0.25rem 0 0 0', fontWeight: '500' }}>{persona.tagline}</p>
                            </div>
                        </div>

                        {/* Scrollable Content - tighter gaps */}
                        <div style={{ 
                            padding: '1.5rem', 
                            overflowY: 'auto', 
                            maxHeight: 'calc(85vh - 220px)',
                            display: 'grid',
                            gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
                            gap: '1.5rem'
                        }}>
                            {/* Left Column: About & Persona */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <section>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                                        <BookOpen className="premium-gradient-text" size={18} />
                                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Backstory</h3>
                                    </div>
                                    <p style={{ 
                                        color: 'rgba(255,255,255,0.8)', 
                                        lineHeight: '1.6', 
                                        fontSize: '0.9rem',
                                        margin: 0,
                                        background: 'rgba(255,255,255,0.02)',
                                        padding: '1rem',
                                        borderRadius: '16px',
                                        border: '1px solid rgba(255,255,255,0.06)'
                                    }}>
                                        {backstory || "Personal history shrouded in mystery..."}
                                    </p>
                                </section>

                                {appearance && (
                                    <section>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                                            <Heart className="premium-gradient-text" size={16} />
                                            <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>Appearance</h3>
                                        </div>
                                        <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: '1.6', fontSize: '0.85rem', margin: 0 }}>
                                            {appearance}
                                        </p>
                                    </section>
                                )}

                                {behavior && (
                                    <section>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                                            <Award className="premium-gradient-text" size={16} />
                                            <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>Temperament</h3>
                                        </div>
                                        <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: '1.6', fontSize: '0.85rem', margin: 0 }}>
                                            {behavior}
                                        </p>
                                    </section>
                                )}
                            </div>

                            {/* Right Column: Cultural Traits */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <section style={{ 
                                    background: 'rgba(255,255,255,0.02)',
                                    padding: '1.25rem',
                                    borderRadius: '20px',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', fontWeight: '800', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Cultural Insights
                                    </h3>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <div>
                                            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(168, 85, 247, 0.6)', fontWeight: '900', letterSpacing: '0.05em' }}>Language</span>
                                            <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)' }}>{persona.culturalTraits?.languageHabits || 'Standard'}</p>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(236, 72, 153, 0.6)', fontWeight: '900', letterSpacing: '0.05em' }}>Values</span>
                                            <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)' }}>{persona.culturalTraits?.values || 'Not defined'}</p>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(59, 130, 246, 0.6)', fontWeight: '900', letterSpacing: '0.05em' }}>Traditions</span>
                                            <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)' }}>{persona.culturalTraits?.traditions || 'Modern'}</p>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', fontWeight: '800', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Wardrobe Preview</h3>
                                    <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                                        {persona.wardrobe?.slice(0, 4).map((w, i) => (
                                            <div key={i} style={{ 
                                                width: '50px', 
                                                height: '70px', 
                                                borderRadius: '6px', 
                                                overflow: 'hidden',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                flexShrink: 0,
                                                background: 'rgba(0,0,0,0.3)'
                                            }}>
                                                <img src={w.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CharacterDetailsModal;
