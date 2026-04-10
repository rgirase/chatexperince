import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, History, Trash2 } from 'lucide-react';
import { personas } from '../data/personas';
import { statusUpdates } from '../data/statusUpdates';
import CharacterDetailsModal from './sub/CharacterDetailsModal';
import WardrobeModal from './sub/WardrobeModal';
import StoryMap from './sub/StoryMap';
import { getDiaries, deleteDiaryEntry } from '../services/memory';
import * as relationshipService from '../services/relationship';
import * as db from '../services/db';
import StatusInteraction from './sub/StatusInteraction';

import CharacterCard from './sub/CharacterCard';
import DiscoverFilters from './sub/DiscoverFilters';
import SkeletonCard from './sub/SkeletonCard';
import { scenarios } from '../data/scenarios';
import { Sparkles as SparklesIcon, ChevronRight, RefreshCw } from 'lucide-react';
import { generateFeaturedScenarios } from '../services/llm';
import LiveLabWidget from './sub/LiveLabWidget';
import AuraFeed from './sub/AuraFeed';

const PersonaList = ({ onSelectPersona, allPersonas = [] }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [activeRegion, setActiveRegion] = useState('All');
    const [diaryPersona, setDiaryPersona] = useState(null);
    const [storyMapPersona, setStoryMapPersona] = useState(null);
    const [detailsPersona, setDetailsPersona] = useState(null);
    const [wardrobePersona, setWardrobePersona] = useState(null);
    const [initialLoading, setInitialLoading] = useState(true);
    const [isShuffling, setIsShuffling] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setInitialLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    const handleSelectScenario = (scenario) => {
        const targetPersona = allPersonas.find(p => p.id === scenario.personaId);
        if (targetPersona) {
            // We'll store the scenario prompt in localStorage for useChatLogic to pick up if it's a new chat
            localStorage.setItem(`scenarioPrompt_${scenario.personaId}`, scenario.prompt);
            onSelectPersona(targetPersona, scenario);
        }
    };
    
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
            
            // Helper to extract personaId from a key like 'chat_gauri_bhabhi_session_123'
            const getPersonaIdFromKey = (key) => {
                const idPart = key.replace('chat_', '');
                // Find the longest matching persona ID that is a prefix of idPart
                // (Longest match to handle overlapping prefixes if they exist)
                const matches = allPersonas
                    .filter(p => idPart.startsWith(p.id))
                    .sort((a, b) => b.id.length - a.id.length);
                return matches.length > 0 ? matches[0].id : null;
            };

            // 1. Check Legacy LocalStorage
            try {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('chat_')) {
                        const personaId = getPersonaIdFromKey(key);
                        if (personaId) {
                            try {
                                const messages = JSON.parse(localStorage.getItem(key) || '[]');
                                if (messages.length >= 2) {
                                    const lastMsg = messages[messages.length - 1];
                                    const timestamp = lastMsg && lastMsg.id ? parseInt(lastMsg.id) : 0;
                                    
                                    if (!activeMetadata[personaId] || timestamp > activeMetadata[personaId].lastTimestamp) {
                                        activeMetadata[personaId] = { lastTimestamp: timestamp };
                                    }
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
                            const personaId = getPersonaIdFromKey(chat.id);
                            const messages = chat.value || [];
                            
                            if (personaId && messages.length >= 2) {
                                const lastMsg = messages[messages.length - 1];
                                const timestamp = lastMsg && lastMsg.id ? parseInt(lastMsg.id) : 0;
                                
                                // Aggregate sessions: keep the latest timestamp for this persona
                                if (!activeMetadata[personaId] || timestamp > activeMetadata[personaId].lastTimestamp) {
                                    activeMetadata[personaId] = { lastTimestamp: timestamp };
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

    const [featuredScenarios, setFeaturedScenarios] = useState([]);

    const shuffleScenarios = useCallback(async () => {
        setIsShuffling(true);
        try {
            // 1. Try AI Generation
            let selected = await generateFeaturedScenarios(allPersonas);
            
            // 2. Fallback to static if AI fails
            if (!selected || selected.length === 0) {
                console.log("[Scenarios] AI Generation failed, falling back to static list...");
                const shuffled = [...scenarios].sort(() => 0.5 - Math.random());
                selected = shuffled.slice(0, 5);
            }
            
            setFeaturedScenarios(selected);
            localStorage.setItem('featuredScenarios', JSON.stringify(selected));
            localStorage.setItem('lastScenarioShuffle', Date.now().toString());
        } catch (e) {
            console.error("[Scenarios] Critical shuffle error", e);
        } finally {
            setIsShuffling(false);
        }
    }, [allPersonas]);

    useEffect(() => {
        const lastShuffle = localStorage.getItem('lastScenarioShuffle');
        const savedScenarios = localStorage.getItem('featuredScenarios');
        const threeHours = 3 * 60 * 60 * 1000;

        const initScenarios = async () => {
            if (!lastShuffle || !savedScenarios || (Date.now() - parseInt(lastShuffle)) > threeHours) {
                await shuffleScenarios();
            } else {
                try {
                    const parsed = JSON.parse(savedScenarios);
                    // If the saved list is less than 5, re-shuffle to fill it up
                    if (parsed.length < 5) {
                        await shuffleScenarios();
                    } else {
                        setFeaturedScenarios(parsed);
                    }
                } catch (e) {
                    await shuffleScenarios();
                }
            }
        };

        initScenarios();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); 

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
        // Also flag the first 10, as the user sometimes prepends new featured characters
        const index = uniquePersonas.findIndex(up => up.id === p.id);
        const isRecent = index < 10 || index >= uniquePersonas.length - 31;
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

        // 2. Default (including 'All' tab): Prioritize 'isNew'
        if (a.isNew && !b.isNew) return -1;
        if (!a.isNew && b.isNew) return 1;

        // Both are new. Tiebreaker:
        const aIndex = uniquePersonas.findIndex(p => p.id === a.id);
        const bIndex = uniquePersonas.findIndex(p => p.id === b.id);

        const aIsPrepended = aIndex < 10;
        const bIsPrepended = bIndex < 10;

        // Favor the prepended bucket (index 0 first) over the appended bucket
        if (aIsPrepended && !bIsPrepended) return -1;
        if (!aIsPrepended && bIsPrepended) return 1;

        if (aIsPrepended && bIsPrepended) return aIndex - bIndex;

        // 3. Fallback: Sort by index in array (higher index = more recent generally)
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
            <LiveLabWidget />
            <AuraFeed onSelectPersona={onSelectPersona} />

            {/* Scenario Spotlight Section */}
            {!searchTerm && activeCategory === 'All' && activeRegion === 'All' && activeTab === 'all' && (
                <div className="scenario-spotlight fade-in" style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', padding: '0 0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <SparklesIcon size={20} className="premium-gradient-text" />
                            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>Featured Scenarios</h2>
                        </div>
                        <button 
                            onClick={shuffleScenarios}
                            disabled={isShuffling}
                            className={`header-action-btn ${isShuffling ? 'btn-loading' : ''}`}
                            style={{ 
                                background: 'rgba(255,255,255,0.05)', 
                                border: '1px solid rgba(255,255,255,0.1)', 
                                borderRadius: '12px', 
                                padding: '6px 12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: isShuffling ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                color: '#a1a1aa',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                opacity: isShuffling ? 0.7 : 1
                            }}
                        >
                            <RefreshCw size={14} className={isShuffling ? 'spin' : ''} />
                            {isShuffling ? 'Rolling...' : 'Shuffle'}
                        </button>
                    </div>
                    
                    <div className="scenario-scroll" style={{ 
                        display: 'flex', 
                        gap: '1rem', 
                        overflowX: 'auto', 
                        padding: '0.5rem',
                        paddingBottom: '1rem',
                        scrollbarWidth: 'none',
                        WebkitOverflowScrolling: 'touch'
                    }}>
                        {featuredScenarios.map((scenario) => {
                            const persona = allPersonas.find(p => p.id === scenario.personaId);
                            if (!persona) return null;
                            
                            return (
                                <motion.div
                                    key={scenario.id}
                                    className="glass-panel"
                                    onClick={() => handleSelectScenario(scenario)}
                                    whileHover={{ y: -5, scale: 1.02, background: 'rgba(255,255,255,0.06)' }}
                                    whileTap={{ scale: 0.98 }}
                                    style={{
                                        flex: '0 0 280px',
                                        height: '160px',
                                        borderRadius: '24px',
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        border: '1px solid rgba(168, 85, 247, 0.2)',
                                        background: 'rgba(255,255,255,0.03)'
                                    }}
                                >
                                    <div style={{ 
                                        position: 'absolute', 
                                        inset: 0, 
                                        backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.9)), url(${scenario.image})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        zIndex: 0
                                    }} />
                                    
                                    <div style={{ 
                                        position: 'absolute', 
                                        bottom: 0, 
                                        left: 0, 
                                        right: 0, 
                                        padding: '1rem', 
                                        zIndex: 1 
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <img src={persona.image} style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #fff' }} alt={persona.name} />
                                            <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.05em' }}>{persona.name} Scene</span>
                                        </div>
                                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: '#fff' }}>{scenario.title}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                            <span style={{ fontSize: '0.75rem', color: '#a1a1aa', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{scenario.description}</span>
                                            <ChevronRight size={14} color="#a855f7" />
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            <DiscoverFilters 
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                activeRegion={activeRegion}
                setActiveRegion={setActiveRegion}
                categories={categories}
                regions={regions}
            />

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
