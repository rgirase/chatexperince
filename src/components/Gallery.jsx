import React, { useState, useEffect } from 'react';
import { ArrowLeft, Lock, X, Maximize2, MessageSquare, UserCheck, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import galleryManifest from '../data/gallery_manifest.json';
import * as db from '../services/db';

const Gallery = ({ onBack, allPersonas = [], onSelectImage }) => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [activeCategory, setActiveCategory] = useState('All');
    const [profileOverrides, setProfileOverrides] = useState({});
    const [moments, setMoments] = useState([]);
    const [unlockedGallery, setUnlockedGallery] = useState({});
    const [isLoaded, setIsLoaded] = useState(false);
    const [hoveredItem, setHoveredItem] = useState(null);
    const [visibleCount, setVisibleCount] = useState(window.innerWidth < 768 ? 12 : 24);

    const fixUrl = (url) => {
        if (typeof url !== 'string') return url;
        if (url.startsWith('/gallery/')) {
            return url.replace('/gallery/', '/gallery-assets/');
        }
        return url;
    };
    
    useEffect(() => {
        const loadGalleryData = async () => {
            const overrides = {};
            const allMoments = [];
            const unlocked = {};
            
            for (const persona of allPersonas) {
                // 1. Load Profile Overrides
                let override = await db.getItem('settings', `persona_img_${persona.id}`);
                if (!override) {
                    override = localStorage.getItem(`persona_img_${persona.id}`);
                }
                if (override) overrides[persona.id] = override;

                // 2. Load Unlocked Gallery
                const unlockedList = await db.getItem('unlocked_gallery', `unlocked_${persona.id}`) || [];
                unlocked[persona.id] = unlockedList;

                // 3. Load Moments
                let pMoments = await db.getItem('memories', `moments_${persona.id}`);
                if (!pMoments) {
                    const localMoments = localStorage.getItem(`moments_${persona.id}`);
                    if (localMoments) {
                        try {
                            pMoments = JSON.parse(localMoments);
                            await db.setItem('memories', `moments_${persona.id}`, pMoments);
                        } catch (e) {}
                    }
                }
                if (Array.isArray(pMoments)) {
                    pMoments.forEach(m => {
                        allMoments.push({
                            ...m,
                            personaId: persona.id,
                            personaName: persona.name,
                            category: 'Memories',
                            isMoment: true,
                            url: m.image
                        });
                    });
                }
            }
            
            setProfileOverrides(overrides);
            setUnlockedGallery(unlocked);
            setMoments(allMoments.sort((a, b) => b.id - a.id));
            setIsLoaded(true);
        };
        
        loadGalleryData();
    }, [allPersonas]);

    // Reset visible count when category changes
    useEffect(() => {
        setVisibleCount(24);
    }, [activeCategory]);

    // Infinite scroll logic
    useEffect(() => {
        const handleScroll = () => {
            if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 500) {
                setVisibleCount(prev => prev + 24);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Flatten all images into a single list with metadata
    const allImages = allPersonas.flatMap(persona => {
        const extraGallery = galleryManifest[persona.id] || [];
        const gallery = Array.from(new Set([...(persona.gallery || []), ...(persona.image ? [persona.image] : []), ...extraGallery]));
        return gallery.map((img, idx) => ({
            url: img,
            personaId: persona.id,
            personaName: persona.name,
            category: persona.category || 'Modern',
            isProfile: (profileOverrides[persona.id] || persona.image) === img,
            id: `${persona.id}_${idx}`
        }));
    });

    const vaultImages = allPersonas.flatMap(persona => {
        const milestones = [
            { id: 'milestone_80', name: 'Intimate Portrait', score: 80 },
            { id: 'milestone_90', name: 'Midnight Secret', score: 90 },
            { id: 'milestone_100', name: 'Eternal Bond', score: 100 }
        ];

        return milestones.map(m => {
            const isUnlocked = (unlockedGallery[persona.id] || []).includes(m.id);
            return {
                ...m,
                personaId: persona.id,
                personaName: persona.name,
                category: 'Secret Vault',
                url: isUnlocked ? persona.image : '/assets/ui/locked_placeholder.jpg', // Placeholder for now
                isLocked: !isUnlocked
            };
        });
    });

    const categories = ['All', 'Video Clips', 'Family', 'Professional', 'Modern', 'Traditional', 'Memories', 'Secret Vault'];
    
    const filteredImages = [...allImages, ...vaultImages].filter(img => {
        if (activeCategory === 'All') return true;
        if (activeCategory === 'Video Clips') return img.url.endsWith('.mp4') || img.url.endsWith('.webm');
        return img.category === activeCategory;
    });

    const handleSetProfile = async (imgObj) => {
        if (imgObj.isMoment) return;
        await db.setItem('settings', `persona_img_${imgObj.personaId}`, imgObj.url);
        setProfileOverrides(prev => ({ ...prev, [imgObj.personaId]: imgObj.url }));
        if (onSelectImage) onSelectImage(imgObj.personaId, imgObj.url);
        setSelectedImage({ ...imgObj, isProfile: true });
    };

    const displayItems = activeCategory === 'Memories' 
        ? moments
        : filteredImages;

    if (!isLoaded) return <div style={{ background: '#09090b', minHeight: '100vh' }}></div>;

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
                <div style={{ width: '80px' }}></div>
            </header>

            {/* Content */}
            <div style={{ padding: '1.5rem' }}>
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

                <motion.div 
                    layout
                    style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', 
                        gap: '8px' 
                    }}
                >
                    <AnimatePresence mode='popLayout'>
                        {displayItems.slice(0, visibleCount).map((img) => (
                            <motion.div
                                key={img.id || `${img.personaId}_${img.timestamp}`}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    const isVideo = img.url.endsWith('.mp4') || img.url.endsWith('.webm') || img.url.endsWith('.webp');
                                    const isMobile = window.innerWidth < 768;
                                    
                                    if (isMobile && isVideo && hoveredItem !== img.id) {
                                        setHoveredItem(img.id);
                                    } else {
                                        setSelectedImage(img);
                                    }
                                }}
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
                                    {img.isLocked && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md">
                                            <div className="flex flex-col items-center gap-2">
                                                <Lock className="text-pink-500" size={24} />
                                                <span className="text-[10px] text-white/50 uppercase font-black">Level {img.score}</span>
                                            </div>
                                        </div>
                                    )}

                                    {(img.url.endsWith('.mp4') || img.url.endsWith('.webm') || img.url.endsWith('.webp')) ? (
                                        img.url.endsWith('.webp') ? (
                                            <img
                                                src={hoveredItem === img.id ? fixUrl(img.url) : fixUrl(img.url).replace('_clip.webp', '_shower.png')}
                                                onMouseEnter={() => setHoveredItem(img.id)}
                                                onMouseLeave={() => setHoveredItem(null)}
                                                loading="lazy"
                                                style={{ 
                                                    width: '100%', 
                                                    height: '100%', 
                                                    objectFit: 'cover'
                                                }}
                                                alt={img.personaName}
                                            />
                                        ) : (
                                            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                                <video 
                                                    src={fixUrl(img.url)} 
                                                    poster={fixUrl(img.url).replace(/_clip\.(mp4|webm|webp)$/, '_shower.png')}
                                                    muted 
                                                    loop 
                                                    playsInline
                                                    preload="metadata"
                                                    autoPlay={window.innerWidth < 768 && hoveredItem === img.id}
                                                    onMouseEnter={e => e.target.play()}
                                                    onMouseLeave={e => { e.target.pause(); e.target.currentTime = 0; }}
                                                    style={{ 
                                                        width: '100%', 
                                                        height: '100%', 
                                                        objectFit: 'cover'
                                                    }}
                                                />
                                                {(!hoveredItem || hoveredItem !== img.id) && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        inset: 0,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        background: 'rgba(0,0,0,0.2)',
                                                        pointerEvents: 'none'
                                                    }}>
                                                        <div style={{
                                                            background: 'rgba(236, 72, 153, 0.6)',
                                                            borderRadius: '50%',
                                                            padding: '0.5rem',
                                                            backdropFilter: 'blur(4px)'
                                                        }}>
                                                            <Play size={20} fill="white" color="white" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    ) : (
                                        <img 
                                            src={fixUrl(img.url)} 
                                            alt={img.personaName} 
                                            loading="lazy"
                                            style={{ 
                                                width: '100%', 
                                                height: '100%', 
                                                objectFit: 'cover',
                                                filter: img.isLocked ? 'blur(10px)' : 'none'
                                            }} 
                                        />
                                    )}
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

                        <div style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '1rem'
                        }}>
                            {(selectedImage.url.endsWith('.mp4') || selectedImage.url.endsWith('.webm') || selectedImage.url.endsWith('.webp')) ? (
                                selectedImage.url.endsWith('.webp') ? (
                                    <motion.img
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        src={fixUrl(selectedImage.url)}
                                        alt="Full screen animated"
                                        style={{
                                            maxWidth: '100vw',
                                            maxHeight: '100vh',
                                            boxShadow: '0 0 50px rgba(0,0,0,0.5)',
                                            objectFit: 'contain',
                                            width: '100%',
                                            height: 'auto'
                                        }}
                                    />
                                ) : (
                                    <motion.video
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        src={fixUrl(selectedImage.url)}
                                        poster={fixUrl(selectedImage.url).replace(/_clip\.(mp4|webm|webp)$/, '_shower.png')}
                                        controls
                                        autoPlay
                                        muted
                                        loop
                                        playsInline
                                        style={{
                                            maxWidth: '100vw',
                                            maxHeight: '100vh',
                                            boxShadow: '0 0 50px rgba(0,0,0,0.5)',
                                            objectFit: 'contain',
                                            width: '100%',
                                            height: 'auto'
                                        }}
                                    />
                                )
                            ) : (
                                <motion.img
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                    src={fixUrl(selectedImage.url)}
                                    alt="Full screen"
                                    style={{
                                        maxWidth: '100vw',
                                        maxHeight: '100vh',
                                        borderRadius: selectedImage.isMoment ? '16px' : '0',
                                        boxShadow: '0 0 50px rgba(0,0,0,0.5)',
                                        objectFit: 'contain',
                                        width: '100%',
                                        height: 'auto'
                                    }}
                                />
                            )}
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
                                    setSelectedImage(null);
                                    onBack();
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
