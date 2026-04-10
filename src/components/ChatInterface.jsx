import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ChatHeader from './sub/ChatHeader';
import MessageList from './sub/MessageList';
import ChatInput from './sub/ChatInput';
import MemoryViewer from './sub/MemoryViewer';
import GiftsModal from './sub/GiftsModal';
import WardrobeModal from './sub/WardrobeModal';
import SelfiePromptModal from './sub/SelfiePromptModal';
import FantasyGallery from './FantasyGallery';
import SessionManager from './sub/SessionManager';
import { useChatLogic } from '../hooks/useChatLogic';
import StoryMap from './sub/StoryMap';
import { useImageGeneration } from '../hooks/useImageGeneration';
import { getLocation } from '../services/LocationService';
import { generateVisualPrompt, generateComicPanels } from '../services/llm';
import LocationSwitcher from './sub/LocationSwitcher';
import * as db from '../services/db';
import ParticleEffect from './sub/ParticleEffect';
import InviteModal from './sub/InviteModal';
import GalleryModal from './sub/GalleryModal';
import AdultActionsModal from './sub/AdultActionsModal';
import InventoryModal from './sub/InventoryModal';
import DirectorSettingsModal from './sub/DirectorSettingsModal';
import ActionLibraryModal from './sub/ActionLibraryModal';
import LogViewerModal from './sub/LogViewerModal';

const ChatInterface = ({ persona, allPersonas, onBack, onGoHome, onSelectImage, scenario }) => {
    // --- UI VIEW STATE ---
    const [toasts, setToasts] = useState([]);
    const [activeEffect, setActiveEffect] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMemoryViewerOpen, setIsMemoryViewerOpen] = useState(false);
    const [isStoryMapOpen, setIsStoryMapOpen] = useState(false);
    const [isGiftsModalOpen, setIsGiftsModalOpen] = useState(false);
    const [isWardrobeOpen, setIsWardrobeOpen] = useState(false);
    const [isSelfiePromptOpen, setIsSelfiePromptOpen] = useState(false);
    const [isFantasyGalleryOpen, setIsFantasyGalleryOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [isArchiveOpen, setIsArchiveOpen] = useState(false);
    const [isLocationSwitcherOpen, setIsLocationSwitcherOpen] = useState(false);
    const [isAdultActionsOpen, setIsAdultActionsOpen] = useState(false);
    const [isInventoryOpen, setIsInventoryOpen] = useState(false); // Character Core 2.0
    const [isImmersionMode, setIsImmersionMode] = useState(false); // Phase 4
    const [isDirectorOpen, setIsDirectorOpen] = useState(false);   // Phase 4
    const [isActionLibraryOpen, setIsActionLibraryOpen] = useState(false); // Phase 4
    const [isLogViewerOpen, setIsLogViewerOpen] = useState(false); // New log viewer
    
    // Phase 7 WhatsApp UI
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [statusImage, setStatusImage] = useState(null);


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

    const { generateSelfie, generateComicStrip } = useImageGeneration(
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
        handleUpdateEncounters,
        handlePerformAdultAction, 
        customRelation,
        allSessions,
        sessionId,
        startNewSession,
        switchSession,
        deleteSession,
        chapterRecap,
        currentMood,
        inventory,
        handleInvitePersona,
        handleRemovePersona,
        handlePlotTwist,
        setInventory,
        setCurrentMood,
        narrativeSettings,
        setNarrativeSettings
    } = useChatLogic(persona, showToast, scenario, generateSelfie);

    // --- NEW: Per-Message Illustration logic ---
    const handleIllustrateMessage = useCallback(async (msg) => {
        showToast("Imagining this moment...", "info");
        try {
            // Find context (preceding messages)
            const msgIdx = messages.findIndex(m => m.id === msg.id);
            const context = messages.slice(Math.max(0, msgIdx - 4), msgIdx);
            
            const { generateMomentPrompt } = await import('../services/llm');
            const visualPrompt = await generateMomentPrompt(persona, msg, context);
            
            if (!visualPrompt) throw new Error("Could not visualize this moment.");
            
            // Trigger generation as a new photo message
            await generateSelfie(
                visualPrompt, 
                Date.now().toString(), 
                'portrait', 
                localStorage.getItem('preferredComicModel'), '', '', 'none', 'natural', true, false, false, null, 'none', 'none'
            );
        } catch (e) {
            console.error("[Illustrate] Failed:", e);
            showToast(e.message || "Failed to illustrate moment.", "error");
        }
    }, [messages, persona, generateSelfie, showToast]);

    // Update the ref whenever setMessages changes
    useEffect(() => {
        setMessagesRef.current = setMessages;
    }, [setMessages]);

    const handleOpenStatus = useCallback(() => {
        // Find last message with a URL (generated image)
        const lastMediaMsg = [...messages].reverse().find(msg => msg.url && msg.url.length > 20);
        const imgToShow = lastMediaMsg ? lastMediaMsg.url : (activePersonaImage || persona.image);
        setStatusImage(imgToShow);
        setIsStatusOpen(true);
    }, [messages, persona.image, activePersonaImage]);

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

    const handleConfirmSelfie = (prompt, aspectRatio, selectedModel, clothing, color, skin, lighting, realismHigh, isAnimated, isComic = false, comicPanelInfo = null, piercing = 'none', tattoo = 'none') => {
        setIsSelfiePromptOpen(false);
        generateSelfie(prompt, Date.now().toString(), aspectRatio, selectedModel, clothing, color, skin, lighting, realismHigh, isAnimated, isComic, comicPanelInfo, piercing, tattoo);
    };

    const handleGenerateComic = async () => {
        await generateComicStrip(messages);
    };

    const handleCheckStatus = async (msgId, promptId, panelIndex = null) => {
        try {
            showToast("Checking ComfyUI status...", "info");
            const sdUrl = localStorage.getItem('sdUrl') || 'http://127.0.0.1:8188';
            const histRes = await fetch(`${sdUrl.replace(/\/$/, '')}/history/${promptId}`);
            
            if (!histRes.ok) {
                showToast("Still generating, or prompt not found in history.", "info");
                return;
            }

            const histData = await histRes.json();
            
            if (histData && histData[promptId]) {
                const outputs = histData[promptId].outputs;
                for (const nodeId in outputs) {
                    if (outputs[nodeId].images && outputs[nodeId].images.length > 0) {
                        const paramsObj = new URLSearchParams(outputs[nodeId].images[0]);
                        const viewRes = await fetch(`${sdUrl.replace(/\/$/, '')}/view?${paramsObj.toString()}`);
                        const blob = await viewRes.blob();
                        const base64Image = await new Promise((resolve) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result);
                            reader.readAsDataURL(blob);
                        });
                        
                        setMessages(prev => prev.map(msg => {
                            if (msg.id === msgId) {
                                if (panelIndex !== null && msg.isComicStrip) {
                                    const newPanels = [...(msg.panels || [])];
                                    if (newPanels[panelIndex]) {
                                        newPanels[panelIndex].url = base64Image;
                                    }
                                    return { ...msg, panels: newPanels };
                                }
                                return { ...msg, url: base64Image };
                            }
                            return msg;
                        }));
                        showToast(panelIndex !== null ? "Panel recovered successfully!" : "Selfie recovered successfully!", "success");
                        return;
                    }
                }
            } else {
                showToast("Still processing in ComfyUI queue...", "warning");
            }
        } catch (error) {
            console.error("Recovery check failed:", error);
            showToast("Failed to connect to ComfyUI.", "error");
        }
    };

    const handleSelectSuggestion = (text) => {
        handleSendMessage(text);
        setCurrentSuggestions([]);
    };

    const handleSendGiftWithEffect = (gift) => {
        let type = 'hearts';
        if (gift.name.toLowerCase().includes('diamond') || gift.name.toLowerCase().includes('gold')) type = 'sparkles';
        if (gift.name.toLowerCase().includes('vacation') || gift.name.toLowerCase().includes('car')) type = 'confetti';
        
        setActiveEffect({ type, id: Date.now() });
        handleSendGift(gift);
    };

    const handleFantasySelect = (fantasy) => {
        setIsFantasyGalleryOpen(false);
        handleSelectFantasy(fantasy);
    };

    const currentBg = getLocation(currentLocationId)?.image || '/assets/locations/home_morning.jpg';

    return (
        <div 
            className={`chat-container ${persona.id}`}
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

            {/* PARTICLE EFFECTS OVERLAY */}
            {activeEffect && (
                <ParticleEffect 
                    key={activeEffect.id} 
                    type={activeEffect.type} 
                    onComplete={() => setActiveEffect(null)} 
                />
            )}

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
                onOpenGallery={() => setIsGalleryOpen(true)}
                onOpenStoryMap={() => setIsStoryMapOpen(true)}
                onOpenStatus={handleOpenStatus}
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
                currentMood={currentMood}
                memory={memory}
                onOpenMemory={() => setIsMemoryViewerOpen(true)}
                onOpenInventory={() => setIsInventoryOpen(true)}
                isImmersionMode={isImmersionMode}
                onToggleImmersion={() => setIsImmersionMode(!isImmersionMode)}
                onOpenDirector={() => setIsDirectorOpen(true)}
                onOpenActionLibrary={() => setIsActionLibraryOpen(true)}
                onGenerateComic={handleGenerateComic}
                onOpenLogs={() => setIsLogViewerOpen(true)}
                customRelation={customRelation}
                onUpdateRelation={handleUpdateRelation}
            />

            <MessageList 
                messages={messages}
                persona={persona}
                isImmersionMode={isImmersionMode}
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
                onCheckStatus={handleCheckStatus}
                onIllustrateMessage={handleIllustrateMessage}
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
                onOpenAdultActions={() => setIsAdultActionsOpen(true)}
                isImmersionMode={isImmersionMode}
            />

            <AnimatePresence>
                {/* Status Viewer Overlay */}
                {isStatusOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        onClick={() => setIsStatusOpen(false)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.95)',
                            zIndex: 20000,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '20px',
                            backdropFilter: 'blur(20px)'
                        }}
                    >
                        {/* Progress Bar (WA Style) */}
                        <div style={{ position: 'absolute', top: '20px', left: '10px', right: '10px', display: 'flex', gap: '4px' }}>
                            <div style={{ flex: 1, height: '2px', background: 'rgba(255,255,255,0.8)', borderRadius: '2px' }} />
                        </div>

                        {/* Top Bar */}
                        <div style={{ position: 'absolute', top: '35px', left: '20px', right: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img src={activePersonaImage || persona.image} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)' }} />
                            <div>
                                <h4 style={{ margin: 0, color: 'white', fontSize: '1rem' }}>{persona.name}</h4>
                                <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>Latest Story Update</p>
                            </div>
                        </div>

                        <img 
                            src={statusImage} 
                            alt="Status" 
                            style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 10px 50px rgba(0,0,0,0.5)' }} 
                        />

                        {/* Hint */}
                        <div style={{ position: 'absolute', bottom: '40px', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                            Tap anywhere to close
                        </div>
                    </motion.div>
                )}

                {/* MODALS */}
                {isMemoryViewerOpen && (
                    <MemoryViewer 
                        isOpen={isMemoryViewerOpen}
                        onClose={() => setIsMemoryViewerOpen(false)}
                        persona={persona}
                        memory={memory}
                        onUpdateMemory={handleUpdateMemory}
                        onUpdateRelation={handleUpdateRelation}
                        onUpdateEncounters={handleUpdateEncounters}
                        customRelation={customRelation}
                        relationshipScore={relationshipScore}
                        sessionId={sessionId}
                    />
                )}
                

                {isGiftsModalOpen && (
                    <GiftsModal 
                        isOpen={isGiftsModalOpen}
                        onClose={() => setIsGiftsModalOpen(false)}
                        onSendGift={handleSendGiftWithEffect}
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
                        onInvite={handleInvitePersona}
                        allPersonas={allPersonas}
                        currentPersona={persona}
                        invitedPersona={invitedPersona}
                        onRemove={handleRemovePersona}
                    />
                )}

                {isGalleryOpen && (
                    <GalleryModal 
                        isOpen={isGalleryOpen}
                        onClose={() => setIsGalleryOpen(false)}
                        persona={persona}
                        messages={messages}
                    />
                )}

                {isArchiveOpen && (
                    <SessionManager
                        isOpen={isArchiveOpen}
                        onClose={() => setIsArchiveOpen(false)}
                        sessions={allSessions}
                        currentSessionId={sessionId}
                        onSwitch={(sid) => {
                            switchSession(sid);
                            setIsArchiveOpen(false);
                        }}
                        onStartNew={() => {
                            startNewSession();
                            setIsArchiveOpen(false);
                        }}
                        onBranch={() => {
                            handleBranchSession();
                            setIsArchiveOpen(false);
                        }}
                        onDelete={deleteSession}
                        personaName={persona.name}
                        currentRecap={chapterRecap}
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

                {isStoryMapOpen && (
                    <StoryMap 
                        isOpen={isStoryMapOpen}
                        onClose={() => setIsStoryMapOpen(false)}
                        sessions={allSessions}
                        persona={persona}
                        currentSessionId={sessionId}
                    />
                )}

                {isAdultActionsOpen && (
                    <AdultActionsModal 
                        isOpen={isAdultActionsOpen}
                        onClose={() => setIsAdultActionsOpen(false)}
                        onConfirm={handlePerformAdultAction}
                        relationshipScore={relationshipScore}
                    />
                )}

                {/* Phase 4 & RPG Update Modals */}
                {isDirectorOpen && (
                    <DirectorSettingsModal 
                        isOpen={isDirectorOpen}
                        onClose={() => setIsDirectorOpen(false)}
                        settings={narrativeSettings}
                        onUpdate={setNarrativeSettings}
                        onPlotTwist={handlePlotTwist}
                    />
                )}

                {isActionLibraryOpen && (
                    <ActionLibraryModal 
                        isOpen={isActionLibraryOpen}
                        onClose={() => setIsActionLibraryOpen(false)}
                        persona={persona}
                        onExecuteAction={handlePerformAdultAction}
                    />
                )}

                {isInventoryOpen && (
                    <InventoryModal 
                        isOpen={isInventoryOpen}
                        onClose={() => setIsInventoryOpen(false)}
                        items={inventory}
                        personaName={persona.name}
                    />
                )}

                {isLogViewerOpen && (
                    <LogViewerModal 
                        isOpen={isLogViewerOpen}
                        onClose={() => setIsLogViewerOpen(false)}
                        messages={messages}
                        personaName={persona.name}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChatInterface;
