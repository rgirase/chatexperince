import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Check, X, Trash2, FastForward, Image as ImageIcon, RefreshCw, Hammer, Sparkles, Download } from 'lucide-react';

const MessageList = ({ 
    messages, 
    persona, 
    editingMessageId, 
    editContent, 
    setEditContent, 
    onEditStart, 
    onEditSave, 
    onEditCancel, 
    onDeleteMessage, 
    onContinue,
    onResubmit,
    onRepair,
    onCheckStatus,
    isTyping,
    messagesAreaRef,
    isImmersionMode = false
}) => {
    const handleDownload = (url, filename) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || `selfie_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className={`messages-area ${isImmersionMode ? 'immersion-mode' : ''}`} ref={messagesAreaRef}>
            {messages.map((msg, index) => (
                <div key={msg.id || index} className={`message-wrapper ${msg.role} ${isImmersionMode ? 'immersion' : ''}`}>
                    <div className="message-content-group" style={{ maxWidth: isImmersionMode && msg.role === 'ai' ? '100%' : '85%', position: 'relative', overflow: 'visible', width: isImmersionMode && msg.role === 'ai' ? '100%' : 'auto' }}>
                        {/* Swipe Indicators behind bubble */}
                        {!isImmersionMode && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', zIndex: 0, opacity: 0.5, pointerEvents: 'none' }}>
                                <div style={{ color: '#ef4444' }}><Trash2 size={24} /></div>
                                <div style={{ color: '#a855f7' }}><RefreshCw size={24} /></div>
                            </div>
                        )}
                        {msg.role === 'ai' && !msg.isPhoto && !msg.isSystem && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', padding: '0 4px' }}>
                                {!isImmersionMode && (
                                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', border: '1px solid rgba(168, 85, 247, 0.4)', flexShrink: 0 }}>
                                        <img src={msg.personaAvatar || persona.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                )}
                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#a855f7' }}>{msg.personaName || persona.name}</span>
                            </div>
                        )}
                        
                        <motion.div 
                            className={`message-bubble ${msg.role} ${msg.isPhoto ? 'photo-bubble' : ''} ${msg.isMoment ? 'flashback-bubble' : ''} ${isImmersionMode ? 'cinematic' : ''}`}
                            drag={!isImmersionMode ? "x" : false}
                            dragConstraints={{ left: -100, right: 100 }}
                            onDragEnd={(event, info) => {
                                if (!isImmersionMode && info.offset.x < -60) {
                                    onDeleteMessage(msg.id);
                                } else if (!isImmersionMode && info.offset.x > 60) {
                                    if (msg.role === 'user') {
                                        onResubmit(msg.id);
                                    } else if (msg.role === 'ai' && index === messages.length - 1) {
                                        onRepair(msg.id);
                                    }
                                }
                            }}
                            whileDrag={!isImmersionMode ? { scale: 1.02, cursor: 'grabbing' } : {}}
                            style={{ 
                                position: 'relative', 
                                zIndex: 2, 
                                background: isImmersionMode && msg.role === 'ai' ? 'transparent' : undefined,
                                border: isImmersionMode && msg.role === 'ai' ? 'none' : undefined,
                                boxShadow: isImmersionMode && msg.role === 'ai' ? 'none' : undefined,
                                padding: isImmersionMode && msg.role === 'ai' ? '1rem 2rem' : undefined,
                                width: isImmersionMode && msg.role === 'ai' ? '100%' : 'auto',
                                textAlign: isImmersionMode && msg.role === 'ai' ? 'center' : 'left'
                            }}
                        >
                            {msg.isPhoto ? (
                                <div className="photo-container" style={{ margin: isImmersionMode ? '0 auto' : '0', maxWidth: isImmersionMode ? '100%' : '100%' }}>
                                    {msg.url ? (
                                        <>
                                            {msg.url.toLowerCase().endsWith('.mp4') ? (
                                                <video 
                                                    src={msg.url} 
                                                    autoPlay 
                                                    muted 
                                                    loop 
                                                    playsInline 
                                                    style={{ width: '100%', borderRadius: '12px', display: 'block' }} 
                                                />
                                            ) : (
                                                <img src={msg.url} alt="Selfie" style={{ width: '100%', borderRadius: '12px', display: 'block' }} />
                                            )}
                                            <button 
                                                className="download-btn"
                                                onClick={() => handleDownload(msg.url, `selfie_${msg.id}.${msg.url.toLowerCase().endsWith('.mp4') ? 'mp4' : 'png'}`)}
                                                title="Save Media"
                                            >
                                                <Download size={18} />
                                            </button>
                                        </>
                                    ) : (
                                        <div className="photo-loading" style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', padding: '1rem' }}>
                                            <span>Generating selfie...</span>
                                            {msg.comfyPromptId && onCheckStatus && (
                                                <button 
                                                    onClick={() => onCheckStatus(msg.id, msg.comfyPromptId)}
                                                    style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '16px', color: 'white', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', gap: '6px', alignItems: 'center', transition: 'all 0.2s' }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                                >
                                                    <RefreshCw size={14} /> Check Status
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : msg.isSystem ? (
                                <div className="system-message">{msg.content}</div>
                            ) : editingMessageId === msg.id ? (
                                <div className="edit-container">
                                    <textarea 
                                        value={editContent} 
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="edit-input"
                                        autoFocus
                                    />
                                    <div className="edit-actions">
                                        <button onClick={() => onEditSave(msg.id)}><Check size={16} /></button>
                                        <button onClick={onEditCancel}><X size={16} /></button>
                                    </div>
                                </div>
                            ) : (
                                <div 
                                    className={isImmersionMode && msg.role === 'ai' ? 'cinematic-text' : ''}
                                    style={{ 
                                        fontFamily: isImmersionMode && msg.role === 'ai' ? '"Handlee", cursive' : 'inherit',
                                        fontSize: isImmersionMode && msg.role === 'ai' ? '1.4rem' : 'inherit',
                                        lineHeight: isImmersionMode && msg.role === 'ai' ? '1.6' : 'inherit',
                                        color: isImmersionMode && msg.role === 'ai' ? '#fff' : 'inherit',
                                        textShadow: isImmersionMode && msg.role === 'ai' ? '0 2px 10px rgba(0,0,0,0.8)' : 'none'
                                    }}
                                >
                                    {isImmersionMode && msg.role === 'ai' && (
                                        <span style={{ color: '#a855f7', marginRight: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '1rem', verticalAlign: 'middle', fontWeight: 'bold' }}>
                                            {msg.personaName || persona.name}:
                                        </span>
                                    )}
                                    <span dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*(.*?)\*/g, '<em class="action">* $1 *</em>') }} />
                                </div>
                            )}
                        </motion.div>

                        {!msg.isSystem && (
                            <div className={`message-meta-actions ${isImmersionMode ? 'immersion-actions' : ''}`} style={{ opacity: isImmersionMode ? 0.3 : undefined }}>
                                <button onClick={() => onEditStart(msg)} title="Edit"><Edit2 size={12} /></button>
                                <button onClick={() => onDeleteMessage(msg.id)} title="Delete"><Trash2 size={12} /></button>
                                {msg.role === 'user' && (
                                    <button onClick={() => onResubmit(msg.id)} title="Resubmit / Regenerate"><RefreshCw size={12} /></button>
                                )}
                                {msg.role === 'ai' && index === messages.length - 1 && (
                                    <>
                                        <button onClick={() => onRepair(msg.id)} title="Repair response (Force Narrative)"><Hammer size={12} /></button>
                                        <button onClick={() => onContinue(msg)} title="Continue story"><FastForward size={12} /></button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ))}
            {isTyping && (
                <div className="message-wrapper ai">
                    <div className="message-bubble ai typing">
                        <div className="typing-indicator">
                            <div className="typing-dot"></div>
                            <div className="typing-dot"></div>
                            <div className="typing-dot"></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MessageList;
