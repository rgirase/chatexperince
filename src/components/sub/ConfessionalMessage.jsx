import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Eye, ShieldAlert } from 'lucide-react';

const ConfessionalMessage = ({ content, isImmersionMode = false }) => {
    const [isShattered, setIsShattered] = useState(false);

    // Parse the dual-voice content
    const publicMatch = content.match(/\[PUBLIC\](.*?)\[PRIVATE\]/is);
    const privateMatch = content.match(/\[PRIVATE\](.*?)$/is);

    const publicText = publicMatch ? publicMatch[1].trim() : content;
    const privateText = privateMatch ? privateMatch[1].trim() : "";

    const shatterVariants = {
        initial: { opacity: 1, scale: 1 },
        shattered: { 
            opacity: 0, 
            scale: 1.5,
            transition: { duration: 0.4, ease: "easeOut" }
        }
    };

    const textVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { delay: 0.3, duration: 0.5 }
        }
    };

    if (!privateText) {
        return (
            <div className={isImmersionMode ? 'cinematic-text' : ''}>
                <span dangerouslySetInnerHTML={{ __html: content.replace(/\*(.*?)\*/g, '<em class="action">* $1 *</em>') }} />
            </div>
        );
    }

    return (
        <div className="confessional-msg-container" style={{ position: 'relative', overflow: 'hidden', minHeight: '60px' }}>
            <AnimatePresence mode="wait">
                {!isShattered ? (
                    <motion.div 
                        key="public"
                        className="public-layer"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsShattered(true)}
                        style={{ 
                            cursor: 'pointer', 
                            padding: '12px',
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '12px',
                            border: '1px solid rgba(168, 85, 247, 0.2)',
                            position: 'relative'
                        }}
                    >
                        {/* Stained Glass Overlay Effect */}
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)',
                            backdropFilter: 'blur(2px)',
                            zIndex: 1,
                            pointerEvents: 'none',
                            borderRadius: '11px'
                        }} />
                        
                        <div style={{ position: 'relative', zIndex: 2, display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1, color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>
                                <span dangerouslySetInnerHTML={{ __html: publicText.replace(/\*(.*?)\*/g, '<em class="action">* $1 *</em>') }} />
                            </div>
                            <div className="shatter-hint" style={{ color: '#a855f7', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <Eye size={16} />
                                <span style={{ fontSize: '0.6rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Confess</span>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="private"
                        className="private-layer"
                        variants={textVariants}
                        initial="hidden"
                        animate="visible"
                        style={{ 
                            padding: '12px',
                            borderLeft: '3px solid #ef4444',
                            background: 'linear-gradient(to right, rgba(239, 68, 68, 0.05), transparent)',
                            borderRadius: '0 12px 12px 0'
                        }}
                    >
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', color: '#ef4444' }}>
                            <ShieldAlert size={14} />
                            <span style={{ fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>The Corrupted Truth</span>
                        </div>
                        <div style={{ fontSize: '1.05rem', color: '#fff', fontWeight: '500', lineHeight: '1.5' }}>
                            <span dangerouslySetInnerHTML={{ __html: privateText.replace(/\*(.*?)\*/g, '<em class="action">* $1 *</em>') }} />
                        </div>
                        <div style={{ marginTop: '10px', fontSize: '0.7rem', color: 'rgba(239, 68, 68, 0.4)', textAlign: 'right', fontStyle: 'italic' }}>
                            — Sister Grace's Desires —
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Shatter Animation Pieces (Visual Only) */}
            <AnimatePresence>
                {isShattered && (
                    <motion.div 
                        style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none' }}
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        {[...Array(8)].map((_, i) => (
                            <motion.div
                                key={i}
                                style={{
                                    position: 'absolute',
                                    width: '20px',
                                    height: '20px',
                                    background: i % 2 === 0 ? 'rgba(168, 85, 247, 0.4)' : 'rgba(236, 72, 153, 0.4)',
                                    clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                                    left: `${Math.random() * 80 + 10}%`,
                                    top: `${Math.random() * 80 + 10}%`
                                }}
                                initial={{ rotate: 0, scale: 1, opacity: 1 }}
                                animate={{ 
                                    rotate: Math.random() * 360, 
                                    scale: 0,
                                    x: (Math.random() - 0.5) * 200,
                                    y: (Math.random() - 0.5) * 200,
                                    opacity: 0
                                }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ConfessionalMessage;
