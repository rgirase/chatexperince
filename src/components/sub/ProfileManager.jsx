import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, User, Trash2, Check, UserPlus, Fingerprint, Sparkles } from 'lucide-react';

const ProfileManager = ({ isOpen, onClose, profiles, activeProfileId, onSelect, onCreate, onDelete, onUpdate }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        avatar: '',
        age: '',
        occupation: '',
        bio: '',
        interests: ''
    });

    if (!isOpen) return null;

    const handleCreate = (e) => {
        e.preventDefault();
        if (!editForm.name.trim()) return;
        
        const avatarUrl = editForm.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${editForm.name}`;
        onCreate({
            ...editForm,
            id: `u_${Date.now()}`,
            avatar: avatarUrl,
            details: {
                age: editForm.age,
                occupation: editForm.occupation,
                bio: editForm.bio,
                interests: editForm.interests.split(',').map(i => i.trim()).filter(i => i)
            }
        });
        setEditForm({ name: '', avatar: '', age: '', occupation: '', bio: '', interests: '' });
        setIsCreating(false);
    };

    const handleStartEdit = (profile) => {
        setEditForm({
            name: profile.name,
            avatar: profile.avatar,
            age: profile.details?.age || '',
            occupation: profile.details?.occupation || '',
            bio: profile.details?.bio || '',
            interests: (profile.details?.interests || []).join(', ')
        });
        setIsEditing(profile.id);
    };

    const handleUpdate = (e) => {
        e.preventDefault();
        onUpdate({
            id: isEditing,
            name: editForm.name,
            avatar: editForm.avatar,
            details: {
                age: editForm.age,
                occupation: editForm.occupation,
                bio: editForm.bio,
                interests: editForm.interests.split(',').map(i => i.trim()).filter(i => i)
            }
        });
        setIsEditing(false);
        setEditForm({ name: '', avatar: '', age: '', occupation: '', bio: '', interests: '' });
    };

    const activeProfile = profiles.find(p => p.id === activeProfileId);

    return (
        <div className="modal-overlay" style={{ zIndex: 20000 }}>
            <motion.div 
                className="glass-panel"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                style={{
                    width: '95%',
                    maxWidth: (isCreating || isEditing) ? '600px' : '450px', // Expand for form
                    maxHeight: '90vh',
                    background: 'rgba(10, 10, 15, 0.98)',
                    border: '1px solid rgba(168, 85, 247, 0.4)',
                    boxShadow: '0 0 60px rgba(168, 85, 247, 0.15)',
                    padding: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '24px',
                    position: 'relative',
                    transition: 'max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h2 className="premium-gradient-text" style={{ margin: 0, fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Fingerprint size={28} />
                            {isCreating ? 'Birth of an Identity' : isEditing ? 'Refining Your Presence' : 'Profiles'}
                        </h2>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#a1a1aa' }}>
                            {isCreating || isEditing ? 'Give context to your journey in Aura' : 'Who is exploring the Aura today?'}
                        </p>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer', padding: '8px', borderRadius: '50%' }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', marginBottom: '1.5rem' }}>
                    {!isCreating && !isEditing ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                            {profiles.map((profile) => (
                                <motion.div
                                    key={profile.id}
                                    whileHover={{ scale: 1.03, translateY: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => onSelect(profile.id)}
                                    style={{
                                        background: profile.id === activeProfileId ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255,255,255,0.03)',
                                        border: `1px solid ${profile.id === activeProfileId ? '#a855f7' : 'rgba(255,255,255,0.1)'}`,
                                        borderRadius: '20px',
                                        padding: '1.2rem',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        textAlign: 'center',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}
                                >
                                    <div style={{ 
                                        width: '70px', 
                                        height: '70px', 
                                        borderRadius: '50%', 
                                        overflow: 'hidden', 
                                        marginBottom: '12px',
                                        border: `2px solid ${profile.id === activeProfileId ? '#a855f7' : 'transparent'}`,
                                        padding: '3px',
                                        background: 'rgba(255,255,255,0.05)'
                                    }}>
                                        <img src={profile.avatar} alt={profile.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                    </div>
                                    <span style={{ fontWeight: '600', color: profile.id === activeProfileId ? '#fff' : '#d1d5db', fontSize: '0.95rem' }}>{profile.name}</span>
                                    {profile.details?.occupation && (
                                        <span style={{ fontSize: '0.7rem', color: '#71717a', marginTop: '4px' }}>{profile.details.occupation}</span>
                                    )}

                                    <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: '4px' }}>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleStartEdit(profile); }}
                                            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                        >
                                            <Sparkles size={12} />
                                        </button>
                                    </div>

                                    {profile.id === activeProfileId && (
                                        <div style={{ position: 'absolute', top: 10, right: 10, color: '#a855f7' }}>
                                            <Check size={16} />
                                        </div>
                                    )}

                                    {profile.id !== 'default' && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDelete(profile.id); }}
                                            style={{
                                                position: 'absolute',
                                                bottom: 10,
                                                right: 10,
                                                background: 'none',
                                                border: 'none',
                                                color: '#ef4444',
                                                opacity: 0.3,
                                                cursor: 'pointer',
                                                padding: '4px'
                                            }}
                                            className="hover-opacity-100"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </motion.div>
                            ))}

                            <motion.div
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => { setEditForm({ name: '', avatar: '', age: '', occupation: '', bio: '', interests: '' }); setIsCreating(true); }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px dashed rgba(255,255,255,0.2)',
                                    borderRadius: '20px',
                                    padding: '1.2rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minHeight: '135px'
                                }}
                            >
                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '50%', marginBottom: '8px' }}>
                                    <Plus size={24} color="#a1a1aa" />
                                </div>
                                <span style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>New Identity</span>
                            </motion.div>
                        </div>
                    ) : (
                        <motion.form
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            onSubmit={isCreating ? handleCreate : handleUpdate}
                            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}
                        >
                            <div style={{ gridColumn: 'span 2', display: 'flex', gap: '20px', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '16px', marginBottom: '10px' }}>
                                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(0,0,0,0.3)', position: 'relative', overflow: 'hidden' }}>
                                    <img 
                                        src={editForm.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${editForm.name || 'new'}`} 
                                        alt="Preview" 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#71717a', marginBottom: '6px' }}>Identity Name</label>
                                    <input
                                        required
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                        placeholder="How should personas address you?"
                                        style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '10px', color: '#fff', outline: 'none' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: '#71717a', marginBottom: '6px' }}>Age / Season</label>
                                <input
                                    value={editForm.age}
                                    onChange={(e) => setEditForm({...editForm, age: e.target.value})}
                                    placeholder="e.g. 24"
                                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '10px', color: '#fff', outline: 'none' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: '#71717a', marginBottom: '6px' }}>Occupation / Role</label>
                                <input
                                    value={editForm.occupation}
                                    onChange={(e) => setEditForm({...editForm, occupation: e.target.value})}
                                    placeholder="e.g. Digital Artist"
                                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '10px', color: '#fff', outline: 'none' }}
                                />
                            </div>

                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: '#71717a', marginBottom: '6px' }}>Interests (Comma separated)</label>
                                <input
                                    value={editForm.interests}
                                    onChange={(e) => setEditForm({...editForm, interests: e.target.value})}
                                    placeholder="e.g. Cyberpunk, Classical Music, Tech"
                                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '10px', color: '#fff', outline: 'none' }}
                                />
                            </div>

                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: '#71717a', marginBottom: '6px' }}>Personal Narrative / Bio</label>
                                <textarea
                                    value={editForm.bio}
                                    onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                                    placeholder="Briefly describe your persona's history..."
                                    rows={3}
                                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '10px', color: '#fff', outline: 'none', resize: 'none' }}
                                />
                            </div>

                            <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button
                                    type="button"
                                    onClick={() => { setIsCreating(false); setIsEditing(false); }}
                                    style={{ flex: 1, padding: '12px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontWeight: '600' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="premium-gradient-btn"
                                    style={{ flex: 1.5, padding: '12px', borderRadius: '14px', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                >
                                    <Check size={18} />
                                    Save Identity
                                </button>
                            </div>
                        </motion.form>
                    )}
                </div>

                {!isCreating && !isEditing && (
                    <p style={{ margin: 0, textAlign: 'center', fontSize: '0.75rem', color: '#71717a' }}>
                        Switching profiles will reload your active session.
                    </p>
                )}
            </motion.div>
        </div>
    );
};

export default ProfileManager;
