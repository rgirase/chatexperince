import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Check, X, Trash2, FastForward, Image as ImageIcon, RefreshCw, Hammer } from 'lucide-react';

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
    isTyping,
    messagesAreaRef
}) => {
    return (
        <div className="messages-area" ref={messagesAreaRef}>
            {messages.map((msg, index) => (
                <div key={msg.id || index} className={`message-wrapper ${msg.role}`}>
                    <div className="message-content-group" style={{ maxWidth: '85%', position: 'relative' }}>
                        {msg.role === 'ai' && !msg.isPhoto && !msg.isSystem && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', padding: '0 4px' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#a855f7' }}>{persona.name}</span>
                            </div>
                        )}
                        
                        <div className={`message-bubble ${msg.role} ${msg.isPhoto ? 'photo-bubble' : ''}`}>
                            {msg.isPhoto ? (
                                <div className="photo-container">
                                    {msg.url ? (
                                        <img src={msg.url} alt="Selfie" style={{ width: '100%', borderRadius: '12px' }} />
                                    ) : (
                                        <div className="photo-loading">Generating selfie...</div>
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
                                <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*(.*?)\*/g, '<em class="action">* $1 *</em>') }} />
                            )}
                        </div>

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
