import React from 'react';
import { ArrowLeft, MoreVertical, Heart, Gift, Shirt, Book, History, Trash2, Home, Sparkles, Zap, Flame, UserPlus, Wand2, MapPin } from 'lucide-react';

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
    invitedPersona
}) => {
    return (
        <header className="chat-header">
            <button onClick={onBack} className="back-btn" title="Back to Personas">
                <ArrowLeft size={24} />
            </button>
            <div className="chat-avatar-wrapper" style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img src={activePersonaImage || persona.image} alt={persona.name} className="chat-avatar" />
                    {invitedPersona && (
                        <img 
                            src={invitedPersona.image} 
                            alt={invitedPersona.name} 
                            className="chat-avatar" 
                            style={{ marginLeft: '-12px', border: '2px solid var(--chat-bg)', zIndex: 1 }} 
                        />
                    )}
                </div>
                <div className="status-online-indicator"></div>
            </div>
            <div className="chat-header-info" style={{ flex: 1 }}>
                <h3 className="premium-gradient-text" style={{ margin: 0, fontSize: '1rem' }}>
                    {persona.name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#22c55e', fontWeight: '500' }}>Online</p>
                    <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }}></span>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#a1a1aa' }}>{relationshipScore}%</p>
                </div>
            </div>
            <div className="chat-header-actions" style={{ display: 'flex', gap: '4px' }}>
                <button 
                    onClick={onOpenStoryMap}
                    className="header-action-btn"
                    style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#a855f7', border: '1px solid rgba(139, 92, 246, 0.2)', padding: '6px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', marginRight: '4px' }}
                    title="Progress"
                >
                    <Heart size={16} fill="#a855f7" />
                </button>
                
                <div style={{ position: 'relative' }}>
                    <button 
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="header-action-btn"
                        style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: '0.5rem' }}
                    >
                        <MoreVertical size={24} />
                    </button>
                    
                    {isMobileMenuOpen && (
                        <div className="glass-panel" style={{ position: 'absolute', top: '100%', right: 0, width: '220px', zIndex: 1000, padding: '0.5rem', marginTop: '0.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                            <button onClick={onOpenHistory} className="menu-item"><History size={18} /> Chat History</button>
                            <button onClick={onOpenJournal} className="menu-item"><Book size={18} /> Diary / Journal</button>
                            <button onClick={onOpenGifts} className="menu-item"><Gift size={18} /> Send Gift</button>
                            <button onClick={onOpenWardrobe} className="menu-item"><Shirt size={18} /> Wardrobe</button>
                            
                            <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '0.5rem 0' }}></div>
                            
                            <button onClick={onScenarioShuffle} className="menu-item"><Wand2 size={18} color="#eab308" /> Shuffle Scenario</button>
                            <button onClick={onSceneChange} className="menu-item"><MapPin size={18} color="#a855f7" /> Change Scene</button>
                            <button onClick={onGenerateSceneImage} className="menu-item"><Sparkles size={18} color="#f472b6" /> Magic Lens</button>
                            
                            {persona.id === 'amira_velvet_club' && (
                                <button onClick={onOpenFantasyLibrary} className="menu-item" style={{ color: '#f472b6' }}><Sparkles size={18} /> Fantasy Library</button>
                            )}
                            
                            <button onClick={onOpenInvite} className="menu-item"><UserPlus size={18} /> {invitedPersona ? 'Manage Scene' : 'Invite Character'}</button>
                            
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
                            
                            <button onClick={onClearChat} className="menu-item" style={{ color: '#f43f5e' }}><Trash2 size={18} /> Reset Chat</button>
                            <button onClick={onGoHome} className="menu-item"><Home size={18} /> Exit to Home</button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default ChatHeader;
