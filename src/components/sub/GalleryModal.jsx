import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
const GalleryModal = ({ isOpen, onClose, persona, messages = [] }) => {
    const [selectedIndex, setSelectedIndex] = useState(null);
    
    // Extract all images from message history (where msg.url exists)
    const gallery = messages
        .filter(msg => msg.url && msg.url.length > 20) // Ensure it's a valid data URI or path
        .map(msg => msg.url);
    
    // Add the current persona image as the "Profile" entry if the gallery is empty? 
    // User said "keep the profile picture", but for the chat gallery, let's keep it strictly to generated content.
    
    if (!isOpen) return null;

    const isEmpty = gallery.length === 0;

    return (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
            <motion.div 
                className="glass-panel"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                style={{
                    width: '95%',
                    maxWidth: '800px',
                    height: '85vh',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    position: 'relative',
                    padding: '1.5rem',
                    background: 'rgba(15, 15, 20, 0.98)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h2 className="premium-gradient-text" style={{ margin: 0, fontSize: '1.5rem' }}>Chat Media</h2>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#a1a1aa' }}>Collection of shared moments with {persona.name}</p>
                    </div>
                    <button 
                        onClick={onClose}
                        style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Grid or Empty State */}
                <div style={{ 
                    flex: 1, 
                    overflowY: 'auto', 
                    paddingRight: '4px',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {isEmpty ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5, gap: '12px' }}>
                            <div style={{ padding: '20px', borderRadius: '50%', border: '1px dashed rgba(255,255,255,0.2)' }}>
                                <Maximize2 size={40} />
                            </div>
                            <p style={{ color: '#fff', fontSize: '1rem', fontWeight: '500' }}>No media found in this chat yet.</p>
                            <p style={{ color: '#a1a1aa', fontSize: '0.8rem', textAlign: 'center', maxWidth: '300px' }}>
                                Generated selfies and scene images will automatically appear here.
                            </p>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                            gap: '12px'
                        }}>
                            {gallery.map((img, idx) => (
                                <motion.div
                                    key={idx}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setSelectedIndex(idx)}
                                    style={{
                                        aspectRatio: '1/1',
                                        borderRadius: '16px',
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        position: 'relative'
                                    }}
                                >
                                    <img 
                                        src={img} 
                                        alt={`${persona.name} media ${idx}`} 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                    <div style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.4))',
                                        display: 'flex',
                                        alignItems: 'flex-end',
                                        justifyContent: 'flex-end',
                                        padding: '8px'
                                    }}>
                                        <Maximize2 size={16} color="#fff" style={{ opacity: 0.6 }} />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Full screen Preview overlay */}
                <AnimatePresence>
                    {selectedIndex !== null && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{
                                position: 'fixed',
                                inset: 0,
                                background: 'rgba(0,0,0,0.9)',
                                zIndex: 11000,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '1rem'
                            }}
                            onClick={() => setSelectedIndex(null)}
                        >
                            <button 
                                onClick={(e) => { e.stopPropagation(); setSelectedIndex(null); }}
                                style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', padding: '10px', borderRadius: '50%', zIndex: 1, cursor: 'pointer' }}
                            >
                                <X size={24} />
                            </button>

                            <button 
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : gallery.length - 1));
                                }}
                                style={{ position: 'absolute', left: '20px', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', padding: '15px', borderRadius: '50%', zIndex: 1, cursor: 'pointer' }}
                            >
                                <ChevronLeft size={30} />
                            </button>

                            <motion.img 
                                key={selectedIndex}
                                initial={{ x: 100, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -100, opacity: 0 }}
                                src={gallery[selectedIndex]}
                                style={{ 
                                    maxWidth: '100%', 
                                    maxHeight: '100%', 
                                    objectFit: 'contain',
                                    borderRadius: '8px',
                                    boxShadow: '0 0 50px rgba(0,0,0,0.5)'
                                }}
                                onClick={(e) => e.stopPropagation()}
                            />

                            <button 
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setSelectedIndex((prev) => (prev < gallery.length - 1 ? prev + 1 : 0));
                                }}
                                style={{ position: 'absolute', right: '20px', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', padding: '15px', borderRadius: '50%', zIndex: 1, cursor: 'pointer' }}
                            >
                                <ChevronRight size={30} />
                            </button>
                            
                            <div style={{ position: 'absolute', bottom: '30px', color: '#fff', background: 'rgba(0,0,0,0.5)', padding: '6px 16px', borderRadius: '20px', fontSize: '0.9rem' }}>
                                {selectedIndex + 1} / {gallery.length}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default GalleryModal;
