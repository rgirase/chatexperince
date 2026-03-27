import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import galleryManifest from '../../data/gallery_manifest.json';

const GalleryModal = ({ isOpen, onClose, persona }) => {
    const [selectedIndex, setSelectedIndex] = useState(null);
    
    // Merge persona.gallery with manifest images for this persona ID
    const manifestImages = galleryManifest[persona.id] || [];
    const baseGallery = persona.gallery || [persona.image];
    
    // Combine and deduplicate by filename (preferring manifest paths)
    const gallery = [];
    const seenFilenames = new Set();
    
    // Process manifest images first (they are audited and fixed)
    manifestImages.forEach(path => {
        const filename = path.split('/').pop().toLowerCase();
        if (!seenFilenames.has(filename)) {
            gallery.push(path);
            seenFilenames.add(filename);
        }
    });
    
    // Then add base gallery images if they aren't already represented
    baseGallery.forEach(path => {
        const filename = path.split('/').pop().toLowerCase();
        if (!seenFilenames.has(filename)) {
            gallery.push(path);
            seenFilenames.add(filename);
        }
    });

    if (!isOpen) return null;

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
                    background: 'rgba(15, 15, 20, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h2 className="premium-gradient-text" style={{ margin: 0, fontSize: '1.5rem' }}>Personal Gallery</h2>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#a1a1aa' }}>Collection of photos shared by {persona.name}</p>
                    </div>
                    <button 
                        onClick={onClose}
                        style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Grid */}
                <div style={{ 
                    flex: 1, 
                    overflowY: 'auto', 
                    paddingRight: '4px',
                }}>
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
                                    alt={`${persona.name} photo ${idx}`} 
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
