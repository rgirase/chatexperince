import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, Shield, Zap, Search, ArrowRight, UserCheck } from 'lucide-react';
import { personas } from '../../data/personas';

const archetypes = [
    { id: 'scandalous', name: 'Scandalous Ties', icon: Heart, color: '#ec4899', desc: 'Risky relationships and forbidden encounters.' },
    { id: 'traditional', name: 'Traditional Roots', icon: Shield, color: '#8b5cf6', desc: 'Deep cultural stories and family dynamics.' },
    { id: 'professional', name: 'Elite Circles', icon: Zap, color: '#f59e0b', desc: 'High-stakes corporate or socialite encounters.' },
    { id: 'intimate', name: 'Deep Intimacy', icon: Sparkles, color: '#3b82f6', desc: 'Focus on emotional bonds and shared secrets.' }
];

const TheOracle = ({ onPick }) => {
    const [view, setView] = useState('archetypes'); // archetypes, suggestions
    const [selectedArchetype, setSelectedArchetype] = useState(null);
    const [filteredPersonas, setFilteredPersonas] = useState([]);

    const handleSelectArchetype = (arch) => {
        setSelectedArchetype(arch);
        // Simple heuristic filtering for the Oracle demonstration
        // In a real app, we'd have better tags in personas.js
        const shuffled = [...personas].sort(() => 0.5 - Math.random());
        setFilteredPersonas(shuffled.slice(0, 3));
        setView('suggestions');
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 5, 7, 0.98)',
            zIndex: 19000,
            display: 'flex',
            flexDirection: 'column',
            padding: '2rem',
            overflowY: 'auto',
            color: 'white'
        }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem', marginTop: '2rem' }}>
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ 
                        background: 'linear-gradient(135deg, #a855f7, #ec4899)', 
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        fontSize: '3.5rem', fontWeight: '900', letterSpacing: '-0.02em',
                        marginBottom: '1rem'
                    }}
                >
                    Consult the Oracle
                </motion.div>
                <p style={{ color: '#a1a1aa', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                    {view === 'archetypes' 
                        ? "The Neural Link is active. Choose an archetype to begin your first manifestation."
                        : `The Oracle has summoned these personas based on your resonance with ${selectedArchetype?.name}.`}
                </p>
            </div>

            <AnimatePresence mode="wait">
                {view === 'archetypes' ? (
                    <motion.div 
                        key="archetypes"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                            gap: '1.5rem', 
                            maxWidth: '1200px', 
                            margin: '0 auto',
                            width: '100%'
                        }}
                    >
                        {archetypes.map(arch => {
                            const Icon = arch.icon;
                            return (
                                <motion.div 
                                    key={arch.id}
                                    whileHover={{ y: -10, boxShadow: `0 10px 40px ${arch.color}20` }}
                                    onClick={() => handleSelectArchetype(arch)}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        border: '1px solid rgba(255, 255, 255, 0.08)',
                                        borderRadius: '24px',
                                        padding: '2rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        textAlign: 'center',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    <div style={{ 
                                        width: '80px', height: '80px', borderRadius: '50%',
                                        background: arch.color + '15',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        marginBottom: '1.5rem',
                                        border: `1px solid ${arch.color}40`
                                    }}>
                                        <Icon size={40} color={arch.color} />
                                    </div>
                                    <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{arch.name}</h3>
                                    <p style={{ color: '#71717a', fontSize: '0.95rem' }}>{arch.desc}</p>
                                    <div style={{ marginTop: 'auto', paddingTop: '1.5rem', color: arch.color, fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        SUMMON <ArrowRight size={14} />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                ) : (
                    <motion.div 
                        key="suggestions"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}
                    >
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                            {filteredPersonas.map(p => (
                                <motion.div 
                                    key={p.id}
                                    whileHover={{ scale: 1.02 }}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.02)',
                                        border: '1px solid rgba(255, 255, 255, 0.05)',
                                        borderRadius: '32px',
                                        overflow: 'hidden',
                                        position: 'relative'
                                    }}
                                >
                                    <img 
                                        src={p.image} 
                                        alt={p.name} 
                                        style={{ width: '100%', height: '280px', objectFit: 'cover', opacity: 0.8 }} 
                                    />
                                    <div style={{ padding: '1.5rem' }}>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{p.name}</h3>
                                        <p style={{ color: '#a1a1aa', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                                            {p.tagline || (p.description?.slice(0, 100) + '...')}
                                        </p>
                                        <button 
                                            onClick={() => onPick(p)}
                                            className="premium-btn"
                                            style={{ 
                                                width: '100%', padding: '1rem', 
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' 
                                            }}
                                        >
                                            <UserCheck size={18} /> Begin Manifestation
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                            <button 
                                onClick={() => setView('archetypes')}
                                style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto' }}
                            >
                                Re-consult Archetypes
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TheOracle;
