import React, { useState, useEffect } from 'react';
import { ArrowLeft, Lock } from 'lucide-react';
import { personas as defaultPersonas } from '../data/personas';

const Gallery = ({ onBack, customPersonas, onSelectImage }) => {
    const allPersonas = [...defaultPersonas, ...customPersonas];
    const [selectedPersonaId, setSelectedPersonaId] = useState(allPersonas[0]?.id || null);
    const [viewMode, setViewMode] = useState('progression'); // 'progression' or 'photos'

    const getScore = (id) => parseInt(localStorage.getItem(`score_${id}`)) || 50;

    const selectedPersona = allPersonas.find(p => p.id === selectedPersonaId);
    
    // Get the active image from localStorage or fallback to default
    const getActiveImage = (persona) => {
        if (!persona) return '';
        return localStorage.getItem(`persona_img_${persona.id}`) || persona.image;
    };

    const score = selectedPersona ? getScore(selectedPersona.id) : 0;

    const thresholds = [
        { level: 20, desc: "Level 1 (Curious)" },
        { level: 50, desc: "Level 2 (Comfortable)" },
        { level: 80, desc: "Level 3 (Intimate)" },
        { level: 100, desc: "Level 4 (Devoted)" }
    ];

    const handleSetImage = (img) => {
        localStorage.setItem(`persona_img_${selectedPersonaId}`, img);
        if (onSelectImage) onSelectImage(selectedPersonaId, img);
        // Force re-render if needed, though App state should handle it
    };

    return (
        <div className="gallery-container fade-in" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', color: '#f3f4f6', paddingBottom: '5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
                <button onClick={onBack} className="back-btn" style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ArrowLeft size={20} /> Back
                </button>
                <h2 style={{ flex: 1, textAlign: 'center', color: '#ec4899', margin: 0 }}>Character Gallery</h2>
            </div>

            {/* Character Selector */}
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', marginBottom: '1.5rem', paddingBottom: '0.5rem' }}>
                {allPersonas.map(p => (
                    <button
                        key={p.id}
                        onClick={() => setSelectedPersonaId(p.id)}
                        style={{
                            padding: '0.5rem 1rem',
                            background: selectedPersonaId === p.id ? 'rgba(236, 72, 153, 0.2)' : 'rgba(0,0,0,0.3)',
                            border: `1px solid ${selectedPersonaId === p.id ? '#ec4899' : '#3f3f46'}`,
                            color: selectedPersonaId === p.id ? '#ec4899' : '#a1a1aa',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <img 
                            src={getActiveImage(p)} 
                            alt="" 
                            style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} 
                        />
                        {p.name}
                    </button>
                ))}
            </div>

            {/* Mode Selector */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem', gap: '1rem' }}>
                <button 
                    onClick={() => setViewMode('progression')}
                    className={viewMode === 'progression' ? 'active-tab' : ''}
                    style={{
                        background: viewMode === 'progression' ? '#ec4899' : 'transparent',
                        color: 'white',
                        border: '1px solid #ec4899',
                        padding: '0.5rem 1.5rem',
                        borderRadius: '8px',
                        cursor: 'pointer'
                    }}
                >
                    Progression
                </button>
                <button 
                    onClick={() => setViewMode('photos')}
                    className={viewMode === 'photos' ? 'active-tab' : ''}
                    style={{
                        background: viewMode === 'photos' ? '#ec4899' : 'transparent',
                        color: 'white',
                        border: '1px solid #ec4899',
                        padding: '0.5rem 1.5rem',
                        borderRadius: '8px',
                        cursor: 'pointer'
                    }}
                >
                    Photos
                </button>
            </div>

            {selectedPersona && viewMode === 'progression' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    {thresholds.map(t => {
                        const isUnlocked = score >= t.level;
                        return (
                            <div key={t.level} className="glass-panel" style={{ padding: '1rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ marginBottom: '1rem', color: isUnlocked ? '#38bdf8' : '#a1a1aa', fontWeight: 'bold' }}>
                                    {t.desc}
                                </div>
                                <div style={{
                                    width: '100%',
                                    aspectRatio: '2/3',
                                    background: isUnlocked
                                        ? (selectedPersona.image ? `url(${getActiveImage(selectedPersona)}) center/cover` : 'linear-gradient(135deg, #8b5cf6, #ec4899)')
                                        : 'rgba(0,0,0,0.5)',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: isUnlocked ? '2px solid #38bdf8' : '1px dashed #52525b',
                                    filter: isUnlocked ? 'brightness(1.2)' : 'none',
                                    fontSize: '48px',
                                    fontWeight: 'bold',
                                    color: 'white'
                                }}>
                                    {isUnlocked && !selectedPersona.image && selectedPersona.name.charAt(0)}
                                    {!isUnlocked && (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#52525b' }}>
                                            <Lock size={32} style={{ marginBottom: '8px' }} />
                                            <span>Unlocks at {t.level}%</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {selectedPersona && viewMode === 'photos' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                    {(selectedPersona.gallery || [selectedPersona.image]).map((img, idx) => {
                        const isActive = getActiveImage(selectedPersona) === img;
                        return (
                            <div 
                                key={idx} 
                                className="glass-panel" 
                                style={{ 
                                    padding: '0.5rem', 
                                    border: isActive ? '2px solid #ec4899' : '1px solid #3f3f46',
                                    transition: 'all 0.2s',
                                    cursor: 'pointer'
                                }}
                                onClick={() => handleSetImage(img)}
                            >
                                <img 
                                    src={img} 
                                    alt={`${selectedPersona.name} ${idx}`} 
                                    style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: '4px', marginBottom: '0.5rem' }} 
                                />
                                <button 
                                    disabled={isActive}
                                    style={{
                                        width: '100%',
                                        padding: '4px',
                                        fontSize: '0.75rem',
                                        background: isActive ? '#ec4899' : 'rgba(255,255,255,0.1)',
                                        border: 'none',
                                        borderRadius: '4px',
                                        color: 'white',
                                        cursor: isActive ? 'default' : 'pointer'
                                    }}
                                >
                                    {isActive ? 'Active' : 'Set as Profile'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Gallery;
