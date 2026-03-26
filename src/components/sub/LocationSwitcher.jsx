import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllLocations } from '../../services/LocationService';
import { X, MapPin, Sparkles, Wind, Coffee, Moon, Heart, Flame, Zap, Home } from 'lucide-react';

const LocationSwitcher = ({ currentLocationId, onSelect, onClose }) => {
    const locations = getAllLocations();

    const getIcon = (id) => {
        if (id.includes('kitchen')) return <Coffee size={14} className="text-orange-400" />;
        if (id.includes('living')) return <Moon size={14} className="text-blue-400" />;
        if (id.includes('bedroom')) return <Heart size={14} className="text-pink-400" />;
        if (id.includes('shower')) return <Flame size={14} className="text-cyan-400" />;
        if (id.includes('park')) return <Wind size={14} className="text-green-400" />;
        if (id.includes('club')) return <Zap size={14} className="text-purple-400" />;
        if (id.includes('restaurant')) return <Sparkles size={14} className="text-yellow-400" />;
        if (id.includes('car')) return <MapPin size={14} className="text-slate-400" />;
        if (id.includes('cabin')) return <Home size={14} className="text-amber-600" />;
        if (id.includes('balcony')) return <Sparkles size={14} className="text-blue-300" />;
        if (id.includes('street')) return <MapPin size={14} className="text-zinc-500" />;
        if (id.includes('office')) return <Zap size={14} className="text-indigo-400" />;
        return <MapPin size={14} className="text-pink-400" />;
    };

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
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <motion.div 
                className="modal-content glass-panel" 
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                style={{ maxWidth: '600px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
            >
                {/* Header */}
                <div className="modal-header" style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <MapPin className="premium-gradient-text" size={24} />
                        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Shift Reality</h2>
                    </div>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Grid */}
                <div className="modal-body custom-scrollbar" style={{ overflowY: 'auto', paddingRight: '5px' }}>
                    <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}
                    >
                        {locations.map((loc) => {
                            const isActive = currentLocationId === loc.id;
                            return (
                                <motion.div
                                    key={loc.id}
                                    variants={itemVariants}
                                    whileHover={{ y: -4 }}
                                >
                                    <button
                                        onClick={() => onSelect(loc.id)}
                                        style={{ 
                                            width: '100%',
                                            textAlign: 'left',
                                            padding: '8px',
                                            paddingBottom: '12px',
                                            borderRadius: '16px',
                                            background: isActive ? 'rgba(168, 85, 247, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                                            border: `1px solid ${isActive ? '#a855f7' : 'rgba(255,255,255,0.05)'}`,
                                            transition: 'all 0.3s ease',
                                            cursor: 'pointer',
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <div style={{ aspectRatio: '16/10', borderRadius: '12px', overflow: 'hidden', marginBottom: '10px', position: 'relative' }}>
                                            <img 
                                                src={loc.image} 
                                                alt={loc.name}
                                                style={{ width: '100%', height: '100%', objectCover: 'cover', opacity: 0.8 }}
                                            />
                                            <div style={{ position: 'absolute', top: '6px', left: '6px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '4px', borderRadius: '8px', display: 'flex' }}>
                                                {getIcon(loc.id)}
                                            </div>
                                            {isActive && (
                                                <div style={{ position: 'absolute', top: '6px', right: '6px', background: '#a855f7', color: 'white', fontSize: '10px', fontWeight: '900', padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase' }}>
                                                    Current
                                                </div>
                                            )}
                                        </div>
                                        <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 'bold', color: isActive ? '#c084fc' : '#eee', marginBottom: '2px' }}>{loc.name}</h4>
                                        <p style={{ margin: 0, fontSize: '0.65rem', color: '#a1a1aa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{loc.mood}</p>
                                    </button>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>

                <div className="modal-footer" style={{ marginTop: '1.5rem', textAlign: 'center', color: '#52525b', fontSize: '0.7rem' }}>
                    AI will automatically adapt its context and behavior to match your chosen setting.
                </div>
            </motion.div>
        </div>
    );
};

export default LocationSwitcher;
