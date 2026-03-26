import React from 'react';
import { Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DiscoverFilters = ({ 
    searchTerm, 
    setSearchTerm, 
    activeCategory, 
    setActiveCategory, 
    activeRegion, 
    setActiveRegion, 
    categories, 
    regions 
}) => {
    return (
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
    );
};

export default DiscoverFilters;
