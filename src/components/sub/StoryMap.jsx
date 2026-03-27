import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Map, Calendar, Heart, Award, ChevronRight, Zap } from 'lucide-react';
import * as db from '../../services/db';

const StoryMap = ({ isOpen, onClose, sessions, persona, currentSessionId }) => {
    const [chapterDetails, setChapterDetails] = useState([]);
    const [selectedChapter, setSelectedChapter] = useState(null);

    useEffect(() => {
        if (!isOpen) return;

        const loadDetails = async () => {
            const details = [];
            for (const sid of sessions) {
                const suffix = `_${persona.id}_${sid}`;
                const recap = await db.getItem('settings', `recap${suffix}`);
                const score = await db.getItem('settings', `score${suffix}`) || 50;
                const milestones = await db.getItem('memories', `milestones${suffix}`) || [];
                
                details.push({
                    id: sid,
                    recap: recap || "A chapter yet to be fully defined...",
                    score,
                    milestones,
                    isCurrent: sid === currentSessionId,
                    date: sid === 'default' ? 'The Beginning' : new Date(parseInt(sid.split('_')[1])).toLocaleDateString()
                });
            }
            setChapterDetails(details);
        };

        loadDetails();
    }, [isOpen, sessions, persona.id, currentSessionId]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{ zIndex: 12000, background: 'rgba(0,0,0,0.85)' }}>
            <motion.div 
                className="glass-panel"
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                style={{
                    width: '90%',
                    maxWidth: '900px',
                    height: '80vh',
                    background: 'linear-gradient(135deg, rgba(10, 10, 15, 0.98) 0%, rgba(20, 10, 30, 0.98) 100%)',
                    border: '1px solid rgba(168, 85, 247, 0.4)',
                    boxShadow: '0 0 100px rgba(168, 85, 247, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '2rem',
                    overflow: 'hidden'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h2 className="premium-gradient-text" style={{ fontSize: '2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Map size={32} /> The Story Map
                        </h2>
                        <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.9rem' }}>Visualizing your journey with {persona.name}</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer', padding: '12px', borderRadius: '50%' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', padding: '2rem 0', position: 'relative' }}>
                    {/* The Timeline Line */}
                    <div style={{ 
                        position: 'absolute', 
                        top: '50%', 
                        left: '50px', 
                        right: '50px', 
                        height: '2px', 
                        background: 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)',
                        opacity: 0.3,
                        transform: 'translateY(-50%)',
                        zIndex: 1
                    }}></div>

                    <div style={{ display: 'flex', gap: '80px', padding: '0 50px', height: '100%', alignItems: 'center' }}>
                        {chapterDetails.map((chap, idx) => (
                            <motion.div 
                                key={chap.id}
                                style={{ position: 'relative', zIndex: 2, flexShrink: 0 }}
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                            >
                                {/* Node */}
                                <motion.div 
                                    onClick={() => setSelectedChapter(chap)}
                                    whileHover={{ scale: 1.2, boxShadow: '0 0 20px rgba(168, 85, 247, 0.8)' }}
                                    style={{
                                        width: '60px',
                                        height: '60px',
                                        borderRadius: '50%',
                                        background: chap.isCurrent ? '#a855f7' : 'rgba(255,255,255,0.05)',
                                        border: `2px solid ${chap.isCurrent ? '#fff' : '#a855f7'}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        boxShadow: chap.isCurrent ? '0 0 30px rgba(168, 85, 247, 0.5)' : 'none'
                                    }}
                                >
                                    {chap.id === 'default' ? <Zap size={24} /> : <Heart size={24} color={chap.score > 80 ? '#ec4899' : '#fff'} />}
                                </motion.div>

                                {/* Label */}
                                <div style={{ 
                                    position: 'absolute', 
                                    top: '75px', 
                                    left: '50%', 
                                    transform: 'translateX(-50%)', 
                                    textAlign: 'center',
                                    width: '120px'
                                }}>
                                    <span style={{ fontSize: '0.75rem', color: chap.isCurrent ? '#fff' : '#a1a1aa', fontWeight: 'bold' }}>{chap.date}</span>
                                    {chap.isCurrent && <div style={{ color: '#a855f7', fontSize: '0.6rem', fontWeight: 'bold' }}>ACTIVE NOW</div>}
                                </div>

                                {/* Milestone Indicator */}
                                {chap.milestones.length > 0 && (
                                    <div style={{ 
                                        position: 'absolute', 
                                        bottom: '75px', 
                                        left: '50%', 
                                        transform: 'translateX(-50%)',
                                        color: '#ec4899'
                                    }}>
                                        <Award size={18} />
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Info Panel for Selected Chapter */}
                <AnimatePresence mode="wait">
                    {selectedChapter && (
                        <motion.div 
                            key={selectedChapter.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            style={{
                                marginTop: '2rem',
                                padding: '1.5rem',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '16px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                minHeight: '150px'
                            }}
                        >
                            <div style={{ display: 'flex', gap: '20px' }}>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#a855f7' }}>
                                        {selectedChapter.date === 'The Beginning' ? 'Genesis Chapter' : `Chapter: ${selectedChapter.date}`}
                                    </h3>
                                    <p style={{ margin: 0, fontSize: '0.95rem', fontStyle: 'italic', color: '#e4e4e7', lineHeight: '1.5' }}>
                                        "{selectedChapter.recap}"
                                    </p>
                                </div>
                                <div style={{ width: '150px', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '20px' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '4px' }}>RELATIONSHIP</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ec4899' }}>{selectedChapter.score}%</div>
                                    
                                    {selectedChapter.milestones.length > 0 && (
                                        <div style={{ marginTop: '12px' }}>
                                            <div style={{ fontSize: '0.65rem', color: '#a1a1aa', marginBottom: '4px' }}>KEY MOMENT</div>
                                            <div style={{ fontSize: '0.75rem', color: '#fbbf24' }}>{selectedChapter.milestones[0]}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default StoryMap;
