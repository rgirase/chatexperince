import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Book, Trash2, Search, Info, Award, MapPin, Users, Zap, Plus } from 'lucide-react';
import * as db from '../../services/db';

const LoreCodexModal = ({ isOpen, onClose, persona }) => {
    const [lore, setLore] = useState([]);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [isAdding, setIsAdding] = useState(false);
    const [newFact, setNewFact] = useState('');
    const [newCategory, setNewCategory] = useState('relationship');

    useEffect(() => {
        if (isOpen) {
            loadLore();
        }
    }, [isOpen, persona.id]);

    const loadLore = async () => {
        const allLore = await db.getAll('lore');
        const filtered = allLore
            .map(l => ({ ...l.value, id: l.id }))
            .filter(l => l.personaId === persona.id)
            .sort((a, b) => b.timestamp - a.timestamp);
        setLore(filtered);
    };

    const handleDelete = async (id) => {
        await db.removeItem('lore', id);
        loadLore();
    };

    const handleAddFact = async () => {
        if (!newFact.trim()) return;
        
        const id = `lore_manual_${persona.id}_${Date.now()}`;
        const item = {
            fact: newFact.trim(),
            category: newCategory,
            personaId: persona.id,
            timestamp: Date.now(),
            importance: 5, // Manual facts are high priority
            isManual: true
        };

        await db.setItem('lore', id, item);
        setNewFact('');
        setIsAdding(false);
        loadLore();
    };

    const filteredLore = lore.filter(l => {
        const matchesSearch = l.fact.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === 'all' || l.category === filter;
        return matchesSearch && matchesFilter;
    });

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 30 }}
                    className="modal-content glass-panel lore-codex" 
                    onClick={e => e.stopPropagation()} 
                    style={{ maxWidth: '650px', width: '95%', height: '80vh', display: 'flex', flexDirection: 'column' }}
                >
                    <div className="modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)', padding: '8px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)' }}>
                                <Book size={24} color="white" />
                            </div>
                            <div>
                                <h2 className="premium-gradient-text" style={{ fontSize: '1.4rem', margin: 0 }}>WORLD CODEX</h2>
                                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>${persona.name}'s Neural Memory Journal</p>
                            </div>
                        </div>
                        <button className="close-btn" onClick={onClose}><X size={20} /></button>
                    </div>

                    <div style={{ padding: '16px 24px', background: 'rgba(255,255,255,0.02)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                            <input 
                                type="text" 
                                placeholder="Search memories..." 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{
                                    width: '100%',
                                    background: 'rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    padding: '10px 10px 10px 40px',
                                    color: '#fff',
                                    fontSize: '0.9rem'
                                }}
                            />
                        </div>
                        <select 
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            style={{
                                background: 'rgba(0,0,0,0.2)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                padding: '10px',
                                color: '#fff',
                                fontSize: '0.85rem',
                                outline: 'none'
                            }}
                        >
                            <option value="all">All Records</option>
                            <option value="user_info">User Insights</option>
                            <option value="relationship">Shared History</option>
                             <option value="world_event">World Events</option>
                        </select>
                        <button 
                            onClick={() => setIsAdding(!isAdding)}
                            style={{
                                background: isAdding ? 'rgba(239, 68, 68, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                                border: '1px solid ' + (isAdding ? 'rgba(239, 68, 68, 0.3)' : 'rgba(168, 85, 247, 0.3)'),
                                color: isAdding ? '#ef4444' : '#a855f7',
                                borderRadius: '12px',
                                padding: '10px 16px',
                                fontSize: '0.85rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            {isAdding ? <X size={18} /> : <Plus size={18} />}
                            {isAdding ? 'Cancel' : 'Add Fact'}
                        </button>
                    </div>

                    <AnimatePresence>
                        {isAdding && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                style={{ overflow: 'hidden', background: 'rgba(168, 85, 247, 0.05)', borderBottom: '1px solid rgba(168, 85, 247, 0.1)' }}
                            >
                                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                        <select 
                                            value={newCategory}
                                            onChange={(e) => setNewCategory(e.target.value)}
                                            style={{
                                                background: 'rgba(0,0,0,0.3)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '10px',
                                                padding: '8px',
                                                color: '#fff',
                                                fontSize: '0.8rem',
                                                outline: 'none',
                                                minWidth: '120px'
                                            }}
                                        >
                                            <option value="user_info">User Insight</option>
                                            <option value="relationship">Shared History</option>
                                            <option value="world_event">World Event</option>
                                        </select>
                                        <input 
                                            type="text"
                                            placeholder="What should the AI remember?"
                                            value={newFact}
                                            onChange={(e) => setNewFact(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddFact()}
                                            style={{
                                                flex: '1 1 200px',
                                                background: 'rgba(0,0,0,0.3)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '10px',
                                                padding: '8px 12px',
                                                color: '#fff',
                                                fontSize: '0.85rem',
                                                minWidth: '150px'
                                            }}
                                        />
                                        <button 
                                            onClick={handleAddFact}
                                            disabled={!newFact.trim()}
                                            style={{
                                                background: '#a855f7',
                                                border: 'none',
                                                borderRadius: '10px',
                                                padding: '8px 20px',
                                                color: 'white',
                                                fontWeight: 'bold',
                                                fontSize: '0.85rem',
                                                cursor: newFact.trim() ? 'pointer' : 'not-allowed',
                                                opacity: newFact.trim() ? 1 : 0.5,
                                                flexShrink: 0,
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            Save Fact
                                        </button>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
                                        Manual facts are prioritized by the AI to ensure roleplay consistency.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="modal-body custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                        {filteredLore.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.5 }}>
                                <Zap size={48} style={{ margin: '0 auto 16px', color: '#a855f7' }} />
                                <p>No specific memories established yet.</p>
                                <p style={{ fontSize: '0.8rem' }}>Continue roleplaying to build the World Codex.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {filteredLore.map((item, idx) => (
                                    <motion.div 
                                        key={item.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.03)',
                                            border: '1px solid rgba(255, 255, 255, 0.05)',
                                            borderRadius: '16px',
                                            padding: '16px',
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: '16px',
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <div style={{ 
                                            padding: '10px', 
                                            borderRadius: '12px', 
                                            background: item.category === 'user_info' ? 'rgba(59, 130, 246, 0.1)' : 
                                                        item.category === 'relationship' ? 'rgba(236, 72, 153, 0.1)' : 
                                                        'rgba(168, 85, 247, 0.1)',
                                            color: item.category === 'user_info' ? '#3b82f6' : 
                                                   item.category === 'relationship' ? '#ec4899' : 
                                                   '#a855f7'
                                        }}>
                                            {item.category === 'user_info' ? <Users size={20} /> : 
                                             item.category === 'relationship' ? <Award size={20} /> : 
                                             <MapPin size={20} />}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
                                                    {item.category.replace('_', ' ')}
                                                </span>
                                                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)' }}>
                                                    {new Date(item.timestamp).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '0.95rem', color: '#fff', fontWeight: '500', lineHeight: '1.4' }}>
                                                {item.fact}
                                            </p>
                                            <div style={{ display: 'flex', gap: '4px', marginTop: '8px', alignItems: 'center' }}>
                                                {[...Array(item.importance || 1)].map((_, i) => (
                                                    <div key={i} style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#a855f7' }} />
                                                ))}
                                                {item.isManual && (
                                                    <span style={{ marginLeft: '8px', fontSize: '0.65rem', color: '#a855f7', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                        Anchor Point
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleDelete(item.id)}
                                            style={{ 
                                                background: 'transparent', 
                                                border: 'none', 
                                                color: 'rgba(255,255,255,0.1)', 
                                                cursor: 'pointer',
                                                padding: '4px',
                                                transition: 'color 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.target.style.color = '#ef4444'}
                                            onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.1)'}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="modal-footer" style={{ padding: '16px 24px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                            <Info size={14} />
                            <span>Neural memory extraction occurs automatically every few messages.</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default LoreCodexModal;
