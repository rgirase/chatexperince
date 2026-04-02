import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, MessageCircle, Share2, MoreVertical, Play, Pause } from 'lucide-react';

const StatusViewer = ({ persona, status, onClose }) => {
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const duration = 5000; // 5 seconds per status

    useEffect(() => {
        let timer;
        if (!isPaused && progress < 100) {
            timer = setInterval(() => {
                setProgress(prev => {
                    const next = prev + (100 / (duration / 100));
                    if (next >= 100) {
                        clearInterval(timer);
                        onClose();
                        return 100;
                    }
                    return next;
                });
            }, 100);
        }
        return () => clearInterval(timer);
    }, [isPaused, progress, onClose]);

    const handleTouchStart = () => setIsPaused(true);
    const handleTouchEnd = () => setIsPaused(false);

    if (!status) return null;

    const isVideo = status.image?.toLowerCase().endsWith('.mp4');

    return (
        <motion.div 
            className="status-viewer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                background: '#000',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                touchAction: 'none'
            }}
        >
            {/* Progress Bars */}
            <div style={{ 
                position: 'absolute', 
                top: '15px', 
                left: '10px', 
                right: '10px', 
                display: 'flex', 
                gap: '4px', 
                zIndex: 10 
            }}>
                <div style={{ 
                    flex: 1, 
                    height: '2px', 
                    background: 'rgba(255,255,255,0.3)', 
                    borderRadius: '2px',
                    overflow: 'hidden'
                }}>
                    <motion.div 
                        style={{ 
                            height: '100%', 
                            background: '#fff', 
                            width: `${progress}%` 
                        }} 
                    />
                </div>
            </div>

            {/* Header */}
            <div style={{ 
                position: 'absolute', 
                top: '30px', 
                left: '10px', 
                right: '10px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                zIndex: 10,
                padding: '0 10px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #f472b6' }}>
                        <img src={persona.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                        <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.9rem' }}>{persona.name}</div>
                        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>{status.timestamp || 'Just now'}</div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '15px', color: '#fff' }}>
                    <MoreVertical size={20} />
                    <X size={24} onClick={onClose} style={{ cursor: 'pointer' }} />
                </div>
            </div>

            {/* Media Content */}
            <div 
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
                onMouseDown={handleTouchStart}
                onMouseUp={handleTouchEnd}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onClick={(e) => e.stopPropagation()}
            >
                {isVideo ? (
                    <video 
                        src={status.image} 
                        autoPlay 
                        muted 
                        loop 
                        playsInline 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                ) : (
                    <img 
                        src={status.image || persona.image} 
                        alt="" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                )}

                {/* Status Text Overlay */}
                <div style={{ 
                    position: 'absolute', 
                    bottom: '80px', 
                    left: '20px', 
                    right: '20px', 
                    textAlign: 'center',
                    zIndex: 10
                }}>
                    <p style={{ 
                        color: '#fff', 
                        fontSize: '1.1rem', 
                        textShadow: '0 2px 10px rgba(0,0,0,0.8)',
                        background: 'rgba(0,0,0,0.4)',
                        padding: '12px',
                        borderRadius: '12px',
                        backdropFilter: 'blur(10px)',
                        display: 'inline-block'
                    }}>
                        {status.status}
                    </p>
                </div>
            </div>

            {/* Footer / Actions */}
            <div style={{ 
                padding: '20px', 
                background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                display: 'flex',
                justifyContent: 'center',
                gap: '40px',
                zIndex: 10
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', color: '#fff' }}>
                    <Heart size={24} color={status.likes > 0 ? "#f472b6" : "#fff"} fill={status.likes > 0 ? "#f472b6" : "transparent"} />
                    <span style={{ fontSize: '0.7rem' }}>{status.likes || 0}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', color: '#fff' }}>
                    <MessageCircle size={24} />
                    <span style={{ fontSize: '0.7rem' }}>{status.comments?.length || 0}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', color: '#fff' }}>
                    <Share2 size={24} />
                    <span style={{ fontSize: '0.7rem' }}>Reply</span>
                </div>
            </div>
        </motion.div>
    );
};

export default StatusViewer;
