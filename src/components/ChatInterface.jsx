import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ChatHeader from './sub/ChatHeader';
import MessageList from './sub/MessageList';
import ChatInput from './sub/ChatInput';
import MemoryViewer from './sub/MemoryViewer';
import GiftsModal from './sub/GiftsModal';
import WardrobeModal from './sub/WardrobeModal';
import SelfiePromptModal from './sub/SelfiePromptModal';
import FantasyGallery from './FantasyGallery';
import StoryMap from './StoryMap';
import ArchiveModal from './sub/ArchiveModal';
import { useChatLogic } from '../hooks/useChatLogic';
import { useImageGeneration } from '../hooks/useImageGeneration';
import { getLocation } from '../services/LocationService';
import LocationSwitcher from './sub/LocationSwitcher';
import * as db from '../services/db';
import InviteModal from './sub/InviteModal';

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
    const [isArchiveOpen, setIsArchiveOpen] = useState(false);
    const [isLocationSwitcherOpen, setIsLocationSwitcherOpen] = useState(false);
    
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
        currentLocationId,
        activePersonaImage,
        currentSuggestions, setCurrentSuggestions,
        invitedPersona, setInvitedPersona,
        handleSendMessage,
        handleStopGeneration,
        handleGenerateSuggestion,
        handleSendGift,
        handleSetOutfit,
        handleScanIntimacy,
        handleGenerateSceneImage,
        handleSceneChange,
        handleLocationChange,
        handleScenarioShuffle,
        handleSelectFantasy,
        handleClearChat: handleClearChatLogic,
        handleResubmit,
        handleRepair,
        handleContinue,
        handleUpdateMemory,
        handleUpdateRelation,
        handleUpdateMilestones,
        handleUpdateEncounters,
        customRelation
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
        handleClearChatLogic();
    };

    const handleConfirmSelfie = (prompt) => {
        setIsSelfiePromptOpen(false);
        generateSelfie(prompt, Date.now().toString());
    };

    const handleSelectSuggestion = (text) => {
        handleSendMessage(text);
        setCurrentSuggestions([]);
    };

    const handleFantasySelect = (fantasy) => {
        setIsFantasyGalleryOpen(false);
        handleSelectFantasy(fantasy);
    };

    const currentBg = getLocation(currentLocationId)?.image || '/assets/locations/home_morning.jpg';

    return (
        <div 
            className="chat-container"
            style={{ 
                backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${currentBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed'
            }}
        >
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
                onOpenHistory={() => setIsArchiveOpen(true)}
                onOpenStoryMap={() => setIsStoryMapOpen(true)}
                onGenerateSceneImage={handleGenerateSceneImage}
                onSceneChange={() => setIsLocationSwitcherOpen(true)}
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
                onContinue={handleContinue}
                onResubmit={handleResubmit}
                onRepair={handleRepair}
                isTyping={isTyping}
                messagesAreaRef={messagesAreaRef}
            />

            <ChatInput 
                input={input}
                setInput={setInput}
                onSendMessage={() => handleSendMessage()}
                onSelectSuggestion={handleSelectSuggestion}
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
                        onUpdateMemory={handleUpdateMemory}
                        onUpdateRelation={handleUpdateRelation}
                        onUpdateMilestones={handleUpdateMilestones}
                        onUpdateEncounters={handleUpdateEncounters}
                        customRelation={customRelation}
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
                    <InviteModal 
                        isOpen={isInviteModalOpen}
                        onClose={() => setIsInviteModalOpen(false)}
                        allPersonas={allPersonas}
                        currentPersona={persona}
                        invitedPersona={invitedPersona}
                        onInvite={setInvitedPersona}
                        onRemove={() => setInvitedPersona(null)}
                    />
                )}

                {isLocationSwitcherOpen && (
                    <LocationSwitcher 
                        currentLocationId={currentLocationId}
                        onSelect={(id) => {
                            handleLocationChange(id);
                            setIsLocationSwitcherOpen(false);
                        }}
                        onClose={() => setIsLocationSwitcherOpen(false)}
                    />
                )}
                {isArchiveOpen && (
                    <ArchiveModal 
                        isOpen={isArchiveOpen}
                        onClose={() => setIsArchiveOpen(false)}
                        currentPersonaId={persona.id}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChatInterface;
