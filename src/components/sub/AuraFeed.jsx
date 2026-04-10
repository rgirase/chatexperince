import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Clock, Sparkles, MessageCircle, MoreHorizontal, Activity, WifiOff } from 'lucide-react';
import { auraLife } from '../../services/AutonomousService';
import { personas } from '../../data/personas';
import { checkServerStatus } from '../../services/llm';

const AuraFeed = ({ onSelectPersona }) => {
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCoreOnline, setIsCoreOnline] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            const recent = await auraLife.getRecentEvents();
            // Failsafe: Ensure everything is unwrapped if coming directly from DB
            const safeEvents = (recent || []).map(e => e.value || e);
            setEvents(safeEvents);
            setIsLoading(false);
            
            // Heartbeat check for LLM core
            const status = await checkServerStatus('lm');
            setIsCoreOnline(status.online);
        };
        
        fetchEvents();
        const interval = setInterval(fetchEvents, 30000);
        return () => clearInterval(interval);
    }, []);

    const getPersonaImage = (personaId) => {
        const persona = personas.find(p => p.id === personaId);
        return persona ? persona.image : '/assets/profiles/placeholder.png';
    };

    const handleActionClick = (personaId) => {
        if (onSelectPersona) {
            const persona = personas.find(p => p.id === personaId);
            if (persona) onSelectPersona(persona);
        }
    };

    if (isLoading && events.length === 0) {
        return (
            <div style={{ marginBottom: '2.5rem', padding: '0 0.5rem' }}>
                <div className="skeleton" style={{ height: '40px', width: '200px', borderRadius: '12px', marginBottom: '1rem' }} />
                <div style={{ display: 'flex', gap: '1rem' }}>
                   {[1,2,3].map(i => <div key={i} className="skeleton" style={{ flex: '0 0 280px', height: '280px', borderRadius: '20px' }} />)}
                </div>
            </div>
        );
    }

    // Always show something if the feature passed boot seeding
    if (events.length === 0) return null;

    return (
        <div style={{ marginBottom: '2.5rem', padding: '0 0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ 
                        width: '32px', height: '32px', borderRadius: '50%', 
                        background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 15px rgba(168, 85, 247, 0.4)'
                    }}>
                        <Smartphone size={16} color="white" />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#fff' }}>Aura Feed</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#71717a' }}>Real-time updates from characters</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '2px 6px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                                <Activity size={10} color={isCoreOnline ? "#22c55e" : "#f59e0b"} />
                                <span style={{ fontSize: '0.6rem', color: isCoreOnline ? '#22c55e' : '#f59e0b', fontWeight: '600' }}>
                                    {isCoreOnline ? 'CORE_ACTIVE' : 'CORE_OFFLINE (RESILIENT)'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                {!isCoreOnline && (
                    <div style={{ color: '#71717a', cursor: 'help' }} title="Aura is running in local resilience mode. Characters are using pre-learned patterns until the main core re-connects.">
                         <WifiOff size={16} />
                    </div>
                )}
            </div>

            <div style={{ 
                display: 'flex', 
                gap: '1rem', 
                overflowX: 'auto', 
                paddingBottom: '1rem',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
            }} className="no-scrollbar">
                <AnimatePresence mode="popLayout">
                    {events.map((event, index) => (
                        <motion.div
                            key={event.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9, x: 20 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.4, delay: index * 0.05 }}
                            style={{
                                flex: '0 0 280px',
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                borderRadius: '20px',
                                padding: '1rem',
                                position: 'relative',
                                overflow: 'hidden',
                                backdropFilter: 'blur(10px)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ 
                                        width: '40px', height: '40px', borderRadius: '50%', 
                                        border: '2px solid #a855f7', padding: '2px'
                                    }}>
                                        <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#18181b', overflow: 'hidden' }}>
                                            <img 
                                                src={getPersonaImage(event.personaId)} 
                                                alt="" 
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                                onError={(e) => e.target.src = '/assets/profiles/placeholder.png'}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff' }}>{event.personaName}</div>
                                        <div style={{ fontSize: '0.7rem', color: '#71717a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Clock size={10} /> {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                                <MoreHorizontal size={14} color="#3f3f46" />
                            </div>

                            <p style={{ 
                                fontSize: '0.85rem', 
                                color: '#d4d4d8', 
                                margin: '0 0 1rem 0', 
                                fontStyle: 'italic',
                                lineBreak: 'anywhere'
                            }}>
                                "{event.status}"
                            </p>

                            {event.isMediaPending ? (
                                <div style={{ 
                                    width: '100%', height: '150px', borderRadius: '12px', 
                                    background: 'rgba(255, 255, 255, 0.02)', border: '1px dashed rgba(255, 255, 255, 0.1)',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    gap: '8px'
                                }}>
                                    <Sparkles size={16} color="#a855f7" className="pulse-slow" />
                                    <span style={{ fontSize: '0.7rem', color: '#71717a' }}>Imagining this moment...</span>
                                </div>
                            ) : (
                                <img 
                                    src={event.imageUrl} 
                                    alt="Moment" 
                                    style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '12px' }} 
                                />
                            )}

                            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                                <motion.div 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleActionClick(event.personaId)}
                                    style={{ 
                                        color: '#ec4899', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '4px', 
                                        fontSize: '0.75rem',
                                        cursor: 'pointer',
                                        fontWeight: '600'
                                    }}
                                >
                                    <MessageCircle size={14} /> Send message
                                </motion.div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AuraFeed;
