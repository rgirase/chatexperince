import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Sparkles, Filter, LayoutGrid, Zap } from 'lucide-react';
import fantasies from '../data/fantasies.json';

const FantasyGallery = ({ onSelectFantasy, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    const categories = ['All', ...new Set(fantasies.map(f => f.category))];

    const filteredFantasies = fantasies.filter(f => {
        const matchesSearch = f.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             f.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = activeCategory === 'All' || f.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 100, damping: 15 }
        }
    };

    const handleSurpriseMe = () => {
        const random = fantasies[Math.floor(Math.random() * fantasies.length)];
        onSelectFantasy(random);
    };

    return (
        <motion.div 
            className="fantasy-gallery-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.9)',
                backdropFilter: 'blur(20px)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.5rem'
            }}
            onClick={onClose}
        >
            <motion.div 
                className="fantasy-gallery-content glass-panel"
                onClick={(e) => e.stopPropagation()}
                initial={{ scale: 0.9, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 50 }}
                style={{
                    width: '100%',
                    maxWidth: '1000px',
                    height: '90vh',
                    borderRadius: '32px',
                    background: 'rgba(24, 24, 27, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}
            >
                {/* Header */}
                <div style={{ 
                    padding: '2rem', 
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                }}>
                    <div>
                        <h2 style={{ 
                            fontSize: '2rem', 
                            fontWeight: '900', 
                            margin: 0, 
                            background: 'linear-gradient(135deg, #f472b6, #a855f7)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem'
                        }}>
                            <Sparkles className="text-purple-400" /> Velvet Library
                        </h2>
                        <p style={{ color: '#a1a1aa', margin: '0.5rem 0 0 0', fontSize: '1rem' }}>
                            Choose a fantasy or let destiny decide.
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        style={{ 
                            background: 'rgba(255, 255, 255, 0.05)', 
                            border: 'none', 
                            color: '#fff', 
                            padding: '0.75rem', 
                            borderRadius: '50%',
                            cursor: 'pointer'
                        }}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Filters */}
                <div style={{ padding: '1.5rem 2rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
                        <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} size={18} />
                        <input 
                            type="text" 
                            placeholder="Search fantasies..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.8rem 1rem 0.8rem 3rem',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '16px',
                                color: '#fff',
                                outline: 'none'
                            }}
                        />
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '4px' }}>
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
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <button 
                        onClick={handleSurpriseMe}
                        style={{
                            padding: '0.7rem 1.5rem',
                            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '16px',
                            fontWeight: '800',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            cursor: 'pointer',
                            boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
                        }}
                    >
                        <Zap size={18} fill="currentColor" /> Surprise Me
                    </button>
                </div>

                {/* Grid */}
                <div style={{ 
                    flex: 1, 
                    overflowY: 'auto', 
                    padding: '1rem 2rem 3rem 2rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '1.5rem'
                }}>
                    <AnimatePresence mode="popLayout">
                        {filteredFantasies.map((fantasy) => (
                            <motion.div
                                key={fantasy.id}
                                layout
                                variants={itemVariants}
                                initial="hidden"
                                animate="visible"
                                exit={{ opacity: 0, scale: 0.9 }}
                                whileHover={{ y: -5, background: 'rgba(255, 255, 255, 0.08)' }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onSelectFantasy(fantasy)}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.04)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    borderRadius: '24px',
                                    padding: '1.5rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    transition: 'background 0.3s ease'
                                }}
                            >
                                <div>
                                    <div style={{ 
                                        color: '#ec4899', 
                                        fontSize: '0.7rem', 
                                        fontWeight: '800', 
                                        textTransform: 'uppercase', 
                                        letterSpacing: '0.1em',
                                        marginBottom: '0.5rem'
                                    }}>
                                        {fantasy.category}
                                    </div>
                                    <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.25rem', fontWeight: '800' }}>{fantasy.title}</h3>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#a1a1aa', lineHeight: 1.5 }}>{fantasy.description}</p>
                                </div>
                                <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a855f7', fontWeight: '700', fontSize: '0.9rem' }}>
                                    Launch Fantasy <Sparkles size={14} />
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default FantasyGallery;
