import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image as ImageIcon, Heart, Download, Calendar, User, Search } from 'lucide-react';
import * as db from '../../services/db';

const VaultModal = ({ isOpen, onClose, allPersonas }) => {
    const [memories, setMemories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!isOpen) return;

        const loadMemories = async () => {
            setLoading(true);
            try {
                // 1. Get all raw chats to find generated images
                const allChats = await db.getAll('chats');
                const chatImages = [];
                
                allChats.forEach(chat => {
                    const messages = chat.value || [];
                    const personaId = chat.id.split('_')[1]; // chat_gauri_session -> gauri
                    const persona = allPersonas.find(p => p.id === personaId);
                    
                    messages.filter(m => m.isPhoto && m.url).forEach(m => {
                        chatImages.push({
                            id: m.id,
                            url: m.url,
                            personaName: persona?.name || 'Unknown',
                            personaId: personaId,
                            timestamp: m.id,
                            type: 'selfie'
                        });
                    });
                });

                // 2. Get all unlocked gallery images
                const unlocked = await db.getAll('unlocked_gallery');
                const galleryImages = unlocked.map(item => {
                    const personaId = item.id.split('_')[0];
                    const persona = allPersonas.find(p => p.id === personaId);
                    return {
                        id: item.id,
                        url: item.value,
                        personaName: persona?.name || 'Unknown',
                        personaId: personaId,
                        timestamp: Date.now(),
                        type: 'gallery'
                    };
                });

                const combined = [...chatImages, ...galleryImages].sort((a, b) => b.timestamp - a.timestamp);
                setMemories(combined);
            } catch (e) {
                console.error("[Vault] Failed to load", e);
            } finally {
                setLoading(false);
            }
        };

        loadMemories();
    }, [isOpen, allPersonas]);

    const filteredMemories = memories.filter(m => {
        const matchesSearch = m.personaName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'All' || m.type === filter.toLowerCase();
        return matchesSearch && matchesFilter;
    });

    const handleDownload = (url) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = `vault_memory_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="modal-overlay vault-overlay" onClick={onClose} style={{ zIndex: 2000 }}>
                <motion.div 
                    className="modal-content vault-content" 
                    onClick={(e) => e.stopPropagation()}
                    initial={{ opacity: 0, scale: 0.9, y: 50 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 50 }}
                    style={{ 
                        maxWidth: '900px', 
                        width: '95%', 
                        height: '85vh', 
                        background: 'rgba(15, 15, 20, 0.95)',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                        borderRadius: '32px',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    <div className="modal-header" style={{ padding: '2rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div className="premium-icon-box" style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)', padding: '12px', borderRadius: '16px' }}>
                                <Heart size={28} color="white" />
                            </div>
                            <div>
                                <h2 className="premium-gradient-text" style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800' }}>TheVault ofMemories</h2>
                                <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.9rem' }}>A persistent scrapbook of your roleplay journey.</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="modal-close-btn" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '50%', padding: '8px' }}>
                            <X size={24} />
                        </button>
                    </div>

                    <div className="vault-toolbar" style={{ padding: '1rem 2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
                            <input 
                                type="text" 
                                placeholder="Search by character..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ 
                                    width: '100%', 
                                    background: 'rgba(255,255,255,0.03)', 
                                    border: '1px solid rgba(255,255,255,0.1)', 
                                    borderRadius: '12px', 
                                    padding: '10px 12px 10px 40px',
                                    color: 'white',
                                    outline: 'none'
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {['All', 'Selfie', 'Gallery'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '10px',
                                        background: filter === f ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)',
                                        color: 'white',
                                        border: 'none',
                                        fontSize: '0.85rem',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="modal-body vault-grid-container" style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
                        {loading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#a1a1aa' }}>
                                <div className="loading-spinner"></div>
                                <span style={{ marginLeft: '12px' }}>Opening the vault...</span>
                            </div>
                        ) : filteredMemories.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#71717a' }}>
                                <ImageIcon size={64} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                <h3>Your vault is empty</h3>
                                <p>Generate selfies or unlock gallery images to see them here.</p>
                            </div>
                        ) : (
                            <div className="vault-grid" style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                                gap: '1.5rem' 
                            }}>
                                {filteredMemories.map((m, idx) => (
                                    <motion.div
                                        key={m.id + idx}
                                        className="vault-item glass-panel"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        whileHover={{ y: -8, scale: 1.02 }}
                                        style={{ 
                                            borderRadius: '20px', 
                                            overflow: 'hidden', 
                                            position: 'relative',
                                            aspectRatio: '3/4'
                                        }}
                                    >
                                        <img 
                                            src={m.url} 
                                            alt={m.personaName} 
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                        />
                                        <div className="vault-item-overlay" style={{
                                            position: 'absolute',
                                            inset: 0,
                                            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'flex-end',
                                            padding: '1rem',
                                            opacity: 1
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                                <User size={12} color="#a855f7" />
                                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{m.personaName}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', color: '#a1a1aa' }}>
                                                    <Calendar size={10} />
                                                    {new Date(parseInt(m.id) || Date.now()).toLocaleDateString()}
                                                </div>
                                                <button 
                                                    onClick={() => handleDownload(m.url)}
                                                    style={{ background: 'rgba(255,255,255,0.1)', cursor: 'pointer', borderRadius: '50%', padding: '6px' }}
                                                >
                                                    <Download size={14} color="white" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default VaultModal;
