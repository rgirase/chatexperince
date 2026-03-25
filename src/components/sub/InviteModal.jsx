import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, UserMinus } from 'lucide-react';

const InviteModal = ({ isOpen, onClose, allPersonas, currentPersona, invitedPersona, onInvite, onRemove }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <motion.div 
                className="modal-content glass-panel" 
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                style={{ maxWidth: '420px', borderRadius: '24px', overflow: 'hidden' }}
            >
                <div className="modal-header" style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '8px', borderRadius: '12px', color: '#38bdf8' }}>
                            <UserPlus size={20} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#fff' }}>Invite to Scene</h3>
                    </div>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body" style={{ padding: '1.5rem', maxHeight: '60vh', overflowY: 'auto' }}>
                    {invitedPersona ? (
                        <div style={{ textAlign: 'center', padding: '1rem' }}>
                            <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 1rem' }}>
                                <img 
                                    src={invitedPersona.image} 
                                    alt={invitedPersona.name} 
                                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '3px solid #38bdf8' }} 
                                />
                                <div style={{ position: 'absolute', bottom: -5, right: -5, background: '#10b981', width: '20px', height: '20px', borderRadius: '50%', border: '3px solid #18181b' }}></div>
                            </div>
                            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: '#fff' }}>{invitedPersona.name} is here</h4>
                            <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.85rem', color: '#71717a' }}>She is currently interacting with you and {currentPersona.name}.</p>
                            
                            <button
                                onClick={() => { onRemove(); onClose(); }}
                                style={{ 
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    width: '100%',
                                    padding: '1rem', 
                                    background: 'rgba(239, 68, 68, 0.1)', 
                                    color: '#ef4444', 
                                    border: '1px solid rgba(239, 68, 68, 0.2)', 
                                    borderRadius: '16px', 
                                    cursor: 'pointer', 
                                    fontWeight: '700',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                            >
                                <UserMinus size={18} /> End Collaboration
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#a1a1aa' }}>Who should join the conversation?</p>
                            {allPersonas && allPersonas.filter(p => p.id !== currentPersona.id).map(p => (
                                <motion.div 
                                    key={p.id} 
                                    whileHover={{ x: 4, background: 'rgba(255,255,255,0.08)' }}
                                    onClick={() => { onInvite(p); onClose(); }} 
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        padding: '0.75rem', 
                                        background: 'rgba(255,255,255,0.04)', 
                                        borderRadius: '16px', 
                                        cursor: 'pointer', 
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <img 
                                        src={p.image} 
                                        alt={p.name} 
                                        style={{ width: '44px', height: '44px', borderRadius: '50%', marginRight: '12px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }} 
                                    />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.95rem' }}>{p.name}</div>
                                        <div style={{ color: '#71717a', fontSize: '0.75rem' }}>{p.category} • {p.origin}</div>
                                    </div>
                                    <UserPlus size={16} color="#38bdf8" style={{ opacity: 0.6 }} />
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
                
                <div className="modal-footer" style={{ padding: '1rem 1.5rem', background: 'rgba(0,0,0,0.2)', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#52525b', fontStyle: 'italic' }}>
                        Multiple characters can respond and react to each other.
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default InviteModal;
