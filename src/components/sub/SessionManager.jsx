import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, MessageSquare, Trash2, Clock, ChevronRight } from 'lucide-react';

const SessionManager = ({ isOpen, onClose, sessions, currentSessionId, onSwitch, onStartNew, onDelete, personaName }) => {
    if (!isOpen) return null;

    const formatDate = (sid) => {
        if (sid === 'default') return 'Default Session';
        const timestamp = parseInt(sid.split('_')[1]);
        if (isNaN(timestamp)) return sid;
        return new Date(timestamp).toLocaleString([], { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
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
                    width: '90%',
                    maxWidth: '450px',
                    maxHeight: '80vh',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    background: 'rgba(15, 15, 20, 0.98)',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    boxShadow: '0 0 40px rgba(168, 85, 247, 0.15)',
                    padding: '1.5rem'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h2 className="premium-gradient-text" style={{ margin: 0, fontSize: '1.5rem' }}>Chat Archives</h2>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#a1a1aa' }}>History with {personaName}</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {sessions.map((sid) => (
                            <div 
                                key={sid}
                                onClick={() => onSwitch(sid)}
                                style={{
                                    padding: '1rem',
                                    borderRadius: '16px',
                                    background: sid === currentSessionId ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                                    border: `1px solid ${sid === currentSessionId ? 'rgba(168, 85, 247, 0.4)' : 'rgba(255, 255, 255, 0.05)'}`,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ 
                                        width: '40px', 
                                        height: '40px', 
                                        borderRadius: '12px', 
                                        background: sid === currentSessionId ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: sid === currentSessionId ? '#a855f7' : '#71717a'
                                    }}>
                                        <MessageSquare size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: '600', color: sid === currentSessionId ? '#fff' : '#d4d4d8' }}>
                                            {formatDate(sid)}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#71717a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Clock size={12} />
                                            {sid === currentSessionId ? 'Active Now' : 'Archived'}
                                        </div>
                                    </div>
                                </div>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {sid !== 'default' && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onDelete(sid); }}
                                            style={{ background: 'none', border: 'none', color: '#ef4444', opacity: 0.6, cursor: 'pointer', padding: '8px' }}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                    <ChevronRight size={18} color="#71717a" />
                                </div>
                            </div>
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
                        fontSize: '1rem'
                    }}
                >
                    <Plus size={20} />
                    Start New Chapter
                </button>
            </motion.div>
        </div>
    );
};

export default SessionManager;
