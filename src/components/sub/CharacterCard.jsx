import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, Map as MapIcon, Info, Shirt, MessageSquare, Play } from 'lucide-react';
import { statusUpdates } from '../../data/statusUpdates';
import * as relationshipService from '../../services/relationship';
import { getDiaries } from '../../services/memory';
import StatusInteraction from './StatusInteraction';
import StatusViewer from './StatusViewer';

const CharacterCard = ({ persona, onSelectPersona, onOpenStoryMap, onOpenDiary, onOpenDetails, onOpenWardrobe, itemVariants }) => {
    const statusBubbleRef = useRef(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [hasDiary, setHasDiary] = useState(false);
    const [isStatusExpanded, setIsStatusExpanded] = useState(false);
    const [isFullStatusOpen, setIsFullStatusOpen] = useState(false);
    const [equippedImage, setEquippedImage] = useState(persona.image);
    const [refreshKey, setRefreshKey] = useState(0);
    const isVideo = equippedImage?.toLowerCase().endsWith('.mp4');
    const isGif = equippedImage?.toLowerCase().endsWith('.gif');
    const isMediaLoop = isVideo || isGif;
    
    // Status Ring Logic
    const hasStatus = statusUpdates[persona.id];
    const [isStatusRead, setIsStatusRead] = useState(() => {
        return localStorage.getItem(`status_read_${persona.id}`) === 'true';
    });

    const handleOpenStatus = (e) => {
        e.stopPropagation();
        setIsFullStatusOpen(true);
        setIsStatusRead(true);
        localStorage.setItem(`status_read_${persona.id}`, 'true');
    };
    
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (statusBubbleRef.current && !statusBubbleRef.current.contains(event.target)) {
                setIsStatusExpanded(false);
            }
        };
        if (isStatusExpanded) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isStatusExpanded]);

    useEffect(() => {
        const loadState = async () => {
            const diaries = await getDiaries(persona.id);
            setHasDiary(diaries.length > 0);
            
            const equippedId = await relationshipService.getEquippedOutfit(persona.id);
            if (equippedId && persona.wardrobe) {
                const outfit = persona.wardrobe.find(o => o.id === equippedId);
                if (outfit) setEquippedImage(outfit.avatar);
            } else {
                setEquippedImage(persona.image);
            }
        };
        loadState();
    }, [persona.id, persona.image, persona.wardrobe, refreshKey]);

    useEffect(() => {
        const handleRefresh = (e) => {
            if (e.detail?.personaId === persona.id) {
                setRefreshKey(prev => prev + 1);
            }
        };
        window.addEventListener('wardrobeUpdated', handleRefresh);
        return () => window.removeEventListener('wardrobeUpdated', handleRefresh);
    }, [persona.id]);

    return (
        <motion.div
            className={`persona-card-wrapper ${!imageLoaded ? 'skeleton' : ''}`}
            variants={itemVariants}
            style={{ position: 'relative', overflow: 'visible' }}
        >
            {/* STATUS RING OVERLAY */}
            {hasStatus && !isStatusRead && (
                <div 
                    onClick={handleOpenStatus}
                    style={{
                        position: 'absolute',
                        top: '-10px',
                        left: '-10px',
                        right: '-10px',
                        bottom: '-10px',
                        borderRadius: '34px',
                        border: '3px solid transparent',
                        background: 'linear-gradient(135deg, #f472b6, #a855f7) border-box',
                        WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                        WebkitMaskComposite: 'destination-out',
                        maskComposite: 'exclude',
                        zIndex: 2,
                        cursor: 'pointer',
                        animation: 'pulse-ring 2s infinite'
                    }}
                />
            )}

            <div 
                className="persona-card-inner"
                onClick={() => onSelectPersona(persona)}
                style={{
                    backgroundImage: (imageLoaded && !imageError && !isMediaLoop) ? `url(${equippedImage})` : 'linear-gradient(135deg, #27272a, #09090b)',
                    backgroundColor: '#111',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-12px) scale(1.03)';
                    e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.4)';
                    e.currentTarget.style.boxShadow = '0 20px 45px rgba(0,0,0,0.7), 0 0 20px rgba(168, 85, 247, 0.2)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.boxShadow = '0 15px 35px rgba(0,0,0,0.6)';
                }}
            >
                {isVideo ? (
                    <video
                        src={equippedImage}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="no-select"
                        onLoadedData={() => setImageLoaded(true)}
                        onError={() => {
                            setImageError(true);
                            setImageLoaded(true);
                        }}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            zIndex: 0,
                            opacity: imageLoaded ? 1 : 0,
                            transition: 'opacity 0.5s ease'
                        }}
                    />
                ) : isGif ? (
                    <img 
                        src={equippedImage} 
                        className="no-select"
                        onLoad={() => setImageLoaded(true)} 
                        onError={() => {
                            setImageError(true);
                            setImageLoaded(true);
                        }}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            zIndex: 0,
                            opacity: imageLoaded ? 1 : 0,
                            transition: 'opacity 0.5s ease'
                        }}
                        alt=""
                    />
                ) : (
                    <img 
                        src={equippedImage} 
                        className="no-select"
                        style={{ display: 'none' }} 
                        onLoad={() => setImageLoaded(true)} 
                        onError={() => {
                            setImageError(true);
                            setImageLoaded(true);
                        }}
                        alt=""
                    />
                )}

                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: imageError 
                        ? 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.2) 50%, rgba(255,255,255,0.02) 100%)'
                        : 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 30%, transparent 60%)',
                    zIndex: 1,
                    opacity: imageLoaded ? 1 : 0,
                    transition: 'opacity 0.3s ease'
                }}></div>

                {imageError && (
                    <div style={{
                        position: 'absolute',
                        top: '40%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 1,
                        textAlign: 'center',
                        width: '100%',
                        padding: '0 2rem'
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}>✨</div>
                    </div>
                )}

                <div className="persona-info" style={{ 
                    position: 'relative', 
                    zIndex: 2, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    height: '100%', 
                    justifyContent: 'flex-end', 
                    padding: '1.25rem',
                    opacity: imageLoaded ? 1 : 0,
                    transition: 'opacity 0.3s ease'
                }}>
                    <div style={{ marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                            {persona.isActive && (
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '8px',
                                    background: 'rgba(255,255,255,0.1)',
                                    backdropFilter: 'blur(8px)',
                                    padding: '4px 8px',
                                    borderRadius: '12px',
                                    width: 'fit-content',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    <span className="status-dot" style={{ width: '6px', height: '6px' }}></span>
                                    <span style={{ fontSize: '0.7rem', fontWeight: '600', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Now</span>
                                </div>
                            )}

                            {persona.isTrending && (
                                <div style={{ 
                                    background: 'linear-gradient(135deg, #ef4444, #f97316)',
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    fontSize: '0.65rem',
                                    fontWeight: '800',
                                    color: 'white',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                                }}>
                                    Trending
                                </div>
                            )}

                            {persona.isNew && (
                                <div style={{ 
                                    background: 'linear-gradient(135deg, #22c55e, #10b981)',
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    fontSize: '0.65rem',
                                    fontWeight: '800',
                                    color: 'white',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
                                }}>
                                    New
                                </div>
                            )}
                        </div>
                        
                        <h3 className="persona-name" style={{ 
                            fontSize: '1.75rem', 
                            fontWeight: '900', 
                            margin: '0', 
                            letterSpacing: '-0.03em',
                            textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                            lineHeight: 1.1,
                            color: '#fff'
                        }}>
                            {persona.name}
                        </h3>
                        <p className="persona-tagline" style={{ 
                            color: 'rgba(255,255,255,0.85)', 
                            fontSize: '0.9rem', 
                            margin: '8px 0 0 0', 
                            lineHeight: 1.4, 
                            fontWeight: '500',
                            maxWidth: '90%'
                        }}>
                            {persona.tagline}
                        </p>
                    </div>

                    <div style={{ 
                        marginTop: '0.75rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}>

                        <div style={{ 
                            display: 'flex', 
                            gap: '8px', 
                            justifyContent: 'flex-start',
                            alignItems: 'center'
                        }}>
                        {statusUpdates[persona.id] && (
                            <motion.div 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsStatusExpanded(!isStatusExpanded);
                                }}
                                whileHover={{ scale: 1.05, background: 'rgba(9, 9, 11, 0.95)' }}
                                style={{ 
                                    fontSize: '0.65rem', 
                                    color: '#fff', 
                                    fontWeight: '700',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    background: 'rgba(244, 114, 182, 0.15)',
                                    backdropFilter: 'blur(10px)',
                                    padding: '4px 10px',
                                    borderRadius: '100px',
                                    width: 'fit-content',
                                    border: '1px solid rgba(244, 114, 182, 0.4)',
                                    borderLeft: '3px solid #f472b6',
                                    cursor: 'pointer',
                                    pointerEvents: 'auto',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                }}
                            >
                                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#f472b6' }}></span>
                                <span>Status</span>
                            </motion.div>
                        )}

                            {persona.wardrobe && persona.wardrobe.length > 0 && (
                                <motion.button
                                    whileHover={{ scale: 1.1, background: 'rgba(244, 114, 182, 0.2)', y: -2 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => { e.stopPropagation(); onOpenWardrobe(persona); }}
                                    style={{ background: 'rgba(244, 114, 182, 0.1)', border: '1px solid rgba(244, 114, 182, 0.2)', borderRadius: '10px', color: '#f472b6', padding: '6px', display: 'flex', alignItems: 'center' }}
                                >
                                    <Shirt size={18} />
                                </motion.button>
                            )}

                            <motion.button
                                whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.15)', y: -2 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => { e.stopPropagation(); onOpenStoryMap(persona); }}
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', padding: '6px', display: 'flex', alignItems: 'center' }}
                            >
                                <MapIcon size={18} />
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.1, background: 'rgba(59, 130, 246, 0.2)', y: -2 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => { e.stopPropagation(); onOpenDetails(persona); }}
                                style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '10px', color: '#60a5fa', padding: '6px', display: 'flex', alignItems: 'center' }}
                            >
                                <Info size={18} />
                            </motion.button>

                            {hasDiary && (
                                <motion.button
                                    whileHover={{ scale: 1.1, background: 'rgba(168, 85, 247, 0.2)', y: -2 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => { e.stopPropagation(); onOpenDiary(persona); }}
                                    style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.2)', borderRadius: '10px', color: '#c084fc', padding: '6px', display: 'flex', alignItems: 'center' }}
                                >
                                    <Book size={18} />
                                </motion.button>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            <AnimatePresence>
                {isFullStatusOpen && (
                    <StatusViewer 
                        persona={persona}
                        status={statusUpdates[persona.id]}
                        onClose={() => setIsFullStatusOpen(false)}
                    />
                )}
                {isStatusExpanded && (
                    <StatusInteraction 
                        persona={persona}
                        status={statusUpdates[persona.id]}
                        onClose={() => setIsStatusExpanded(false)}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default CharacterCard;
