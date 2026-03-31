import React, { useState, useRef, useEffect } from 'react';
import { Send, Wand2, Camera, Sparkles, StopCircle, Flame, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ChatInput = ({ 
    input, 
    setInput, 
    onSendMessage, 
    onGenerateSuggestion, 
    onOpenSelfiePrompt, 
    isTyping, 
    isSuggesting, 
    onStopGeneration,
    suggestions = [],
    onOpenAdultActions,
    onSelectSuggestion
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const textareaRef = useRef(null);
    const menuRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [input]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSendMessage();
        }
    };

    const quickActions = [
        { label: 'Hug', icon: '🤗', prompt: "*I pull you into a warm, tight hug, holding you close.*" },
        { label: 'Tease', icon: '😏', prompt: "*I give you a playful, lingering look, a mischievous smirk on my lips.*" },
        { label: 'Gift', icon: '🎁', prompt: "I have something special for you..." },
        { label: 'Scene', icon: '🗺️', prompt: "I was thinking we could go somewhere else..." },
        { label: 'Memory', icon: '💭', prompt: "Do you remember when we..." }
    ];

    return (
        <div className="input-area">
            <div className="quick-actions-container" style={{ display: 'flex', gap: '8px', marginBottom: '8px', overflowX: 'auto', padding: '4px 0', scrollbarWidth: 'none' }}>
                {quickActions.map((action, i) => (
                    <button 
                        key={i} 
                        onClick={() => {
                            if (action.label === 'Gift') {
                                // This could trigger the gift modal, but for now we'll just send text
                                setInput(action.prompt);
                            } else {
                                setInput(action.prompt);
                                // We don't auto-send so the user can edit if they want
                            }
                        }}
                        className="quick-action-chip"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 12px',
                            borderRadius: '16px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#fff',
                            fontSize: '0.75rem',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        <span>{action.icon}</span>
                        <span>{action.label}</span>
                    </button>
                ))}
            </div>

            {suggestions.length > 0 && (
                <div className="suggestions-container" style={{ display: 'flex', gap: '8px', marginBottom: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
                    {suggestions.map((s, i) => (
                        <button 
                            key={i} 
                            onClick={() => onSelectSuggestion(s)}
                            className="suggestion-bubble"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}
            
            <div className="input-container" style={{ position: 'relative' }}>
                {/* ACTION HUB TOGGLE */}
                <div ref={menuRef} style={{ display: 'flex', alignItems: 'center' }}>
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        disabled={isTyping}
                        className={`action-icon-btn toggle-btn ${isMenuOpen ? 'active' : ''}`}
                        title="Actions"
                        style={{ color: isMenuOpen ? '#a855f7' : '#fff', transition: 'all 0.3s ease' }}
                    >
                        <motion.div animate={{ rotate: isMenuOpen ? 45 : 0 }}>
                            <Plus size={22} />
                        </motion.div>
                    </button>

                    <AnimatePresence>
                        {isMenuOpen && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                animate={{ opacity: 1, y: -60, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                className="action-hub-vertical"
                                style={{
                                    position: 'absolute',
                                    bottom: '10px',
                                    left: '8px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px',
                                    padding: '12px',
                                    background: 'rgba(20, 20, 25, 0.9)',
                                    backdropFilter: 'blur(20px)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '20px',
                                    boxShadow: '0 10px 40px rgba(0,0,0,0.5), 0 0 20px rgba(168, 85, 247, 0.1)',
                                    zIndex: 100
                                }}
                            >
                                <button 
                                    onClick={() => { onGenerateSuggestion(); setIsMenuOpen(false); }}
                                    className="hub-item"
                                    title="Get Suggestion"
                                    style={{ color: '#a855f7' }}
                                >
                                    <Wand2 size={20} className={isSuggesting ? 'spin' : ''} />
                                </button>
                                
                                <button 
                                    onClick={() => { onOpenAdultActions(); setIsMenuOpen(false); }}
                                    className="hub-item"
                                    title="🔥 Erotic Action"
                                    style={{ color: '#ef4444' }}
                                >
                                    <Flame size={20} />
                                </button>

                                <button 
                                    onClick={() => { onOpenSelfiePrompt(); setIsMenuOpen(false); }}
                                    className="hub-item"
                                    title="Request Selfie"
                                    style={{ color: '#f472b6' }}
                                >
                                    <Camera size={20} />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="message-input"
                    rows="1"
                />

                {isTyping ? (
                    <button onClick={onStopGeneration} className="send-btn stop" title="Stop generating">
                        <StopCircle size={20} />
                    </button>
                ) : (
                    <button 
                        onClick={onSendMessage} 
                        disabled={!input.trim() || isTyping} 
                        className="send-btn"
                        title="Send message"
                    >
                        <Send size={20} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default ChatInput;
