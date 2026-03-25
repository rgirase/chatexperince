import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Book, X, History, Clock, Map as MapIcon, Trash2, Info, Shirt } from 'lucide-react';
import { personas } from '../data/personas';
import { statusUpdates } from '../data/statusUpdates';
import CharacterDetailsModal from './sub/CharacterDetailsModal';
import WardrobeModal from './sub/WardrobeModal';
import StoryMap from './StoryMap';
import { getDiaries, deleteDiaryEntry } from '../services/memory';
import * as relationshipService from '../services/relationship';
import * as db from '../services/db';

const SkeletonCard = () => (
    <div className="persona-card full-bleed skeleton" style={{ height: '380px', borderRadius: '16px' }}>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1.5rem', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}>
            <div className="skeleton" style={{ height: '1.5rem', width: '60%', borderRadius: '4px', marginBottom: '0.5rem' }}></div>
            <div className="skeleton" style={{ height: '1rem', width: '80%', borderRadius: '4px' }}></div>
        </div>
    </div>
);

const CharacterCard = ({ persona, onSelectPersona, onOpenStoryMap, onOpenDiary, onOpenDetails, onOpenWardrobe, itemVariants }) => {
    const statusBubbleRef = useRef(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [hasDiary, setHasDiary] = useState(false);
    const [isStatusExpanded, setIsStatusExpanded] = useState(false);
    const [equippedImage, setEquippedImage] = useState(persona.image);
    const [refreshKey, setRefreshKey] = useState(0);
    
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (statusBubbleRef.current && !statusBubbleRef.current.contains(event.target)) {
                setIsStatusExpanded(false);
            }
        };
        if (isStatusExpanded) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isStatusExpanded]);

    useEffect(() => {
        const loadState = async () => {
            const diaries = await getDiaries(persona.id);
            setHasDiary(diaries.length > 0);
            
            const equippedId = await relationshipService.getEquippedOutfit(persona.id);
            if (equippedId && persona.wardrobe) {
                const outfit = persona.wardrobe.find(o => o.id === equippedId);
                if (outfit) setEquippedImage(outfit.avatar);
            } else {
                setEquippedImage(persona.image);
            }
        };
        loadState();
    }, [persona.id, persona.image, persona.wardrobe, refreshKey]);

    // Update whenever the wardrobe modal could have changed something
    useEffect(() => {
        const handleRefresh = (e) => {
            if (e.detail?.personaId === persona.id) {
                setRefreshKey(prev => prev + 1);
            }
        };
        window.addEventListener('wardrobeUpdated', handleRefresh);
        return () => window.removeEventListener('wardrobeUpdated', handleRefresh);
    }, [persona.id]);

    return (
        <motion.div
            className={`persona-card-wrapper ${!imageLoaded ? 'skeleton' : ''}`}
            variants={itemVariants}
            style={{ position: 'relative', overflow: 'visible' }}
        >
            <div 
                className="persona-card-inner"
                onClick={() => onSelectPersona(persona)}
                style={{
                    backgroundImage: (imageLoaded && !imageError) ? `url(${equippedImage})` : 'linear-gradient(135deg, #27272a, #09090b)',
                    backgroundColor: '#111',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: '24px',
                    cursor: 'pointer',
                    height: '420px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    transition: 'transform 0.3s ease',
                    zIndex: 1
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-10px) scale(1.02)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0) scale(1)'}
            >
                <img 
                    src={equippedImage} 
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
                        <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}>✨</div>
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
                            {persona.isActive && (
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
                            )}

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
                        <p className="persona-tagline" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', margin: '4px 0 0 0', lineHeight: 1.3, fontWeight: '500' }}>
                            {persona.tagline}
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {statusUpdates[persona.id] && (
                            <motion.div 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsStatusExpanded(!isStatusExpanded);
                                }}
                                whileHover={{ scale: 1.05, background: 'rgba(9, 9, 11, 0.95)' }}
                                style={{ 
                                    fontSize: '0.65rem', 
                                    color: '#fff', 
                                    fontWeight: '700',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    background: 'rgba(244, 114, 182, 0.15)',
                                    backdropFilter: 'blur(10px)',
                                    padding: '6px 12px',
                                    borderRadius: '100px',
                                    width: 'fit-content',
                                    border: '1px solid rgba(244, 114, 182, 0.4)',
                                    borderLeft: '3px solid #f472b6',
                                    cursor: 'pointer',
                                    pointerEvents: 'auto',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                }}
                            >
                                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#f472b6' }}></span>
                                <span>Status</span>
                            </motion.div>
                        )}

                        <div style={{ display: 'flex', gap: '8px' }}>
                            {persona.wardrobe && persona.wardrobe.length > 0 && (
                                <motion.button
                                    whileHover={{ scale: 1.1, background: 'rgba(244, 114, 182, 0.2)' }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => { e.stopPropagation(); onOpenWardrobe(persona); }}
                                    style={{ background: 'rgba(244, 114, 182, 0.1)', border: '1px solid rgba(244, 114, 182, 0.2)', borderRadius: '12px', color: '#f472b6', padding: '10px', display: 'flex', alignItems: 'center', backdropFilter: 'blur(10px)' }}
                                >
                                    <Shirt size={18} />
                                </motion.button>
                            )}

                            <motion.button
                                whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.2)' }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => { e.stopPropagation(); onOpenStoryMap(persona); }}
                                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', padding: '10px', display: 'flex', alignItems: 'center', backdropFilter: 'blur(10px)' }}
                            >
                                <MapIcon size={18} />
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.1, background: 'rgba(59, 130, 246, 0.2)' }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => { e.stopPropagation(); onOpenDetails(persona); }}
                                style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '12px', color: '#60a5fa', padding: '10px', display: 'flex', alignItems: 'center', backdropFilter: 'blur(10px)' }}
                            >
                                <Info size={18} />
                            </motion.button>

                            {hasDiary && (
                                <motion.button
                                    whileHover={{ scale: 1.1, background: 'rgba(168, 85, 247, 0.2)' }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => { e.stopPropagation(); onOpenDiary(persona); }}
                                    style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.2)', borderRadius: '12px', color: '#c084fc', padding: '10px', display: 'flex', alignItems: 'center', backdropFilter: 'blur(10px)' }}
                                >
                                    <Book size={18} />
                                </motion.button>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* Bubble Overlay - Outside the overflow:hidden card */}
            <AnimatePresence>
                {isStatusExpanded && (
                    <motion.div
                        ref={statusBubbleRef}
                        id="status-bubble"
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 10 }}
                        onClick={(e) => { e.stopPropagation(); setIsStatusExpanded(false); }}
                        style={{
                            position: 'absolute',
                            bottom: '120px',
                            left: '20px',
                            width: '240px',
                            background: 'rgba(15, 15, 20, 0.98)',
                            backdropFilter: 'blur(20px)',
                            padding: '16px',
                            borderRadius: '20px',
                            border: '1px solid #f472b6',
                            zIndex: 1000,
                            boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
                            color: '#fff',
                            pointerEvents: 'auto'
                        }}
                    >
                        <div style={{ color: '#f472b6', fontSize: '0.65rem', fontWeight: '900', textTransform: 'uppercase', marginBottom: '8px' }}>
                            Recent Status • {statusUpdates[persona.id].timestamp}
                        </div>
                        <div style={{ fontStyle: 'italic', fontSize: '0.85rem', lineHeight: '1.5' }}>
                            "{statusUpdates[persona.id].status}"
                        </div>
                        {/* Arrow */}
                        <div style={{ position: 'absolute', bottom: '-20px', left: '25px', width: 0, height: 0, borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: '10px solid #f472b6' }}></div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const getInitialActiveChats = () => {
    const active = [];
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('chat_')) {
                active.push(key.replace('chat_', ''));
            }
        }
    } catch (e) {
        console.error("Failed to get initial active chats", e);
    }
    return active;
};

const PersonaList = ({ onSelectPersona, allPersonas = [] }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [activeRegion, setActiveRegion] = useState('All');
    const [diaryPersona, setDiaryPersona] = useState(null);
    const [storyMapPersona, setStoryMapPersona] = useState(null);
    const [detailsPersona, setDetailsPersona] = useState(null);
    const [wardrobePersona, setWardrobePersona] = useState(null);
    const [initialLoading, setInitialLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setInitialLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);
    
    // Combined list of categories including the new Taboo theme
    // Simplified user-facing categories
    const categories = ['All', 'Family', 'Professional', 'Traditional', 'Forbidden', 'Romance', 'Taboo'];
    const regions = ['All', 'Indian', 'American', 'Latina-American', 'European', 'East Asian'];

    // Mapping internal data categories to user-facing groups
    const categoryMapping = {
        'Family': 'Family',
        'Step Mom': 'Family',
        'Professional': 'Professional',
        'Service': 'Professional',
        'Corporate': 'Professional',
        'Business': 'Professional',
        'Traditional': 'Traditional',
        'Indian': 'Traditional',
        'Noble': 'Traditional',
        'Scandal': 'Forbidden',
        'Secret': 'Forbidden',
        'Collateral': 'Forbidden',
        'Debt': 'Forbidden',
        'Romance': 'Romance',
        'Relationship': 'Romance',
        'Other': 'Romance'
    };

    const [activeChatsMetadata, setActiveChatsMetadata] = useState({});

    useEffect(() => {
        const fetchActiveChats = async () => {
            const activeMetadata = {};
            
            // 1. Check Legacy LocalStorage
            try {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('chat_')) {
                        const id = key.replace('chat_', '');
                        if (allPersonas.find(p => p.id === id)) {
                            try {
                                const messages = JSON.parse(localStorage.getItem(key) || '[]');
                                if (messages.length >= 2) {
                                    const lastMsg = messages[messages.length - 1];
                                    const timestamp = lastMsg && lastMsg.id ? parseInt(lastMsg.id) : 0;
                                    activeMetadata[id] = { lastTimestamp: timestamp };
                                }
                            } catch (e) {}
                        }
                    }
                }
            } catch (e) {}

            // 2. Check IndexedDB for chats with >= 2 messages
            try {
                const database = await db.openDB();
                const transaction = database.transaction('chats', 'readonly');
                const store = transaction.objectStore('chats');
                const request = store.getAll();

                await new Promise((resolve) => {
                    request.onsuccess = () => {
                        const chats = request.result || [];
                        chats.forEach(chat => {
                            const id = chat.id.startsWith('chat_') ? chat.id.replace('chat_', '') : chat.id;
                            const messages = chat.value || [];
                            
                            if (messages.length >= 2) {
                                if (allPersonas.find(p => p.id === id)) {
                                    const lastMsg = messages[messages.length - 1];
                                    const timestamp = lastMsg && lastMsg.id ? parseInt(lastMsg.id) : 0;
                                    
                                    // Prefer IndexedDB if it exists, or update if more recent
                                    if (!activeMetadata[id] || timestamp > activeMetadata[id].lastTimestamp) {
                                        activeMetadata[id] = { lastTimestamp: timestamp };
                                    }
                                }
                            }
                        });
                        resolve();
                    };
                    request.onerror = () => resolve();
                });
            } catch (e) {
                console.error("IndexedDB error in PersonaList", e);
            }

            // 3. Always include the last active persona to ensure they are visible in 'Active' tab
            const lastId = localStorage.getItem('lastPersonaId');
            if (lastId && !activeMetadata[lastId]) {
                activeMetadata[lastId] = { lastTimestamp: Date.now() };
            }

            setActiveChatsMetadata(activeMetadata);
        };

        fetchActiveChats();
    }, [allPersonas]);

    const lastPersonaId = localStorage.getItem('lastPersonaId');
    
    const [activeTab, setActiveTab] = useState(() => {
        try {
            const savedTab = localStorage.getItem('lastPersonaTab');
            const initialActive = Object.keys(activeChatsMetadata);
            
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

    // Ensure uniqueness by ID to avoid React key warnings
    const uniquePersonas = Array.from(new Map(allPersonas.map(p => [p.id, p])).values());

    const displayedPersonas = (activeTab === 'active' 
        ? uniquePersonas.filter(p => activeChatsMetadata[p.id])
        : uniquePersonas
    ).filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             p.tagline.toLowerCase().includes(searchTerm.toLowerCase());
        
        let matchesCategory = false;
        if (activeCategory === 'All') {
            matchesCategory = true;
        } else if (activeCategory === 'Taboo') {
            matchesCategory = (p.tabooRating && p.tabooRating > 0);
        } else {
            // Check mapped category
            const mapped = categoryMapping[p.category] || 'Other';
            matchesCategory = (mapped === activeCategory);
        }

        const matchesRegion = activeRegion === 'All' || p.origin === activeRegion;
        
        return matchesSearch && matchesCategory && matchesRegion;
    }).map(p => {
        // Automatically flag the 31 most recent characters as "New"
        // These are the Western Forbidden characters added in the last batches
        const index = uniquePersonas.findIndex(up => up.id === p.id);
        const isRecent = index >= uniquePersonas.length - 31;
        return { ...p, isNew: p.isNew || isRecent };
    }).sort((a, b) => {
        const aMeta = activeChatsMetadata[a.id];
        const bMeta = activeChatsMetadata[b.id];
        
        // 1. If we are in the 'Active Chats' tab, sort primarily by interaction recency
        if (activeTab === 'active') {
            const isACurrent = a.id === lastPersonaId;
            const isBCurrent = b.id === lastPersonaId;
            
            if (isACurrent) return -1;
            if (isBCurrent) return 1;

            if (aMeta && bMeta) {
                return bMeta.lastTimestamp - aMeta.lastTimestamp;
            }
        }

        // 2. Default (including 'All' tab): Sort by 'Recently Added'
        // Since characters are added to the end of the array, higher index = more recent
        const aIndex = uniquePersonas.findIndex(p => p.id === a.id);
        const bIndex = uniquePersonas.findIndex(p => p.id === b.id);
        return bIndex - aIndex;
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
                {Object.keys(activeChatsMetadata).length > 0 && (
                    <button
                        className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
                        onClick={() => setActiveTab('active')}
                    >
                        Active Chats ({Object.keys(activeChatsMetadata).length})
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
                            persona={{
                                ...persona,
                                isActive: !!activeChatsMetadata[persona.id]
                            }}
                            onSelectPersona={onSelectPersona}
                            onOpenStoryMap={setStoryMapPersona}
                            onOpenDiary={setDiaryPersona}
                            onOpenDetails={setDetailsPersona}
                            onOpenWardrobe={setWardrobePersona}
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
                {wardrobePersona && (
                    <WardrobeModal 
                        isOpen={!!wardrobePersona} 
                        onClose={() => setWardrobePersona(null)} 
                        persona={wardrobePersona} 
                    />
                )}
                {detailsPersona && (
                    <CharacterDetailsModal 
                        isOpen={!!detailsPersona}
                        persona={detailsPersona}
                        onClose={() => setDetailsPersona(null)}
                    />
                )}
            </AnimatePresence>
        </div >
    );
};

export default PersonaList;
