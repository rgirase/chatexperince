import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Zap, Shield, Loader2, Binary, Activity, Terminal } from 'lucide-react';
import { checkServerStatus } from '../../services/llm';

const NeuralLink = ({ onComplete }) => {
    const [status, setStatus] = useState('initializing'); // initializing, syncing, localized, success, fail
    const [log, setLog] = useState([]);
    const [results, setResults] = useState({ lm: false, comfy: false });

    const addLog = (msg) => setLog(prev => [...prev.slice(-4), { id: Date.now(), msg }]);

    const runCalibration = async () => {
        addLog("BOOT_SEQUENCE_INITIATED...");
        await new Promise(r => setTimeout(r, 800));
        
        setStatus('syncing');
        addLog("POLLING_NEURAL_CORE_AT_1234...");
        const lm = await checkServerStatus('lm');
        setResults(prev => ({ ...prev, lm: lm.online }));
        addLog(lm.online ? "NEURAL_CORE_SYNCHRONIZED" : "CORE_OFFLINE_DETACHED");
        
        await new Promise(r => setTimeout(r, 1000));
        addLog("POLLING_VISUAL_ENGINE_AT_8188...");
        const comfy = await checkServerStatus('comfy');
        setResults(prev => ({ ...prev, comfy: comfy.online }));
        addLog(comfy.online ? "VISUAL_ENGINE_SYNCHRONIZED" : "VISUAL_ENGINE_NOT_FOUND");
        
        await new Promise(r => setTimeout(r, 1200));
        setStatus(lm.online && comfy.online ? 'success' : 'fail');
    };

    useEffect(() => {
        runCalibration();
    }, []);

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: '#050507',
            zIndex: 20000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            fontFamily: "'Courier New', Courier, monospace"
        }}>
            {/* Matrix Data Stream Background */}
            <div style={{ position: 'absolute', inset: 0, opacity: 0.1, pointerEvents: 'none', overflow: 'hidden' }}>
                <div style={{ display: 'flex', gap: '20px', width: '200%', transform: 'rotate(-45deg) translateY(-20%)' }}>
                    {Array.from({ length: 20 }).map((_, i) => (
                        <motion.div 
                            key={i}
                            animate={{ y: [-1000, 1000] }}
                            transition={{ duration: 10 + Math.random() * 20, repeat: Infinity, ease: 'linear' }}
                            style={{ color: '#00ff41', fontSize: '10px' }}
                        >
                            {Array.from({ length: 50 }).map(() => (Math.random() > 0.5 ? '1' : '0')).join('\n')}
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Central Calibration Ring */}
            <div style={{ position: 'relative', width: '300px', height: '300px' }}>
                <svg width="300" height="300" viewBox="0 0 100 100">
                    <motion.circle 
                        cx="50" cy="50" r="45" stroke="#1f1f1f" strokeWidth="0.5" fill="none"
                    />
                    <motion.circle 
                        cx="50" cy="50" r="40" stroke="#00ff41" strokeWidth="0.5" fill="none"
                        strokeDasharray="1 5"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                    />
                    <motion.circle 
                        cx="50" cy="50" r="35" stroke="#00ff41" strokeWidth="2" fill="none"
                        strokeDasharray="10 50"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                        style={{ opacity: 0.3 }}
                    />
                    
                    {/* Retinal/Scanning Element */}
                    <motion.path 
                        d="M 20 50 L 80 50"
                        stroke="#00ff41"
                        strokeWidth="0.5"
                        initial={{ y: -30, opacity: 0 }}
                        animate={{ y: 30, opacity: [0, 1, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                </svg>

                <div style={{ 
                    position: 'absolute', inset: 0, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center' 
                }}>
                    <AnimatePresence mode="wait">
                        {status === 'success' ? (
                            <motion.div key="sc" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                <Shield size={48} color="#00ff41" />
                            </motion.div>
                        ) : (
                            <motion.div key="lc" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <Loader2 size={48} color="#00ff41" className="spin" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Status Console Overlay */}
            <div style={{ 
                marginTop: '4rem', width: '100%', maxWidth: '400px', 
                background: 'rgba(0, 255, 65, 0.05)', 
                border: '1px solid rgba(0, 255, 65, 0.2)',
                padding: '1.5rem', borderRadius: '4px',
                boxShadow: '0 0 20px rgba(0, 255, 65, 0.1)'
            }}>
                <div style={{ color: '#00ff41', fontSize: '10px', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>SYSTEM_CALIBRATION_V2.0</span>
                    <Activity size={10} />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {log.map(item => (
                        <motion.div 
                            key={item.id}
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            style={{ color: '#00ff41', fontSize: '11px' }}
                        >
                            <span style={{ opacity: 0.5 }}>{'> '}</span> {item.msg}
                        </motion.div>
                    ))}
                    {status === 'success' && (
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            style={{ 
                                color: '#00ff41', fontSize: '12px', fontWeight: '800', 
                                textAlign: 'center', marginTop: '1rem', borderTop: '1px solid rgba(0,255,65,0.2)',
                                paddingTop: '1rem'
                            }}
                        >
                            ALL_SYSTEMS_LINKED_PROCEED_TO_GRID
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1.5rem' }}>
                {(status === 'success' || status === 'fail') && (
                    <motion.button 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        onClick={onComplete}
                        style={{ 
                            background: status === 'success' ? '#00ff41' : 'transparent',
                            color: status === 'success' ? '#000' : '#00ff41',
                            border: `1px solid #00ff41`,
                            padding: '0.75rem 2rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            textTransform: 'uppercase',
                            fontSize: '12px',
                            letterSpacing: '0.1em'
                        }}
                    >
                        {status === 'success' ? 'Establish Link' : 'Override & Proceed'}
                    </motion.button>
                )}
                {status === 'fail' && (
                    <motion.button 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        onClick={runCalibration}
                        style={{ 
                            background: 'transparent',
                            color: '#00ff41',
                            border: '1px dotted #00ff41',
                            padding: '0.75rem 1rem',
                            cursor: 'pointer',
                            fontSize: '12px'
                        }}
                    >
                        Retry_Calibration
                    </motion.button>
                )}
            </div>

            <div style={{ 
                position: 'absolute', bottom: '2rem', 
                color: 'rgba(0, 255, 65, 0.3)', fontSize: '8px', 
                letterSpacing: '0.4em', textAlign: 'center' 
            }}>
                ENCRYPTION_LAYER_ACTIVE | BUFFER_SYNCED | AURA_DNA_LOADED
            </div>
        </div>
    );
};

export default NeuralLink;
