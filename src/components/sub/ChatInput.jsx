import React, { useState, useRef, useEffect } from 'react';
import { Send, Wand2, Camera, Sparkles, StopCircle } from 'lucide-react';

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
    onSelectSuggestion
}) => {
    const textareaRef = useRef(null);

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
            
            <div className="input-container">
                <button 
                    onClick={onGenerateSuggestion}
                    disabled={isSuggesting || isTyping}
                    className="action-icon-btn"
                    title="Get suggestion"
                >
                    <Wand2 size={20} className={isSuggesting ? 'spin' : ''} />
                </button>
                
                <button 
                    onClick={onOpenSelfiePrompt}
                    disabled={isTyping}
                    className="action-icon-btn"
                    title="Request selfie"
                >
                    <Camera size={20} />
                </button>

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
