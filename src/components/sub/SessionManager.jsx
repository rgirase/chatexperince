import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, BookOpen, Trash2, Clock, ChevronRight, Sparkles } from 'lucide-react';
import * as db from '../../services/db';

const SessionManager = ({ isOpen, onClose, sessions, currentSessionId, onSwitch, onStartNew, onDelete, personaName, currentRecap }) => {
    const [recaps, setRecaps] = useState({});

    useEffect(() => {
        if (!isOpen) return;

        const loadRecaps = async () => {
            const newRecaps = { ...recaps };
            for (const sid of sessions) {
                if (sid === currentSessionId) {
                    newRecaps[sid] = currentRecap;
                } else if (!newRecaps[sid]) {
                    const suffix = sid === 'default' ? `_${personaName.replace(/\s+/g, '_')}` : `_${sid}`;
                    const saved = await db.getItem('settings', `recap${suffix}`);
                    if (saved) newRecaps[sid] = saved;
                }
            }
            setRecaps(newRecaps);
        };

        loadRecaps();
    }, [isOpen, sessions, currentSessionId, currentRecap, personaName]);

    if (!isOpen) return null;

    const formatDate = (sid) => {
        if (sid === 'default') return 'Genesis Chapter';
        const timestamp = parseInt(sid.split('_')[1]);
        if (isNaN(timestamp)) return 'Story Chapter';
        return new Date(timestamp).toLocaleString([], { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric'
        });
    };

    return (
        <div className="modal-overlay" style={{ zIndex: 11000 }}>
            <motion.div 
                className="glass-panel"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                style={{
                    width: '95%',
                    maxWidth: '500px',
                    maxHeight: '85vh',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    background: 'rgba(10, 10, 15, 0.95)',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    boxShadow: '0 0 50px rgba(0, 0, 0, 0.8)',
                    padding: '1.5rem',
                    position: 'relative'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h2 className="premium-gradient-text" style={{ margin: 0, fontSize: '1.6rem', letterSpacing: '-0.5px' }}>The Story So Far...</h2>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#a1a1aa' }}>Archived Chapters with {personaName}</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer', padding: '8px', borderRadius: '50%' }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {sessions.map((sid, index) => (
                            <motion.div 
                                key={sid}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => onSwitch(sid)}
                                className="polaroid-chapter-card"
                                style={{
                                    padding: '1rem',
                                    paddingBottom: '1.5rem',
                                    background: '#fff',
                                    borderRadius: '4px',
                                    boxShadow: '0 10px 20px rgba(0,0,0,0.3), inset 0 0 2px rgba(0,0,0,0.1)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transform: `rotate(${index % 2 === 0 ? '-1deg' : '1deg'})`,
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    color: '#1a1a1a',
                                    border: sid === currentSessionId ? '3px solid #a855f7' : 'none'
                                }}
                                whileHover={{ scale: 1.02, rotate: 0, zIndex: 10 }}
                            >
                                <div style={{ 
                                    width: '100%', 
                                    aspectRatio: '16/9', 
                                    background: sid === currentSessionId ? 'rgba(168, 85, 247, 0.1)' : '#f3f4f6',
                                    borderRadius: '2px',
                                    marginBottom: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    <BookOpen size={48} color={sid === currentSessionId ? '#a855f7' : '#d1d5db'} strokeWidth={1} />
                                    {sid === currentSessionId && (
                                        <div style={{ position: 'absolute', top: 8, right: 8, background: '#a855f7', color: '#fff', fontSize: '0.65rem', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                                            ACTIVE
                                        </div>
                                    )}
                                </div>
                                
                                <div style={{ padding: '0 4px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                        <h4 style={{ margin: 0, fontSize: '1rem', fontFamily: '"Caveat", cursive, serif', fontWeight: '700' }}>
                                            {formatDate(sid)}
                                        </h4>
                                        {sid !== 'default' && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onDelete(sid); }}
                                                style={{ background: 'none', border: 'none', color: '#ef4444', opacity: 0.4, cursor: 'pointer', padding: '4px' }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                    <p style={{ 
                                        margin: 0, 
                                        fontSize: '0.85rem', 
                                        lineHeight: '1.4', 
                                        color: '#4b5563',
                                        fontStyle: 'italic',
                                        fontFamily: '"Handlee", cursive, sans-serif'
                                    }}>
                                        {recaps[sid] || "A new page in your shared history, waiting to be written with depth and emotion..."}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <button 
                    onClick={onStartNew}
                    className="premium-gradient-btn"
                    style={{
                        padding: '1rem',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        fontWeight: '700',
                        fontSize: '1rem',
                        boxShadow: '0 10px 20px rgba(168, 85, 247, 0.2)'
                    }}
                >
                    <Plus size={20} />
                    Begin New Chapter
                </button>
                
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#71717a' }}>
                        <Sparkles size={10} style={{ marginRight: '4px' }} />
                        Recaps are automatically generated as you play
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default SessionManager;
