import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { personas } from '../data/personas';

const PersonaList = ({ onSelectPersona, customPersonas = [] }) => {
    const allPersonas = [...personas, ...customPersonas];
    const [activeTab, setActiveTab] = useState('all');
    const [activeChatIds, setActiveChatIds] = useState([]);

    useEffect(() => {
        const ids = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('chatHistory_')) {
                ids.push(key.replace('chatHistory_', ''));
            }
        }
        setActiveChatIds(ids);
        if (ids.length > 0) {
            setActiveTab('active');
        }
    }, []);

    const displayedPersonas = activeTab === 'all'
        ? allPersonas
        : allPersonas.filter(p => activeChatIds.includes(p.id));

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
        <div className="persona-container">
            <motion.div
                className="persona-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h2>Choose Your Companion</h2>
                <p>Select a persona to start your intimate journey.</p>
            </motion.div>

            <div className="tabs-container fade-in">
                <button
                    className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    All Characters
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
