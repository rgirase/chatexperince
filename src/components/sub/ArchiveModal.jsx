import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, MessageSquare, Trash2, Calendar } from 'lucide-react';
import * as db from '../../services/db';

const ArchiveModal = ({ isOpen, onClose, currentPersonaId }) => {
    const [archives, setArchives] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedChat, setSelectedChat] = useState(null);

    useEffect(() => {
        if (isOpen) {
            loadArchives();
        }
    }, [isOpen]);

    const loadArchives = async () => {
        setIsLoading(true);
        try {
            const allArchives = await db.getAll('conversations');
            // Filter by current persona and sort by most recent
            const filtered = allArchives
                .filter(a => a.personaId === currentPersonaId)
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setArchives(filtered);
        } catch (e) {
            console.error("Failed to load archives", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (window.confirm("Delete this archived conversation?")) {
            await db.removeItem('conversations', id);
            loadArchives();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <motion.div 
                className="glass-panel modal-content archive-modal"
                onClick={e => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                style={{ width: '90%', maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
            >
                <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ background: 'rgba(139, 92, 246, 0.2)', padding: '8px', borderRadius: '10px', color: '#a78bfa' }}>
                            <Clock size={20} />
                        </div>
                        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Chat Archives</h2>
                    </div>
                    <button onClick={onClose} className="close-btn" style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <div className="archive-list" style={{ flex: 1, overflowY: 'auto', padding: '0 1rem 1rem' }}>
                    {isLoading ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#a1a1aa' }}>
                            <div className="loading-spinner" style={{ marginBottom: '1rem' }}></div>
                            <p>Loading your history...</p>
                        </div>
                    ) : archives.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(255,255,255,0.02)', borderRadius: '15px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                            <MessageSquare size={48} color="#3f3f46" style={{ marginBottom: '1rem' }} />
                            <p style={{ color: '#a1a1aa' }}>No archived conversations found for this character.</p>
                        </div>
                    ) : selectedChat ? (
                        <div className="chat-preview">
                            <button 
                                onClick={() => setSelectedChat(null)}
                                style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#a1a1aa', padding: '6px 12px', borderRadius: '8px', marginBottom: '1rem', cursor: 'pointer', fontSize: '0.8rem' }}
                            >
                                ← Back to list
                            </button>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {selectedChat.messages.map((m, i) => (
                                    <div key={i} style={{ padding: '10px', borderRadius: '10px', background: m.role === 'user' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255,255,255,0.05)', borderLeft: `3px solid ${m.role === 'user' ? '#a855f7' : '#52525b'}` }}>
                                        <p style={{ margin: 0, fontSize: '0.9rem', color: m.role === 'user' ? '#d8b4fe' : '#e4e4e7' }}>{m.content}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {archives.map(archive => (
                                <div 
                                    key={archive.id}
                                    onClick={() => setSelectedChat(archive)}
                                    className="archive-item"
                                    style={{ 
                                        padding: '1rem', 
                                        background: 'rgba(255,255,255,0.03)', 
                                        borderRadius: '12px', 
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <Calendar size={14} color="#a1a1aa" />
                                            <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                                                {new Date(archive.timestamp).toLocaleDateString()} at {new Date(archive.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div style={{ color: '#71717a', fontSize: '0.8rem' }}>
                                            {archive.messages.length} messages exchanged
                                        </div>
                                    </div>
                                    <button 
                                        onClick={(e) => handleDelete(e, archive.id)}
                                        style={{ background: 'rgba(244, 63, 94, 0.1)', border: 'none', color: '#f43f5e', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default ArchiveModal;
