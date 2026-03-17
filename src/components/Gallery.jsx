import React, { useState, useEffect } from 'react';
import { ArrowLeft, Lock, X, Maximize2, MessageSquare, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Gallery = ({ onBack, allPersonas = [], onSelectImage }) => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [activeCategory, setActiveCategory] = useState('All');
    
    // Flatten all images into a single list with metadata
    const allImages = allPersonas.flatMap(persona => {
        const gallery = persona.gallery || [persona.image];
        return gallery.map((img, idx) => ({
            url: img,
            personaId: persona.id,
            personaName: persona.name,
            category: persona.category || 'Modern',
            isProfile: (localStorage.getItem(`persona_img_${persona.id}`) || persona.image) === img,
            id: `${persona.id}_${idx}`
        }));
    });

    const categories = ['All', 'Family', 'Professional', 'Modern', 'Traditional', 'Memories'];
    
    const filteredImages = allImages.filter(img => 
        activeCategory === 'All' || img.category === activeCategory
    );

    const handleSetProfile = (imgObj) => {
        if (imgObj.isMoment) return; // Can't set moments as profile directly
        localStorage.setItem(`persona_img_${imgObj.personaId}`, imgObj.url);
        if (onSelectImage) onSelectImage(imgObj.personaId, imgObj.url);
        // Update local state to show 'Check' icon
        setSelectedImage({ ...imgObj, isProfile: true });
    };

    const getMemorableMoments = () => {
        const moments = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('moments_')) {
                const personaId = key.replace('moments_', '');
                const persona = allPersonas.find(p => p.id === personaId);
                if (persona) {
                    try {
                        const personaMoments = JSON.parse(localStorage.getItem(key));
                        if (Array.isArray(personaMoments)) {
                            personaMoments.forEach(m => {
                                moments.push({
                                    ...m,
                                    personaId,
                                    personaName: persona.name,
                                    category: 'Memories',
                                    isMoment: true,
                                    url: m.image // Use the image stored with the moment
                                });
                            });
                        }
                    } catch (e) {}
                }
            }
        }
        return moments.sort((a, b) => b.id - a.id);
    };

    const displayItems = activeCategory === 'Memories' 
        ? getMemorableMoments()
        : filteredImages;

    return (
        <div className="gallery-layout" style={{ 
            minHeight: '100vh',
            background: '#09090b',
            color: '#f4f4f5',
            paddingBottom: '5rem'
        }}>
            {/* Header */}
            <header style={{
                padding: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'sticky',
                top: 0,
                background: 'rgba(9, 9, 11, 0.8)',
                backdropFilter: 'blur(12px)',
                zIndex: 100,
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
                <button onClick={onBack} style={{ 
                    background: 'rgba(255, 255, 255, 0.05)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#f4f4f5',
                    padding: '0.6rem 1rem',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <ArrowLeft size={18} /> Back
                </button>
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', background: 'linear-gradient(to right, #f472b6, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Visual Library
                    </h2>
                </div>
                <div style={{ width: '80px' }}></div> {/* Spacer */}
            </header>

            {/* Content */}
            <div style={{ padding: '1.5rem' }}>
                {/* Category Pills */}
                <div style={{ 
                    display: 'flex', 
                    gap: '0.6rem', 
                    overflowX: 'auto', 
                    marginBottom: '2rem',
                    paddingBottom: '8px',
                    scrollbarWidth: 'none'
                }}>
                    {categories.map(cat => (
                        <motion.button
                            key={cat}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setActiveCategory(cat)}
                            style={{
                                padding: '0.5rem 1.2rem',
                                background: activeCategory === cat ? 'rgba(192, 132, 252, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                                color: activeCategory === cat ? '#c084fc' : '#a1a1aa',
                                border: `1px solid ${activeCategory === cat ? 'rgba(192, 132, 252, 0.5)' : 'rgba(255, 255, 255, 0.05)'}`,
                                borderRadius: '20px',
                                fontSize: '0.85rem',
                                fontWeight: activeCategory === cat ? '600' : '400',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {cat}
                        </motion.button>
                    ))}
                </div>

                {/* Grid */}
                <motion.div 
                    layout
                    style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', 
                        gap: '8px' 
                    }}
                >
                    <AnimatePresence mode='popLayout'>
                        {displayItems.map((img) => (
                            <motion.div
                                key={img.id || `${img.personaId}_${img.timestamp}`}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedImage(img)}
                                style={{
                                    position: 'relative',
                                    aspectRatio: '2/3',
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    background: '#18181b',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                }}
                            >
                                <img 
                                    src={img.url} 
                                    alt={img.personaName} 
                                    style={{ 
                                        width: '100%', 
                                        height: '100%', 
                                        objectFit: 'cover'
                                    }} 
                                />
                                <div style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    padding: '2rem 0.5rem 0.5rem 0.5rem',
                                    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'flex-end',
                                    opacity: 0.8
                                }}>
                                    <span style={{ fontSize: '0.65rem', fontWeight: '500', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {img.personaName.split('(')[0]}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* Lightbox / Full Screen View */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0, 0, 0, 0.95)',
                            display: 'flex',
                            flexDirection: 'column',
                            zIndex: 1000,
                            backdropFilter: 'blur(20px)'
                        }}
                    >
                        {/* Header Controls */}
                        <div style={{
                            padding: '1.5rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '1rem', fontWeight: '600' }}>{selectedImage.personaName}</span>
                                <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>{selectedImage.category} Collection</span>
                            </div>
                            <button 
                                onClick={() => setSelectedImage(null)}
                                style={{ 
                                    background: 'rgba(255, 255, 255, 0.1)', 
                                    border: 'none', 
                                    color: 'white', 
                                    padding: '0.5rem', 
                                    borderRadius: '50%',
                                    cursor: 'pointer'
                                }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Image Body */}
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '1rem'
                        }}>
                            <motion.img
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                src={selectedImage.url}
                                alt="Full screen"
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '70%',
                                    borderRadius: '16px',
                                    boxShadow: '0 0 50px rgba(0,0,0,0.5)',
                                    objectFit: 'contain'
                                }}
                            />
                            {selectedImage.isMoment && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        position: 'absolute',
                                        bottom: '20%',
                                        width: '90%',
                                        maxWidth: '400px',
                                        background: 'rgba(0,0,0,0.8)',
                                        backdropFilter: 'blur(12px)',
                                        padding: '1.5rem',
                                        borderRadius: '16px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        textAlign: 'center',
                                        fontStyle: 'italic',
                                        fontSize: '1rem',
                                        lineHeight: '1.6',
                                        color: '#e4e4e7',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                                    }}
                                >
                                    "{selectedImage.content}"
                                </motion.div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div style={{
                            padding: '2rem 1.5rem',
                            display: 'flex',
                            gap: '1rem',
                            background: 'linear-gradient(transparent, rgba(0,0,0,0.5))'
                        }}>
                                {!selectedImage.isMoment && (
                                    <button
                                        onClick={() => handleSetProfile(selectedImage)}
                                        style={{
                                            flex: 1,
                                            padding: '1rem',
                                            borderRadius: '16px',
                                            border: 'none',
                                            background: selectedImage.isProfile ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                                            color: selectedImage.isProfile ? '#4ade80' : 'white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {selectedImage.isProfile ? <UserCheck size={20} /> : <Maximize2 size={20} />}
                                        {selectedImage.isProfile ? 'Active Profile' : 'Set as Avatar'}
                                    </button>
                                )}

                            <button
                                onClick={() => {
                                    // logic to start chat - close gallery first then trigger select
                                    // Since we don't have direct onSelectPersona here, we'd need to go back or handle it in App
                                    setSelectedImage(null);
                                    onBack(); // Go back home
                                }}
                                style={{
                                    flex: 1,
                                    padding: '1rem',
                                    borderRadius: '16px',
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #ec4899 0%, #d946ef 100%)',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                <MessageSquare size={20} />
                                Chat Now
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Gallery;
