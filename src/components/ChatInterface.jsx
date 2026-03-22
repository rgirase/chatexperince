import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatHeader from './sub/ChatHeader';
import MessageList from './sub/MessageList';
import ChatInput from './sub/ChatInput';
import MemoryViewer from './sub/MemoryViewer';
import GiftsModal from './sub/GiftsModal';
import WardrobeModal from './sub/WardrobeModal';
import SelfiePromptModal from './sub/SelfiePromptModal';
import FantasyGallery from './FantasyGallery';
import StoryMap from './StoryMap';
import { useChatLogic } from '../hooks/useChatLogic';
import { useImageGeneration } from '../hooks/useImageGeneration';

const ChatInterface = ({ persona, allPersonas, onBack, onGoHome, onSelectImage }) => {
    // --- UI VIEW STATE ---
    const [toasts, setToasts] = useState([]);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMemoryViewerOpen, setIsMemoryViewerOpen] = useState(false);
    const [isStoryMapOpen, setIsStoryMapOpen] = useState(false);
    const [isGiftsModalOpen, setIsGiftsModalOpen] = useState(false);
    const [isWardrobeOpen, setIsWardrobeOpen] = useState(false);
    const [isSelfiePromptOpen, setIsSelfiePromptOpen] = useState(false);
    const [isFantasyGalleryOpen, setIsFantasyGalleryOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    
    // --- EDITING STATE ---
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const messagesAreaRef = useRef(null);

    // --- UTILS ---
    const showToast = (message, type = 'error') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2000);
    };

    // --- CUSTOM HOOKS ---
    // We use a ref for setMessages to break the circular dependency between hooks
    const setMessagesRef = useRef(null);

    const { generateSelfie } = useImageGeneration(
        persona, 
        (updater) => {
            if (setMessagesRef.current) setMessagesRef.current(updater);
        }, 
        showToast
    );

    const {
        messages, setMessages,
        input, setInput,
        isTyping,
        isSuggesting,
        relationshipScore,
        memory,
        intensity, setIntensity,
        milestones,
        encounterStats,
        currentSituation,
        activePersonaImage,
        currentSuggestions,
        invitedPersona, setInvitedPersona,
        handleSendMessage,
        handleStopGeneration,
        handleGenerateSuggestion,
        handleSendGift,
        handleSetOutfit,
        handleScanIntimacy,
        handleGenerateSceneImage,
        handleSceneChange,
        handleScenarioShuffle,
        handleSelectFantasy,
        handleClearChat: handleClearChatLogic,
        handleResubmit
    } = useChatLogic(persona, showToast, generateSelfie);

    // Update the ref whenever setMessages changes
    useEffect(() => {
        setMessagesRef.current = setMessages;
    }, [setMessages]);

    // --- EVENT HANDLERS ---
    const scrollToBottom = () => {
        if (messagesAreaRef.current) {
            messagesAreaRef.current.scrollTop = messagesAreaRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleEditStart = (msg) => {
        setEditingMessageId(msg.id);
        setEditContent(msg.content);
    };

    const handleEditSave = (id) => {
        setMessages(prev => prev.map(msg => msg.id === id ? { ...msg, content: editContent } : msg));
        setEditingMessageId(null);
    };

    const handleDeleteMessage = (id) => {
        if (window.confirm("Delete this message?")) {
            setMessages(prev => prev.filter(msg => msg.id !== id));
        }
    };

    const handleClearChat = () => {
        if (window.confirm("Are you sure you want to archive and clear this chat history? This cannot be undone.")) {
            handleClearChatLogic();
        }
    };

    const handleConfirmSelfie = (prompt) => {
        setIsSelfiePromptOpen(false);
        generateSelfie(prompt, Date.now().toString());
    };

    const handleFantasySelect = (fantasy) => {
        setIsFantasyGalleryOpen(false);
        handleSelectFantasy(fantasy);
    };

    return (
        <div className="chat-container">
            {/* TOASTS */}
            <div className="toast-container">
                <AnimatePresence>
                    {toasts.map(toast => (
                        <motion.div 
                            key={toast.id}
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            className={`toast ${toast.type}`}
                        >
                            {toast.message}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <ChatHeader 
                persona={persona}
                activePersonaImage={activePersonaImage}
                onBack={onBack}
                onGoHome={onGoHome}
                onClearChat={handleClearChat}
                onOpenJournal={() => setIsMemoryViewerOpen(true)}
                onOpenGifts={() => setIsGiftsModalOpen(true)}
                onOpenWardrobe={() => setIsWardrobeOpen(true)}
                onOpenHistory={() => showToast("Loading archives...", "info")}
                onOpenStoryMap={() => setIsStoryMapOpen(true)}
                onGenerateSceneImage={handleGenerateSceneImage}
                onSceneChange={handleSceneChange}
                onScenarioShuffle={handleScenarioShuffle}
                onOpenFantasyLibrary={() => setIsFantasyGalleryOpen(true)}
                onOpenInvite={() => setIsInviteModalOpen(true)}
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
                relationshipScore={relationshipScore}
                intensity={intensity}
                setIntensity={setIntensity}
                invitedPersona={invitedPersona}
            />

            <MessageList 
                messages={messages}
                persona={persona}
                editingMessageId={editingMessageId}
                editContent={editContent}
                setEditContent={setEditContent}
                onEditStart={handleEditStart}
                onEditSave={handleEditSave}
                onEditCancel={() => setEditingMessageId(null)}
                onDeleteMessage={handleDeleteMessage}
                onContinue={(msg) => handleSendMessage("[Continue this thought...]")}
                onResubmit={handleResubmit}
                isTyping={isTyping}
                messagesAreaRef={messagesAreaRef}
            />

            <ChatInput 
                input={input}
                setInput={setInput}
                onSendMessage={() => handleSendMessage()}
                onGenerateSuggestion={handleGenerateSuggestion}
                onOpenSelfiePrompt={() => setIsSelfiePromptOpen(true)}
                isTyping={isTyping}
                isSuggesting={isSuggesting}
                onStopGeneration={handleStopGeneration}
                suggestions={currentSuggestions}
            />

            <AnimatePresence>
                {/* MODALS */}
                {isMemoryViewerOpen && (
                    <MemoryViewer 
                        isOpen={isMemoryViewerOpen}
                        onClose={() => setIsMemoryViewerOpen(false)}
                        persona={persona}
                        memory={memory}
                        milestones={milestones}
                        encounterStats={encounterStats}
                        onScanIntimacy={handleScanIntimacy}
                    />
                )}
                
                {isStoryMapOpen && (
                    <StoryMap 
                        persona={persona}
                        milestones={milestones}
                        onClose={() => setIsStoryMapOpen(false)}
                    />
                )}

                {isGiftsModalOpen && (
                    <GiftsModal 
                        isOpen={isGiftsModalOpen}
                        onClose={() => setIsGiftsModalOpen(false)}
                        onSendGift={handleSendGift}
                    />
                )}

                {isWardrobeOpen && (
                    <WardrobeModal 
                        isOpen={isWardrobeOpen}
                        onClose={() => setIsWardrobeOpen(false)}
                        persona={persona}
                        relationshipScore={relationshipScore}
                        onSetOutfit={handleSetOutfit}
                    />
                )}

                {isSelfiePromptOpen && (
                    <SelfiePromptModal 
                        isOpen={isSelfiePromptOpen}
                        onClose={() => setIsSelfiePromptOpen(false)}
                        onConfirm={handleConfirmSelfie}
                    />
                )}

                {isFantasyGalleryOpen && (
                    <FantasyGallery 
                        onSelectFantasy={handleFantasySelect}
                        onClose={() => setIsFantasyGalleryOpen(false)}
                    />
                )}

                {isInviteModalOpen && (
                    <div className="modal-overlay" onClick={() => setIsInviteModalOpen(false)}>
                        <motion.div 
                            className="modal-content glass-panel" 
                            onClick={(e) => e.stopPropagation()}
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            style={{ maxWidth: '400px' }}
                        >
                            <div className="modal-header">
                                <h3 style={{ margin: 0, color: '#38bdf8' }}>Invite to Scene</h3>
                                <button onClick={() => setIsInviteModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}>X</button>
                            </div>
                            <div className="modal-body">
                                {invitedPersona ? (
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ marginBottom: '1rem', color: '#d4d4d8' }}>{invitedPersona.name} is currently in the scene.</p>
                                        <button
                                            onClick={() => { setInvitedPersona(null); setIsInviteModalOpen(false); }}
                                            style={{ padding: '0.8rem 1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '12px', cursor: 'pointer', width: '100%', fontWeight: 'bold' }}
                                        >Remove {invitedPersona.name}</button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                                        {allPersonas && allPersonas.filter(p => p.id !== persona.id).map(p => (
                                            <div key={p.id} onClick={() => { setInvitedPersona(p); setIsInviteModalOpen(false); }} style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.2s ease' }}>
                                                <img src={p.image} alt={p.name} style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '12px', objectFit: 'cover' }} />
                                                <span style={{ color: '#f3f4f6', fontWeight: '600' }}>{p.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChatInterface;
