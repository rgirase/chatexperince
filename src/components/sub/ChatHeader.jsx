import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft, Heart, Gift, Shirt, Book, History, Trash2, Home, Sparkles, 
    Flame, UserPlus, Wand2, MapPin, Map as MapIcon, Image as ImageIcon, MessageSquare, 
    Users, MoreVertical, Brain, Package, Sliders, Eye, EyeOff, Camera, BookOpen, Terminal
} from 'lucide-react';
import AuraPulse from './AuraPulse';
import MoodOverlay from './MoodOverlay';
import MoodMeter from './MoodMeter';
import { getRelationshipLabel } from '../../services/reputation';

const ChatHeader = ({ 
    persona, 
    activePersonaImage, 
    onBack, 
    onGoHome, 
    onClearChat, 
    onOpenJournal, 
    onOpenGifts, 
    onOpenWardrobe, 
    onOpenHistory,
    onOpenStoryMap,
    onOpenGallery,
    onOpenStatus,
    onGenerateSceneImage,
    onSceneChange,
    onScenarioShuffle,
    onOpenFantasyLibrary,
    onOpenInvite,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    relationshipScore,
    intensity,
    setIntensity,
    invitedPersona,
    currentMood, // Character Core 2.0
    memory, // Character Core 2.0
    onOpenMemory, // Character Core 2.0
    onOpenInventory, // Character Core 2.0
    isImmersionMode, // Phase 4
    onToggleImmersion, // Phase 4
    onOpenDirector, // Phase 4
    onOpenActionLibrary, // Phase 4
    onGenerateComic, // New Feature
    onOpenLogs
}) => {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMobileMenuOpen(false);
            }
        };

        if (isMobileMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMobileMenuOpen, setIsMobileMenuOpen]);

    return (
        <header className="chat-header">
            <button onClick={onBack} className="back-btn" title="Back to Personas">
                <ArrowLeft size={24} />
            </button>
            <div 
                className="chat-avatar-wrapper" 
                onClick={onOpenStatus}
                style={{ position: 'relative', cursor: 'pointer' }}
            >
                <AuraPulse score={relationshipScore} intensity={intensity} />
                <MoodOverlay score={relationshipScore} intensity={intensity} mood={currentMood} />
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img 
                        src={activePersonaImage || persona.image} 
                        alt={persona.name} 
                        className={`chat-avatar ${intensity >= 5 ? 'avatar-shadow-intense' : ''}`}
                        onError={(e) => {
                            if (e.target.src !== persona.image) {
                                e.target.src = persona.image;
                            }
                        }}
                    />
                    {invitedPersona && (
                        <img 
                            src={invitedPersona.image} 
                            alt={invitedPersona.name} 
                            className="chat-avatar" 
                            style={{ marginLeft: '-12px', border: '2px solid var(--chat-bg)', zIndex: 1 }} 
                        />
                    )}
                </div>
                <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', zIndex: 2 }}>
                    <MoodMeter mood={currentMood} isBadge={true} />
                </div>
                <div className="status-online-indicator"></div>
            </div>
            <div 
                className="chat-header-info" 
                onClick={onOpenGallery}
                style={{ flex: 1, cursor: 'pointer', minWidth: 0, overflow: 'hidden' }}
                title="Open Chat Gallery"
            >
                <h3 className="premium-gradient-text" style={{ 
                    margin: 0, 
                    fontSize: '1rem', 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    width: '100%'
                }}>
                    {persona.name}{invitedPersona ? ` & ${invitedPersona.name}` : ''}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#22c55e', fontWeight: '500', whiteSpace: 'nowrap' }}>Online</p>
                    <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', flexShrink: 0 }}></span>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#a1a1aa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getRelationshipLabel(relationshipScore)}</p>
                </div>
            </div>
            <div className="chat-header-actions" style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ position: 'relative' }} ref={menuRef}>
                    <button 
                        onClick={onGenerateComic} 
                        className="header-action-btn"
                        title="Generate Comic Story Image"
                        style={{ 
                            background: 'rgba(244, 114, 182, 0.1)', 
                            color: '#f472b6', 
                            border: '1px solid rgba(244, 114, 182, 0.2)', 
                            padding: '6px', 
                            borderRadius: '10px' 
                        }}
                    >
                        <BookOpen size={20} />
                    </button>

                    <button 
                        onClick={onToggleImmersion} 
                        className="header-action-btn"
                        title={isImmersionMode ? "Exit Immersion" : "Enter Immersion"}
                        style={{ 
                            background: isImmersionMode ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.05)', 
                            color: isImmersionMode ? 'var(--primary-color)' : '#fff', 
                            border: `1px solid ${isImmersionMode ? 'var(--primary-color)' : 'rgba(255, 255, 255, 0.1)'}`, 
                            padding: '6px', 
                            borderRadius: '10px' 
                        }}
                    >
                        {isImmersionMode ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                    <button 
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                        className="header-action-btn"
                        style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '6px', borderRadius: '10px' }}
                    >
                        <MoreVertical size={20} />
                    </button>

                    <AnimatePresence>
                        {isMobileMenuOpen && (
                            <>
                                {/* Invisible Backdrop to close on click outside */}
                                <div 
                                    style={{ position: 'fixed', inset: 0, zIndex: 999 }} 
                                    onClick={() => setIsMobileMenuOpen(false)}
                                />
                                <motion.div 
                                    className="chat-dropdown-menu"
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    style={{
                                        position: 'absolute',
                                        top: '100%',
                                        right: 0,
                                        marginTop: '10px',
                                        zIndex: 1000,
                                        transformOrigin: 'top right',
                                        width: '220px'
                                    }}
                                >
                                    <div style={{ padding: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.7rem', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Intel & Mood</span>
                                            <span style={{ fontSize: '0.7rem', color: '#a855f7', fontWeight: 'bold' }}>{currentMood}</span>
                                        </div>
                                    </div>
                                    
                                    <button onClick={() => { onOpenMemory(); setIsMobileMenuOpen(false); }} className="menu-item" style={{ color: '#3b82f6' }}><Brain size={18} /> Chat Intel Brain</button>
                                    <button onClick={() => { onOpenInventory(); setIsMobileMenuOpen(false); }} className="menu-item" style={{ color: '#fbbf24' }}><Package size={18} /> Collection / Inventory</button>
                                    
                                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '0.5rem 0' }}></div>
                                    <span style={{ padding: '0 0.75rem', fontSize: '0.65rem', color: '#71717a', textTransform: 'uppercase' }}>Narrative Engine</span>
                                    <button onClick={() => { onOpenDirector(); setIsMobileMenuOpen(false); }} className="menu-item" style={{ color: '#22c55e' }}><Sliders size={18} /> Narrative Director</button>
                                    <button onClick={() => { onOpenActionLibrary(); setIsMobileMenuOpen(false); }} className="menu-item" style={{ color: '#f472b6' }}><Camera size={18} /> Action & Pose Studio</button>
                                    <button onClick={() => { onOpenStoryMap(); setIsMobileMenuOpen(false); }} className="menu-item" style={{ color: '#ec4899' }}><Heart size={18} /> Relationship Map</button>
                                    <button onClick={() => { onOpenJournal(); setIsMobileMenuOpen(false); }} className="menu-item"><Book size={18} /> Memory Journal</button>
                                    <button onClick={() => { onOpenHistory(); setIsMobileMenuOpen(false); }} className="menu-item"><History size={18} /> All Chat Sessions</button>
                                    
                                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '0.5rem 0' }}></div>
                                    <span style={{ padding: '0 0.75rem', fontSize: '0.65rem', color: '#71717a', textTransform: 'uppercase' }}>Character Media</span>
                                    <button onClick={() => { onOpenGallery(); setIsMobileMenuOpen(false); }} className="menu-item" style={{ color: '#c084fc' }}><ImageIcon size={18} /> Chat Media Gallery</button>
                                    <button onClick={() => { onOpenWardrobe(); setIsMobileMenuOpen(false); }} className="menu-item"><Shirt size={18} /> Wardrobe</button>
                                    <button onClick={() => { onOpenGifts(); setIsMobileMenuOpen(false); }} className="menu-item"><Gift size={18} /> Send a Gift</button>
                                    
                                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '0.5rem 0' }}></div>
                                    
                                    <button onClick={() => { onGenerateComic(); setIsMobileMenuOpen(false); }} className="menu-item" style={{ color: '#f472b6' }}><BookOpen size={18} /> Comic Story Image</button>
                                    <button onClick={() => { onGenerateSceneImage(); setIsMobileMenuOpen(false); }} className="menu-item" style={{ color: '#a855f7' }}><Wand2 size={18} /> Generate Scene Look</button>
                                    <button onClick={() => { onOpenStoryMap(); setIsMobileMenuOpen(false); }} className="menu-item"><MapIcon size={18} /> Story Progression Map</button>
                                    <button onClick={() => { onSceneChange(); setIsMobileMenuOpen(false); }} className="menu-item"><MapPin size={18} /> Change Location</button>
                                    <button onClick={() => { onScenarioShuffle(); setIsMobileMenuOpen(false); }} className="menu-item"><Sparkles size={18} /> Shuffle Scenario</button>
                                    
                                    {persona.category === "Fantasy" && (
                                        <button onClick={() => { onOpenFantasyLibrary(); setIsMobileMenuOpen(false); }} className="menu-item" style={{ color: '#f472b6' }}><Sparkles size={18} /> Fantasy Library</button>
                                    )}
                                    
                                    <button onClick={() => { onOpenInvite(); setIsMobileMenuOpen(false); }} className="menu-item"><UserPlus size={18} /> {invitedPersona ? 'Manage Scene' : 'Invite Character'}</button>
                                    
                                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '0.5rem 0' }}></div>
                                    
                                    <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <span style={{ fontSize: '0.75rem', color: '#a1a1aa', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Flame size={14} color={intensity > 3 ? '#f43f5e' : '#a1a1aa'} /> Heat Level: {intensity}
                                        </span>
                                        <input 
                                            type="range" 
                                            min="1" 
                                            max="5" 
                                            value={intensity} 
                                            onChange={(e) => setIntensity(parseInt(e.target.value))}
                                            style={{ width: '100%', height: '4px', borderRadius: '2px', appearance: 'none', background: 'rgba(255,255,255,0.1)', outline: 'none' }}
                                        />
                                    </div>
    
                                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '0.5rem 0' }}></div>
                                    <span style={{ padding: '0 0.75rem', fontSize: '0.65rem', color: '#71717a', textTransform: 'uppercase' }}>System & Debug</span>
                                    <button onClick={() => { onOpenLogs(); setIsMobileMenuOpen(false); }} className="menu-item" style={{ color: '#39a2db' }}><Terminal size={18} /> System Logs (Mobile Console)</button>
                                    <button onClick={() => { onClearChat(); setIsMobileMenuOpen(false); }} className="menu-item" style={{ color: '#f43f5e' }}><Trash2 size={18} /> Reset Chat</button>
                                    <button onClick={() => { onGoHome(); setIsMobileMenuOpen(false); }} className="menu-item"><Home size={18} /> Exit to Home</button>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
};

export default ChatHeader;
