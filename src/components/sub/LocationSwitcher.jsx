import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllLocations } from '../../services/LocationService';
import { X, MapPin, Sparkles, Wind, Coffee, Moon, Heart } from 'lucide-react';

const LocationSwitcher = ({ currentLocationId, onSelect, onClose }) => {
    const locations = getAllLocations();

    const getIcon = (id) => {
        if (id.includes('kitchen')) return <Coffee size={14} className="text-orange-400" />;
        if (id.includes('living')) return <Moon size={14} className="text-blue-400" />;
        if (id.includes('poolside')) return <Wind size={14} className="text-cyan-400" />;
        if (id.includes('bedroom')) return <Heart size={14} className="text-pink-400" />;
        if (id.includes('office')) return <Sparkles size={14} className="text-purple-400" />;
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
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 md:p-8"
        >
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-zinc-950/50 border border-white/10 rounded-[32px] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] relative"
            >
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex justify-between items-start relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-pink-500/10 to-purple-500/10 opacity-50 pointer-events-none" />
                    <div className="relative z-10">
                        <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                            <span className="premium-gradient-text">Shift Reality</span>
                        </h2>
                        <p className="text-zinc-400 text-sm mt-1 font-medium italic">Change your surroundings to reshape the narrative flow.</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="relative z-10 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white p-3 rounded-full transition-all border border-white/5 hover:border-white/20 active:scale-95"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {locations.map((loc) => {
                            const isActive = currentLocationId === loc.id;
                            return (
                                <motion.div
                                    key={loc.id}
                                    variants={itemVariants}
                                    whileHover={{ y: -8 }}
                                    className="relative"
                                >
                                    <button
                                        onClick={() => onSelect(loc.id)}
                                        className={`w-full text-left group relative rounded-3xl overflow-hidden transition-all duration-500 border-2 ${
                                            isActive 
                                            ? 'border-pink-500 shadow-[0_0_30px_rgba(236,72,153,0.3)]' 
                                            : 'border-white/5 hover:border-white/20'
                                        }`}
                                    >
                                        {/* Image Area */}
                                        <div className="aspect-[4/5] w-full overflow-hidden relative">
                                            <img 
                                                src={loc.image} 
                                                alt={loc.name}
                                                className={`w-full h-full object-cover transition-transform duration-700 ${
                                                    isActive ? 'scale-105' : 'group-hover:scale-110'
                                                }`}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent opacity-90" />
                                            
                                            {/* Status Badge */}
                                            {isActive && (
                                                <div className="absolute top-4 right-4 bg-pink-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl animate-pulse">
                                                    Current
                                                </div>
                                            )}

                                            {/* Mood Badge */}
                                            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl px-3 py-1.5 flex items-center gap-2">
                                                {getIcon(loc.id)}
                                                <span className="text-white text-[10px] font-bold uppercase tracking-tight">{loc.mood}</span>
                                            </div>
                                        </div>

                                        {/* Info Area */}
                                        <div className="absolute bottom-0 left-0 right-0 p-5">
                                            <h3 className="text-white text-xl font-bold leading-tight group-hover:text-pink-400 transition-colors">{loc.name}</h3>
                                            <p className="text-zinc-400 text-xs mt-1.5 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                                                {loc.sensory}
                                            </p>
                                        </div>

                                        {/* Selection Glow */}
                                        {isActive && (
                                            <div className="absolute inset-0 border-2 border-pink-500/50 rounded-3xl pointer-events-none" />
                                        )}
                                    </button>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>

                {/* Footer Tip */}
                <div className="p-6 bg-zinc-900/30 border-t border-white/5 text-center">
                    <div className="flex items-center justify-center gap-3 text-zinc-500">
                        <Sparkles size={14} className="text-pink-500/50" />
                        <span className="text-[11px] font-medium tracking-wide uppercase">AI will adapt its narrative context to match your chosen setting</span>
                        <Sparkles size={14} className="text-pink-500/50" />
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default LocationSwitcher;
