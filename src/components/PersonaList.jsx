import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { personas } from '../data/personas';

const PersonaList = ({ onSelectPersona, allPersonas = [] }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [activeRegion, setActiveRegion] = useState('All');
    
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
        const savedTab = localStorage.getItem('lastPersonaTab');
        const initialActive = getInitialActiveChats();
        
        if (savedTab === 'active' && initialActive.length > 0) {
            return 'active';
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

            {/* Search & Categories */}
            <div style={{ 
                margin: '1rem 0 2rem 0',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                position: 'relative',
                zIndex: 10
            }}>
                {/* Taboo Highlight Banner */}
                {activeCategory === 'Taboo' && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            padding: '0.8rem 1.2rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '12px',
                            color: '#fca5a5',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <span style={{ fontSize: '1.2rem' }}>🔥</span>
                        Exploring high-tension, forbidden dynamics and deep personal secrets.
                    </motion.div>
                )}
                {/* Search Bar */}
                <div style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    <Search 
                        size={18} 
                        style={{ 
                            position: 'absolute', 
                            left: '1rem', 
                            color: '#71717a', 
                            zIndex: 1 
                        }} 
                    />
                    <input
                        type="text"
                        placeholder="Search companions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.8rem 1rem 0.8rem 2.8rem',
                            background: 'rgba(24, 24, 27, 0.8)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '16px',
                            color: '#f4f4f5',
                            fontSize: '1rem',
                            outline: 'none',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
                        }}
                    />
                </div>

                {/* Category Filter */}
                <div style={{ 
                    display: 'flex', 
                    gap: '0.6rem', 
                    overflowX: 'auto', 
                    padding: '4px',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                }}>
                    {categories.map(cat => (
                        <motion.button
                            key={cat}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setActiveCategory(cat)}
                            style={{
                                padding: '0.5rem 1.2rem',
                                background: activeCategory === cat ? 'linear-gradient(135deg, #c084fc 0%, #a855f7 100%)' : 'rgba(255, 255, 255, 0.05)',
                                color: activeCategory === cat ? 'white' : '#a1a1aa',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '0.85rem',
                                fontWeight: activeCategory === cat ? '600' : '400',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.3s ease',
                                border: activeCategory === cat ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                                boxShadow: activeCategory === cat ? '0 4px 12px rgba(168, 85, 247, 0.3)' : 'none'
                            }}
                        >
                            {cat}
                        </motion.button>
                    ))}
                </div>

                {/* Region Filter */}
                <div style={{ 
                    display: 'flex', 
                    gap: '0.6rem', 
                    overflowX: 'auto', 
                    padding: '4px',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    marginTop: '-0.5rem' // Tighten gap with main categories
                }}>
                    {regions.map(region => (
                        <motion.button
                            key={region}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setActiveRegion(region)}
                            style={{
                                padding: '0.4rem 1rem',
                                background: activeRegion === region ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                                color: activeRegion === region ? '#f4f4f5' : '#71717a',
                                border: 'none',
                                borderRadius: '10px',
                                fontSize: '0.75rem',
                                fontWeight: activeRegion === region ? '600' : '400',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.3s ease',
                                border: '1px solid ' + (activeRegion === region ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)')
                            }}
                        >
                            {region}
                        </motion.button>
                    ))}
                </div>
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
                key={activeTab} // Force re-render animation on tab switch
            >
                {displayedPersonas.map((persona) => (
                    <motion.div
                        key={persona.id}
                        className="persona-card full-bleed"
                        variants={itemVariants}
                        whileHover={{ scale: 1.03, boxShadow: "0 20px 40px rgba(0,0,0,0.6)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelectPersona(persona)}
                        style={{
                            backgroundImage: persona.image ? `url(${persona.image})` : 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            position: 'relative',
                            overflow: 'hidden',
                            borderRadius: '16px',
                            cursor: 'pointer'
                        }}
                    >
                        {/* Gradient overlay to make text readable */}
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 40%, transparent 100%)',
                            zIndex: 1
                        }}></div>

                        <div className="persona-info" style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'flex-end', padding: '1.5rem' }}>
                            <div className="persona-name" style={{ fontSize: '1.4rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                {persona.name}
                                <span className="status-dot"></span>
                            </div>
                            <p className="persona-tagline" style={{ color: '#d4d4d8', fontSize: '0.9rem', margin: 0, lineHeight: 1.4 }}>{persona.tagline}</p>
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        </div >
    );
};

export default PersonaList;
