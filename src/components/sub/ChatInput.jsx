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

    return (
        <div className="input-area">
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
