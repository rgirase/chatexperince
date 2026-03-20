import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Book, X, History, Clock, Map as MapIcon, Trash2 } from 'lucide-react';
import { personas } from '../data/personas';
import { getRandomStatus } from '../data/statusUpdates';
import StoryMap from './StoryMap';
import { deleteDiaryEntry } from '../services/memory';

const SkeletonCard = () => (
    <div className="persona-card full-bleed skeleton" style={{ height: '380px', borderRadius: '16px' }}>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1.5rem', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}>
            <div className="skeleton" style={{ height: '1.5rem', width: '60%', borderRadius: '4px', marginBottom: '0.5rem' }}></div>
            <div className="skeleton" style={{ height: '1rem', width: '80%', borderRadius: '4px' }}></div>
        </div>
    </div>
);

const CharacterCard = ({ persona, onSelectPersona, onOpenStoryMap, onOpenDiary, itemVariants }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const hasDiary = localStorage.getItem(`diaries_${persona.id}`);

    return (
        <motion.div
            className={`persona-card ${!imageLoaded ? 'skeleton' : ''}`}
            variants={itemVariants}
            whileHover={{ y: -10, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectPersona(persona)}
            style={{
                backgroundImage: (imageLoaded && !imageError) ? `url(${persona.image})` : 'linear-gradient(135deg, #27272a, #09090b)',
                backgroundColor: '#111',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '24px',
                cursor: 'pointer',
                height: '420px',
                border: '1px solid rgba(255,255,255,0.05)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}
        >
            <img 
                src={persona.image} 
                className="no-select"
                style={{ display: 'none' }} 
                onLoad={() => setImageLoaded(true)} 
                onError={() => {
                    setImageError(true);
                    setImageLoaded(true);
                }}
                alt=""
            />

            <div style={{
                position: 'absolute',
                inset: 0,
                background: imageError 
                    ? 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.2) 50%, rgba(255,255,255,0.02) 100%)'
                    : 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 30%, transparent 60%)',
                zIndex: 1,
                opacity: imageLoaded ? 1 : 0,
                transition: 'opacity 0.3s ease'
            }}></div>

            {imageError && (
                <div style={{
                    position: 'absolute',
                    top: '40%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 1,
                    textAlign: 'center',
                    width: '100%',
                    padding: '0 2rem'
                }}>
                    <div style={{ 
                        fontSize: '3rem', 
                        marginBottom: '1rem',
                        opacity: 0.3
                    }}>✨</div>
                </div>
            )}

            <div className="persona-info" style={{ 
                position: 'relative', 
                zIndex: 2, 
                display: 'flex', 
                flexDirection: 'column', 
                height: '100%', 
                justifyContent: 'flex-end', 
                padding: '1.25rem',
                opacity: imageLoaded ? 1 : 0,
                transition: 'opacity 0.3s ease'
            }}>
                <div style={{ marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            background: 'rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(8px)',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            width: 'fit-content',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <span className="status-dot" style={{ width: '6px', height: '6px' }}></span>
                            <span style={{ fontSize: '0.7rem', fontWeight: '600', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Now</span>
                        </div>

                        {persona.isTrending && (
                            <div style={{ 
                                background: 'linear-gradient(135deg, #ef4444, #f97316)',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '0.65rem',
                                fontWeight: '800',
                                color: 'white',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                            }}>
                                Trending
                            </div>
                        )}

                        {persona.isNew && (
                            <div style={{ 
                                background: 'linear-gradient(135deg, #22c55e, #10b981)',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '0.65rem',
                                fontWeight: '800',
                                color: 'white',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
                            }}>
                                New
                            </div>
                        )}
                    </div>
                    
                    <h3 className="persona-name" style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }}>
                        {persona.name}
                    </h3>
                    <p className="persona-tagline" style={{ 
                        color: 'rgba(255,255,255,0.7)', 
                        fontSize: '0.9rem', 
                        margin: '4px 0 0 0', 
                        lineHeight: 1.3,
                        fontWeight: '500'
                    }}>
                        {persona.tagline}
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <motion.button
                        whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.2)' }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onOpenStoryMap(persona);
                        }}
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            color: '#fff',
                            padding: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            backdropFilter: 'blur(10px)'
                        }}
                    >
                        <MapIcon size={18} />
                    </motion.button>

                    {hasDiary && (
                        <motion.button
                            whileHover={{ scale: 1.1, background: 'rgba(168, 85, 247, 0.2)' }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenDiary(persona);
                            }}
                            style={{
                                background: 'rgba(168, 85, 247, 0.1)',
                                border: '1px solid rgba(168, 85, 247, 0.2)',
                                borderRadius: '12px',
                                color: '#c084fc',
                                padding: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                backdropFilter: 'blur(10px)'
                            }}
                        >
                            <Book size={18} />
                        </motion.button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

const PersonaList = ({ onSelectPersona, allPersonas = [] }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [activeRegion, setActiveRegion] = useState('All');
    const [diaryPersona, setDiaryPersona] = useState(null);
    const [storyMapPersona, setStoryMapPersona] = useState(null);
    const [initialLoading, setInitialLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setInitialLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);
    
    // Combined list of categories including the new Taboo theme
    const categories = ['All', 'Family', 'Professional', 'Modern', 'Traditional', 'Taboo'];
    const regions = ['All', 'Indian', 'American', 'Latina-American', 'European', 'East Asian'];

    const getInitialActiveChats = () => {
        const chats = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('chat_')) {
                const id = key.replace('chat_', '');
                // Verify the persona exists before adding to active chats
                const personaExists = allPersonas.find(p => p.id === id);
                if (personaExists) {
                    try {
                        const chatData = JSON.parse(localStorage.getItem(key));
                        // Only count as active if there's more than just the initial message
                        if (Array.isArray(chatData) && chatData.length > 2) {
                            // Use timestamp from last message for sorting
                            const lastMsg = chatData[chatData.length - 1];
                            const timestamp = parseInt(lastMsg.id) || 0;
                            chats.push({ id, timestamp });
                        }
                    } catch (e) {
                        // If invalid JSON, treat as inactive
                    }
                }
            }
        }
        // Sort chats by timestamp descending (most recent first)
        return chats.sort((a, b) => b.timestamp - a.timestamp).map(c => c.id);
    };

    const [activeChatIds, setActiveChatIds] = useState(getInitialActiveChats);
    
    const [activeTab, setActiveTab] = useState(() => {
        try {
            const savedTab = localStorage.getItem('lastPersonaTab');
            const initialActive = getInitialActiveChats();
            
            if (savedTab === 'active' && initialActive.length > 0) {
                return 'active';
            }
        } catch (e) {
            console.error("Local storage access failed", e);
        }
        return 'all';
    });

    useEffect(() => {
        localStorage.setItem('lastPersonaTab', activeTab);
    }, [activeTab]);

    const displayedPersonas = (activeTab === 'all'
        ? allPersonas
        : activeChatIds.map(id => allPersonas.find(p => p.id === id)).filter(Boolean)
    ).filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             p.tagline.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Handle Taboo category (based on tabooRating > 0)
        let matchesCategory = false;
        if (activeCategory === 'All') {
            matchesCategory = true;
        } else if (activeCategory === 'Taboo') {
            matchesCategory = (p.tabooRating && p.tabooRating > 0);
        } else {
            matchesCategory = p.category === activeCategory;
        }

        const matchesRegion = activeRegion === 'All' || p.origin === activeRegion;
        
        return matchesSearch && matchesCategory && matchesRegion;
    });

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: 'spring',
                stiffness: 100,
                damping: 15
            }
        }
    };

    return (
        <div className="persona-container" style={{ paddingBottom: '4rem' }}>
            

            {/* Search & Categories Section */}
            <div className="discovery-header glass-panel" style={{ 
                margin: '1.5rem 0',
                padding: '1.25rem',
                borderRadius: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(24, 24, 27, 0.4)',
                backdropFilter: 'blur(20px)',
                position: 'relative',
                zIndex: 10
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: '#fff' }}>Discover</h2>
                    <p style={{ fontSize: '0.85rem', color: '#71717a', margin: 0 }}>Find your next companion</p>
                </div>

                {/* Search Bar */}
                <div style={{ position: 'relative' }}>
                    <Search 
                        size={20} 
                        style={{ 
                            position: 'absolute', 
                            left: '1.25rem', 
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#a1a1aa', 
                            zIndex: 1 
                        }} 
                    />
                    <input
                        type="text"
                        placeholder="Search by name or tagline..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '1rem 1rem 1rem 3.5rem',
                            background: 'rgba(0, 0, 0, 0.3)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '16px',
                            color: '#fff',
                            fontSize: '1rem',
                            outline: 'none',
                            transition: 'all 0.3s ease',
                            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.2)'
                        }}
                    />
                </div>

                {/* Filters Container */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Category Filter */}
                    <div style={{ 
                        display: 'flex', 
                        gap: '0.5rem', 
                        overflowX: 'auto', 
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                        paddingBottom: '2px'
                    }}>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                style={{
                                    padding: '0.6rem 1.25rem',
                                    background: activeCategory === cat ? 'linear-gradient(135deg, #a855f7, #ec4899)' : 'rgba(255, 255, 255, 0.05)',
                                    color: activeCategory === cat ? 'white' : '#a1a1aa',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontSize: '0.85rem',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.2s ease',
                                    boxShadow: activeCategory === cat ? '0 4px 12px rgba(168, 85, 247, 0.3)' : 'none'
                                }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Region Filter */}
                    <div style={{ 
                        display: 'flex', 
                        gap: '0.4rem', 
                        overflowX: 'auto', 
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none'
                    }}>
                        {regions.map(region => (
                            <button
                                key={region}
                                onClick={() => setActiveRegion(region)}
                                style={{
                                    padding: '0.4rem 1rem',
                                    background: activeRegion === region ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                                    color: activeRegion === region ? '#fff' : '#71717a',
                                    border: '1px solid ' + (activeRegion === region ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)'),
                                    borderRadius: '10px',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {region}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Taboo Highlight Banner */}
                <AnimatePresence>
                    {activeCategory === 'Taboo' && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            style={{
                                padding: '0.75rem 1rem',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                borderRadius: '12px',
                                color: '#fca5a5',
                                fontSize: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                overflow: 'hidden'
                            }}
                        >
                            <span>🔥</span> Exploring forbidden dynamics and secrets.
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="tabs-container fade-in" style={{ marginBottom: '1.5rem' }}>
                <button
                    className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    All Characters ({allPersonas.length})
                </button>
                {activeChatIds.length > 0 && (
                    <button
                        className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
                        onClick={() => setActiveTab('active')}
                    >
                        Active Chats ({activeChatIds.length})
                    </button>
                )}
            </div>

            <motion.div
                className="persona-grid"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                key={activeCategory} // Force re-render animation on tab switch
            >
                {initialLoading ? (
                    // Show placeholders for a consistent initial feel
                    Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
                ) : (
                    displayedPersonas.map((persona) => (
                        <CharacterCard 
                            key={persona.id}
                            persona={persona}
                            onSelectPersona={onSelectPersona}
                            onOpenStoryMap={setStoryMapPersona}
                            onOpenDiary={setDiaryPersona}
                            itemVariants={itemVariants}
                        />
                    ))
                )}
            </motion.div>

            {/* Diary Modal */}
            <AnimatePresence>
                {diaryPersona && (
                    <div className="modal-overlay" onClick={() => setDiaryPersona(null)}>
                        <motion.div 
                            className="modal-content glass-panel" 
                            onClick={(e) => e.stopPropagation()}
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            style={{ maxWidth: '500px' }}
                        >
                            <div className="modal-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ position: 'relative' }}>
                                        <img src={diaryPersona.image} alt={diaryPersona.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                                        <div style={{ position: 'absolute', bottom: -2, right: -2, background: '#10b981', borderRadius: '50%', padding: '2px', border: '2px solid #18181b' }}>
                                            <Book size={10} color="white" />
                                        </div>
                                    </div>
                                    <div>
                                        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{diaryPersona.name}'s Secret Diary</h2>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#10b981' }}>Private Thoughts & Post-Chat Reflections</p>
                                    </div>
                                </div>
                                <button onClick={() => setDiaryPersona(null)} style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}>
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                                {(() => {
                                    const diaries = JSON.parse(localStorage.getItem(`diaries_${diaryPersona.id}`) || '[]');
                                    if (diaries.length === 0) return <p style={{ textAlign: 'center', color: '#71717a', padding: '2rem' }}>No diary entries yet. Chat with {diaryPersona.name} to see her reflections.</p>;
                                    
                                    return (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                            {diaries.map((entry, idx) => (
                                                <div key={entry.id} style={{ 
                                                    background: 'rgba(16, 185, 129, 0.03)', 
                                                    borderLeft: '3px solid #10b981',
                                                    padding: '1rem',
                                                    borderRadius: '0 12px 12px 0',
                                                    position: 'relative'
                                                }}>
                                                    <button 
                                                        onClick={() => {
                                                            if (window.confirm("Delete this diary entry?")) {
                                                                deleteDiaryEntry(diaryPersona.id, entry.id);
                                                                // Force re-render by updating local state or just let the user re-open
                                                                // Since this is inside a IIFE, we might need to handle state better
                                                                // Let's add a local state for diary entries in the component
                                                                setDiaryPersona({ ...diaryPersona }); // Simple hack to trigger re-render
                                                            }
                                                        }}
                                                        style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.5 }}
                                                        onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                                                        onMouseOut={(e) => e.currentTarget.style.opacity = 0.5}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                    <p style={{ 
                                                        margin: 0, 
                                                        fontSize: '0.95rem', 
                                                        lineHeight: '1.6', 
                                                        color: '#e4e4e7',
                                                        fontStyle: 'italic',
                                                        paddingRight: '20px'
                                                    }}>
                                                        "{entry.content}"
                                                    </p>
                                                    <div style={{ 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        gap: '6px', 
                                                        marginTop: '0.75rem', 
                                                        fontSize: '0.7rem', 
                                                        color: '#71717a' 
                                                    }}>
                                                        <Clock size={10} />
                                                        {new Date(entry.timestamp).toLocaleDateString()} at {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>

                            <div className="modal-footer" style={{ justifyContent: 'center' }}>
                                <p style={{ fontSize: '0.75rem', color: '#71717a', fontStyle: 'italic' }}>
                                    Only you can see these private reflections...
                                </p>
                            </div>
                        </motion.div>
                    </div>
                )}
                {storyMapPersona && (
                    <StoryMap 
                        persona={storyMapPersona} 
                        onClose={() => setStoryMapPersona(null)} 
                    />
                )}
            </AnimatePresence>
        </div >
    );
};

export default PersonaList;
