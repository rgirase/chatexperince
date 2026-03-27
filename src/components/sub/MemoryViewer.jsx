import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Bookmark, History, X, Flame, MapPin, Zap, Edit2, Check, Trash2, Plus } from 'lucide-react';

const MemoryViewer = ({ 
    isOpen, 
    onClose, 
    persona, 
    memory, 
    milestones, 
    encounterStats, 
    onScanIntimacy,
    onUpdateMemory,
    onUpdateRelation,
    onUpdateMilestones,
    onUpdateEncounters,
    customRelation
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editMemory, setEditMemory] = useState(memory || "");
    const [editRelation, setEditRelation] = useState(customRelation || "");
    const [editMilestones, setEditMilestones] = useState(milestones || []);
    const [editEncounters, setEditEncounters] = useState(encounterStats || { count: 0, history: [] });

    const handleSave = () => {
        onUpdateMemory(editMemory);
        onUpdateRelation(editRelation);
        onUpdateMilestones(editMilestones);
        onUpdateEncounters(editEncounters);
        setIsEditing(false);
    };

    const handleAddMilestone = () => {
        setEditMilestones([...editMilestones, "New milestone observed..."]);
    };

    const handleRemoveMilestone = (index) => {
        setEditMilestones(editMilestones.filter((_, i) => i !== index));
    };

    const handleUpdateMilestone = (index, value) => {
        const newM = [...editMilestones];
        newM[index] = value;
        setEditMilestones(newM);
    };

    const handleUpdateEncounter = (index, field, value) => {
        const newH = [...editEncounters.history];
        newH[index] = { ...newH[index], [field]: value };
        setEditEncounters({ ...editEncounters, history: newH });
    };

    const handleRemoveEncounter = (index) => {
        const newH = editEncounters.history.filter((_, i) => i !== index);
        setEditEncounters({ ...editEncounters, history: newH, count: newH.length });
    };

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
                        <div className="modal-header" style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(23, 23, 23, 0.95)', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Brain className="premium-gradient-text" size={24} />
                                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>AI Memory: {persona.name}</h2>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button 
                                    onClick={() => isEditing ? handleSave() : setIsEditing(true)} 
                                    style={{ 
                                        background: isEditing ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.05)', 
                                        border: '1px solid ' + (isEditing ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.1)'),
                                        color: isEditing ? '#4ade80' : '#a1a1aa',
                                        padding: '6px 12px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        fontSize: '0.8rem',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {isEditing ? <><Check size={16} /> Save</> : <><Edit2 size={16} /> Edit Mode</>}
                                </button>
                                <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                    <X size={24} />
                                </button>
                            </div>
                        </div>
                        
                        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
                            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                {/* STATS SUMMARY */}
                                <section style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                                    <div className="glass-panel" style={{ padding: '0.75rem', minWidth: '100px', flex: 1, textAlign: 'center', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <Flame size={20} color="#f472b6" style={{ marginBottom: '4px' }} />
                                        <div style={{ fontSize: '0.65rem', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '1px' }}>Encounters</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: '800' }}>{isEditing ? editEncounters.count : (encounterStats?.count || 0)}</div>
                                    </div>
                                    <div className="glass-panel" style={{ padding: '0.75rem', minWidth: '130px', flex: 1, textAlign: 'center', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <MapPin size={20} color="#a855f7" style={{ marginBottom: '4px' }} />
                                        <div style={{ fontSize: '0.65rem', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '1px' }}>Last Location</div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: '700', marginTop: '2px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }} title={encounterStats?.lastLocation}>
                                            {encounterStats?.lastLocation || "None yet"}
                                        </div>
                                    </div>
                                    <div className="glass-panel" style={{ padding: '0.75rem', minWidth: '120px', flex: 1, textAlign: 'center', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <Zap size={20} color="#facc15" style={{ marginBottom: '4px' }} />
                                        <div style={{ fontSize: '0.65rem', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '1px' }}>Relation</div>
                                        {isEditing ? (
                                            <input 
                                                value={editRelation}
                                                onChange={(e) => setEditRelation(e.target.value)}
                                                style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#facc15', fontSize: '0.7rem', textAlign: 'center', marginTop: '2px', padding: '2px' }}
                                                placeholder="Role"
                                            />
                                        ) : (
                                            <div style={{ fontSize: '0.85rem', fontWeight: '700', marginTop: '2px', color: '#facc15' }}>
                                                {customRelation || persona.category || "NPC"}
                                            </div>
                                        )}
                                    </div>
                                </section>

                                <section style={{ display: 'block', width: '100%' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a855f7' }}>
                                            <Bookmark size={18} />
                                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold' }}>Long-term Memory</h3>
                                        </div>
                                        {!isEditing && (
                                            <button 
                                                onClick={onScanIntimacy}
                                                style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.2)', color: '#c084fc', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                <Zap size={14} /> Scan Intimacy
                                            </button>
                                        )}
                                    </div>
                                    {isEditing ? (
                                        <textarea 
                                            value={editMemory}
                                            onChange={(e) => setEditMemory(e.target.value)}
                                            style={{ 
                                                width: '100%', 
                                                minHeight: '120px', 
                                                background: 'rgba(0,0,0,0.2)', 
                                                border: '1px solid rgba(255,255,255,0.1)', 
                                                borderRadius: '8px', 
                                                color: '#fff', 
                                                padding: '10px', 
                                                fontSize: '0.85rem', 
                                                lineHeight: '1.5',
                                                resize: 'vertical',
                                                display: 'block'
                                            }}
                                            placeholder="Enter distilled long-term memories..."
                                        />
                                    ) : (
                                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', color: '#ccc', lineHeight: '1.5', wordBreak: 'break-word' }}>
                                            {memory || "No long-term memories have been distilled yet. Keep interacting to build a shared history!"}
                                        </div>
                                    )}
                                </section>

                                <section style={{ display: 'block', width: '100%' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f472b6' }}>
                                            <History size={18} />
                                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold' }}>Shared Milestones</h3>
                                        </div>
                                        {isEditing && (
                                            <button 
                                                onClick={handleAddMilestone}
                                                style={{ background: 'rgba(244, 114, 182, 0.1)', border: '1px solid rgba(244, 114, 182, 0.2)', color: '#f472b6', padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                <Plus size={12} /> Add Milestone
                                            </button>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {(isEditing ? editMilestones : milestones)?.length > 0 ? (isEditing ? editMilestones : milestones).map((m, i) => (
                                            <div key={i} style={{ position: 'relative' }}>
                                                {isEditing ? (
                                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                        <input 
                                                            value={m}
                                                            onChange={(e) => handleUpdateMilestone(i, e.target.value)}
                                                            style={{ flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px', color: '#eee', fontSize: '0.8rem' }}
                                                        />
                                                        <button onClick={() => handleRemoveMilestone(i)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div style={{ background: 'rgba(244, 114, 182, 0.02)', padding: '0.75rem 1rem', borderRadius: '10px', borderLeft: '3px solid #f472b6', fontSize: '0.8rem', color: '#eee', lineHeight: '1.4' }}>
                                                        {m.content || m}
                                                    </div>
                                                )}
                                            </div>
                                        )) : (
                                            <p style={{ color: '#71717a', fontSize: '0.8rem', fontStyle: 'italic', textAlign: 'center', padding: '0.5rem' }}>No significant milestones recorded yet.</p>
                                        )}
                                    </div>
                                </section>

                                {(isEditing ? editEncounters.history : encounterStats?.history)?.length > 0 && (
                                    <section style={{ display: 'block', width: '100%' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: '#10b981' }}>
                                            <Flame size={18} />
                                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold' }}>Intimacy History</h3>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {(isEditing ? editEncounters.history : encounterStats.history).map((h, i) => (
                                                <div key={i} style={{ 
                                                    background: 'rgba(16, 185, 129, 0.02)', 
                                                    padding: '0.75rem 1rem', 
                                                    borderRadius: '12px', 
                                                    border: '1px solid rgba(16, 185, 129, 0.08)', 
                                                    fontSize: '0.85rem',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '8px',
                                                    position: 'relative',
                                                    overflow: 'hidden'
                                                }}>
                                                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: '#10b981' }} />
                                                    
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                                                            <MapPin size={12} color="#10b981" />
                                                            {isEditing ? (
                                                                <input 
                                                                    value={h.location}
                                                                    onChange={(e) => handleUpdateEncounter(i, 'location', e.target.value)}
                                                                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px', padding: '2px 6px', color: '#10b981', fontSize: '0.8rem', fontWeight: '700', width: '120px' }}
                                                                />
                                                            ) : (
                                                                <span style={{ color: '#10b981', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                                    {h.location || "Private Encounter"}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{ color: '#71717a', fontSize: '0.7rem' }}>
                                                                {new Date(h.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                            {isEditing && (
                                                                <button onClick={() => handleRemoveEncounter(i)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}>
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {isEditing ? (
                                                        <input 
                                                            value={h.summary}
                                                            onChange={(e) => handleUpdateEncounter(i, 'summary', e.target.value)}
                                                            style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', padding: '6px', color: '#d1d5db', fontSize: '0.8rem' }}
                                                        />
                                                    ) : (
                                                        <div style={{ color: '#d1d5db', lineHeight: '1.4', fontSize: '0.85rem' }}>
                                                            {h.summary}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}
                                <div style={{ height: '3rem' }} /> {/* GENEROUS SPACING AT BOTTOM */}
                            </div>
                        </div>
                        
                        <div className="modal-footer" style={{ textAlign: 'center', color: '#52525b', fontSize: '0.75rem', padding: '1.5rem' }}>
                            {isEditing ? "Exit Edit Mode to scan for new intimacy or milestones automatically." : "Memories and milestones help the AI maintain personality continuity over time."}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default MemoryViewer;
