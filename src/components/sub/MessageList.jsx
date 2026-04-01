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
    messagesAreaRef
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
        <div className="messages-area" ref={messagesAreaRef}>
            {messages.map((msg, index) => (
                <div key={msg.id || index} className={`message-wrapper ${msg.role}`}>
                    <div className="message-content-group" style={{ maxWidth: '85%', position: 'relative', overflow: 'visible' }}>
                        {/* Swipe Indicators behind bubble */}
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', zIndex: 0, opacity: 0.5 }}>
                            <div style={{ color: '#ef4444' }}><Trash2 size={24} /></div>
                            <div style={{ color: '#a855f7' }}><RefreshCw size={24} /></div>
                        </div>
                        {msg.role === 'ai' && !msg.isPhoto && !msg.isSystem && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', padding: '0 4px' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#a855f7' }}>{persona.name}</span>
                            </div>
                        )}
                        
                        <motion.div 
                            className={`message-bubble ${msg.role} ${msg.isPhoto ? 'photo-bubble' : ''} ${msg.isMoment ? 'flashback-bubble' : ''}`}
                            drag="x"
                            dragConstraints={{ left: -100, right: 100 }}
                            onDragEnd={(event, info) => {
                                if (info.offset.x < -60) {
                                    onDeleteMessage(msg.id);
                                } else if (info.offset.x > 60) {
                                    // Regenerate logic: 
                                    // If AI, repair/regenerate. If User, resubmit.
                                    if (msg.role === 'user') {
                                        onResubmit(msg.id);
                                    } else if (msg.role === 'ai' && index === messages.length - 1) {
                                        onRepair(msg.id);
                                    }
                                }
                            }}
                            whileDrag={{ scale: 1.02, cursor: 'grabbing' }}
                            style={{ position: 'relative', zIndex: 2 }}
                        >
                            {msg.isPhoto ? (
                                <div className="photo-container">
                                    {msg.url ? (
                                        <>
                                            <img src={msg.url} alt="Selfie" style={{ width: '100%', borderRadius: '12px', display: 'block' }} />
                                            <button 
                                                className="download-btn"
                                                onClick={() => handleDownload(msg.url, `selfie_${msg.id}.png`)}
                                                title="Save Image"
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
                            ) : msg.isMoment ? (
                                <div className="flashback-content">
                                    <div className="flashback-header">
                                        <Sparkles size={14} className="premium-gradient-text" />
                                        <span>Moment of Truth</span>
                                    </div>
                                    <div className="flashback-body">
                                        {msg.content}
                                    </div>
                                    <div className="flashback-footer">
                                        A shared memory that lingers...
                                    </div>
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
                                <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*(.*?)\*/g, '<em class="action">* $1 *</em>') }} />
                            )}
                        </motion.div>

                        {!msg.isSystem && (
                            <div className="message-meta-actions">
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
