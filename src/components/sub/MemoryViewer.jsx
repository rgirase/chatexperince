import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Bookmark, History, X, Flame, MapPin, Zap } from 'lucide-react';

const MemoryViewer = ({ isOpen, onClose, persona, memory, milestones, encounterStats, onScanIntimacy }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="modal-overlay" onClick={onClose}>
                    <motion.div 
                        className="modal-content glass-panel" 
                        onClick={(e) => e.stopPropagation()}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        style={{ maxWidth: '600px' }}
                    >
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Brain className="premium-gradient-text" size={24} />
                                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>AI Memory: {persona.name}</h2>
                            </div>
                            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            {/* STATS SUMMARY */}
                            <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                                <div className="glass-panel" style={{ padding: '1rem', minWidth: '140px', flex: 1, textAlign: 'center', background: 'rgba(255, 255, 255, 0.03)' }}>
                                    <Flame size={20} color="#f472b6" style={{ marginBottom: '8px' }} />
                                    <div style={{ fontSize: '0.75rem', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '1px' }}>Encounters</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{encounterStats?.count || 0}</div>
                                </div>
                                <div className="glass-panel" style={{ padding: '1rem', minWidth: '140px', flex: 1, textAlign: 'center', background: 'rgba(255, 255, 255, 0.03)' }}>
                                    <MapPin size={20} color="#a855f7" style={{ marginBottom: '8px' }} />
                                    <div style={{ fontSize: '0.75rem', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '1px' }}>Last Location</div>
                                    <div style={{ fontSize: '1rem', fontWeight: '700', marginTop: '4px' }}>{encounterStats?.lastLocation || "None yet"}</div>
                                </div>
                            </div>

                            <section>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a855f7' }}>
                                        <Bookmark size={18} />
                                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold' }}>Long-term Memory</h3>
                                    </div>
                                    <button 
                                        onClick={onScanIntimacy}
                                        style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.2)', color: '#c084fc', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                    >
                                        <Zap size={14} /> Scan Intimacy
                                    </button>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem', color: '#ccc', lineHeight: '1.6' }}>
                                    {memory || "No long-term memories have been distilled yet. Keep interacting to build a shared history!"}
                                </div>
                            </section>

                            <section>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: '#f472b6' }}>
                                    <History size={18} />
                                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold' }}>Shared Milestones</h3>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {milestones && milestones.length > 0 ? milestones.map((m, i) => (
                                        <div key={i} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', borderLeft: '4px solid #f472b6', fontSize: '0.85rem', color: '#eee' }}>
                                            {m.content || m}
                                        </div>
                                    )) : (
                                        <p style={{ color: '#71717a', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>No significant milestones recorded yet.</p>
                                    )}
                                </div>
                            </section>

                            {encounterStats?.history?.length > 0 && (
                                <section>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: '#10b981' }}>
                                        <Flame size={18} />
                                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold' }}>Intimacy History</h3>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {encounterStats.history.map((h, i) => (
                                            <div key={i} style={{ background: 'rgba(16, 185, 129, 0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.1)', fontSize: '0.85rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>{h.location || "Private Moment"}</span>
                                                    <span style={{ color: '#52525b', fontSize: '0.75rem' }}>{new Date(h.timestamp).toLocaleDateString()}</span>
                                                </div>
                                                <div style={{ color: '#a1a1aa' }}>{h.summary}</div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                        
                        <div className="modal-footer" style={{ textAlign: 'center', color: '#52525b', fontSize: '0.75rem' }}>
                            Memories and milestones help the AI maintain personality continuity over time.
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default MemoryViewer;
