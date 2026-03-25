import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Send, X } from 'lucide-react';
import * as relationshipService from '../../services/relationship';

const StatusInteraction = ({ persona, status, onClose }) => {
    const [likes, setLikes] = useState(status.likes || 0);
    const [hasLiked, setHasLiked] = useState(false);
    const [comments, setComments] = useState(status.comments || []);
    const [newComment, setNewComment] = useState('');
    const [isCommenting, setIsCommenting] = useState(false);

    const handleLike = (e) => {
        e.stopPropagation();
        if (!hasLiked) {
            setLikes(prev => prev + 1);
            setHasLiked(true);
            // Small bond boost for liking
            relationshipService.addAffection(persona.id, 1);
        }
    };

    const handleAddComment = (e) => {
        e.stopPropagation();
        if (newComment.trim()) {
            const comment = { user: "You", text: newComment };
            setComments(prev => [...prev, comment]);
            setNewComment('');
            setIsCommenting(false);
            // Bond boost for commenting
            relationshipService.addAffection(persona.id, 2);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            style={{
                position: 'absolute',
                bottom: '120px',
                left: '20px',
                width: '280px',
                background: 'rgba(15, 15, 20, 0.98)',
                backdropFilter: 'blur(20px)',
                padding: '20px',
                borderRadius: '24px',
                border: '1px solid #f472b6',
                zIndex: 1000,
                boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
                color: '#fff',
                pointerEvents: 'auto'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ color: '#f472b6', fontSize: '0.65rem', fontWeight: '900', textTransform: 'uppercase' }}>
                    Recent Status • {status.timestamp}
                </div>
                <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer', padding: 0 }}>
                    <X size={14} />
                </button>
            </div>

            <div style={{ fontStyle: 'italic', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '16px', color: '#e4e4e7' }}>
                "{status.status}"
            </div>

            <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                <button 
                    onClick={handleLike}
                    style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        background: 'transparent', 
                        border: 'none', 
                        color: hasLiked ? '#ec4899' : '#a1a1aa',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: '600'
                    }}
                >
                    <Heart size={16} fill={hasLiked ? '#ec4899' : 'none'} /> {likes}
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); setIsCommenting(!isCommenting); }}
                    style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        background: 'transparent', 
                        border: 'none', 
                        color: '#a1a1aa',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: '600'
                    }}
                >
                    <MessageCircle size={16} /> {comments.length}
                </button>
            </div>

            <AnimatePresence>
                {isCommenting && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden', marginTop: '12px' }}
                    >
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input 
                                type="text"
                                placeholder="Write a comment..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    flex: 1,
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    padding: '8px 12px',
                                    color: '#fff',
                                    fontSize: '0.8rem',
                                    outline: 'none'
                                }}
                            />
                            <button 
                                onClick={handleAddComment}
                                style={{ 
                                    background: '#f472b6', 
                                    border: 'none', 
                                    borderRadius: '12px', 
                                    padding: '8px',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                <Send size={14} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {comments.length > 0 && !isCommenting && (
                <div style={{ marginTop: '12px', maxHeight: '60px', overflowY: 'auto', fontSize: '0.75rem' }}>
                    {comments.map((c, i) => (
                        <div key={i} style={{ marginBottom: '4px', color: '#a1a1aa' }}>
                            <span style={{ fontWeight: '700', color: '#f472b6' }}>{c.user}:</span> {c.text}
                        </div>
                    ))}
                </div>
            )}

            {/* Arrow */}
            <div style={{ position: 'absolute', bottom: '-20px', left: '25px', width: 0, height: 0, borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: '10px solid #f472b6' }}></div>
        </motion.div>
    );
};

export default StatusInteraction;
