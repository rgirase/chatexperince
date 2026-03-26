import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, History, Trash2 } from 'lucide-react';
import { personas } from '../data/personas';
import { statusUpdates } from '../data/statusUpdates';
import CharacterDetailsModal from './sub/CharacterDetailsModal';
import WardrobeModal from './sub/WardrobeModal';
import StoryMap from './StoryMap';
import { getDiaries, deleteDiaryEntry } from '../services/memory';
import * as relationshipService from '../services/relationship';
import * as db from '../services/db';
import StatusInteraction from './sub/StatusInteraction';

import CharacterCard from './sub/CharacterCard';
import DiscoverFilters from './sub/DiscoverFilters';
import SkeletonCard from './sub/SkeletonCard';

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
