import React, { memo } from 'react';
import MessageItem from './MessageItem';

const MessageList = memo(({ 
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
    onOpenRefinement,
    onIllustrateMessage,
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
                <MessageItem 
                    key={msg.id || index}
                    msg={msg}
                    index={index}
                    isLast={index === messages.length - 1}
                    persona={persona}
                    isImmersionMode={isImmersionMode}
                    editingMessageId={editingMessageId}
                    editContent={editContent}
                    setEditContent={setEditContent}
                    onEditStart={onEditStart}
                    onEditSave={onEditSave}
                    onEditCancel={onEditCancel}
                    onDeleteMessage={onDeleteMessage}
                    onContinue={onContinue}
                    onResubmit={onResubmit}
                    onRepair={onRepair}
                    onCheckStatus={onCheckStatus}
                    onOpenRefinement={onOpenRefinement}
                    onIllustrateMessage={onIllustrateMessage}
                    handleDownload={handleDownload}
                />
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
});

export default MessageList;
