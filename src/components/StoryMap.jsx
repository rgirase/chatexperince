import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Star, Lock } from 'lucide-react';

const StoryMap = ({ persona, milestones = [], onClose }) => {
    // Define potential turning points based on character type or general progression
    const turningPoints = [
        { id: 1, label: 'First Contact', description: 'Initiated the first conversation.', requirement: 0 },
        { id: 2, label: 'Building Trust', description: 'Shared a personal moment or secret.', requirement: 25 },
        { id: 3, label: 'Deepening Bond', description: 'Reached a significant closeness.', requirement: 50 },
        { id: 4, label: 'Intimate Connection', description: 'Overcame a major taboo or barrier.', requirement: 75 },
        { id: 5, label: 'Eternal Flame', description: 'The relationship has reached its peak.', requirement: 95 },
    ];

    const currentScore = parseInt(localStorage.getItem(`score_${persona.id}`) || '0');

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 2000,
                background: 'rgba(9, 9, 11, 0.95)',
                backdropFilter: 'blur(16px)',
                display: 'flex',
                flexDirection: 'column',
                padding: '1.5rem',
                color: '#fff'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Story Map</h2>
                    <p style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>Your journey with {persona.name}</p>
                </div>
                <button 
                    onClick={onClose}
                    style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', padding: '0.5rem 1rem', borderRadius: '12px', cursor: 'pointer' }}
                >
                    Close
                </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0' }}>
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                    {/* The Path Line */}
                    <div style={{ 
                        position: 'absolute', 
                        left: '23px', 
                        top: '10px', 
                        bottom: '10px', 
                        width: '2px', 
                        background: 'linear-gradient(to bottom, #8b5cf6, #ec4899, rgba(255,255,255,0.1))',
                        zIndex: 0
                    }} />

                    {turningPoints.map((tp, index) => {
                        const isUnlocked = currentScore >= tp.requirement;
                        const isNext = !isUnlocked && (index === 0 || currentScore >= turningPoints[index-1].requirement);

                        return (
                            <motion.div 
                                key={tp.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                style={{ 
                                    display: 'flex', 
                                    gap: '1.5rem', 
                                    position: 'relative', 
                                    zIndex: 1,
                                    opacity: isUnlocked ? 1 : 0.6
                                }}
                            >
                                <div style={{ 
                                    width: '48px', 
                                    height: '48px', 
                                    borderRadius: '50%', 
                                    background: isUnlocked ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' : '#18181b',
                                    border: `2px solid ${isNext ? '#8b5cf6' : 'rgba(255,255,255,0.1)'}`,
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    boxShadow: isUnlocked ? '0 0 20px rgba(139, 92, 246, 0.4)' : 'none'
                                }}>
                                    {isUnlocked ? <CheckCircle2 size={24} color="#fff" /> : (isNext ? <Star size={24} color="#8b5cf6" /> : <Lock size={20} color="#3f3f46" />)}
                                </div>
                                <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '1rem' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 'bold', margin: '0 0 0.25rem 0', color: isUnlocked ? '#fff' : '#71717a' }}>
                                        {tp.label}
                                    </h3>
                                    <p style={{ fontSize: '0.8rem', color: '#a1a1aa', margin: 0 }}>
                                        {isUnlocked ? tp.description : `Locked (Requires ${tp.requirement}% connection)`}
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '16px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#c084fc', textAlign: 'center' }}>
                    Current Connection: <strong>{currentScore}%</strong>
                </p>
            </div>
        </motion.div>
    );
};

export default StoryMap;
