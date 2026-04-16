import React, { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Zap, Cpu, Activity, ShieldCheck, AlertCircle, RefreshCw, Terminal } from 'lucide-react';
import { checkServerStatus, fetchSystemStats } from '../../services/llm';

const LiveLabWidget = ({ className = "" }) => {
    const [lmStatus, setLmStatus] = useState({ online: false, loading: true });
    const [comfyStatus, setComfyStatus] = useState({ online: false, loading: true });
    const [vramStats, setVramStats] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleModelChange = (e) => {
        const newModel = e.target.value;
        localStorage.setItem('lmStudioModel', newModel);
        setLmStatus(prev => ({ ...prev, activeModel: newModel }));
    };

    const refreshStats = async () => {
        setIsRefreshing(true);
        const [lm, comfy, vram] = await Promise.all([
            checkServerStatus('lm'),
            checkServerStatus('comfy'),
            fetchSystemStats()
        ]);
        setLmStatus({ ...lm, loading: false });
        setComfyStatus({ ...comfy, loading: false });
        setVramStats(vram);
        setIsRefreshing(false);
    };

    useEffect(() => {
        refreshStats();
        const interval = setInterval(refreshStats, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    const isReady = lmStatus.online && comfyStatus.online;

    return (
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass-panel ${className}`}
            style={{ 
                padding: '1.25rem',
                marginBottom: '2rem',
                border: '1px solid rgba(168, 85, 247, 0.2)',
                background: 'rgba(9, 9, 11, 0.6)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.5rem',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Background Glow Effect */}
            <div style={{ 
                position: 'absolute', 
                top: '-50%', 
                left: '-10%', 
                width: '40%', 
                height: '200%', 
                background: isReady ? 'radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(239, 68, 68, 0.05) 0%, transparent 70%)',
                zIndex: 0,
                pointerEvents: 'none'
            }} />

            {/* Neural Core (LM Studio) */}
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ 
                    background: lmStatus.online ? 'rgba(168, 85, 247, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                    padding: '10px', 
                    borderRadius: '12px',
                    border: `1px solid ${lmStatus.online ? 'rgba(168, 85, 247, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                }}>
                    <Cpu size={20} color={lmStatus.online ? '#a855f7' : '#ef4444'} />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: '#71717a', letterSpacing: '0.05em' }}>Neural Core</span>
                        <div style={{ 
                            width: '6px', height: '6px', borderRadius: '50%', 
                            background: lmStatus.online ? '#a855f7' : '#ef4444',
                            boxShadow: lmStatus.online ? '0 0 8px #a855f7' : '0 0 8px #ef4444'
                        }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                        {lmStatus.loading ? (
                            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#fff' }}>Initializing...</div>
                        ) : lmStatus.online ? (
                            <select 
                                value={lmStatus.activeModel || ''} 
                                onChange={handleModelChange}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#fff',
                                    fontSize: '0.9rem',
                                    fontWeight: '600',
                                    padding: '0',
                                    cursor: 'pointer',
                                    outline: 'none',
                                    maxWidth: '180px',
                                    textOverflow: 'ellipsis'
                                }}
                            >
                                {lmStatus.models?.map(m => (
                                    <option key={m.id} value={m.id} style={{ background: '#121217', color: '#fff' }}>
                                        {m.id.split('/').pop().replace('.gguf', '')}
                                    </option>
                                ))}
                                {!lmStatus.models?.length && <option>No models loaded</option>}
                            </select>
                        ) : (
                            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#ef4444' }}>Disconnected</div>
                        )}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#71717a', marginTop: '2px' }}>
                        {lmStatus.online ? `${lmStatus.models?.length || 0} Models Found` : 'Start LM Studio (Port 1234)'}
                    </div>
                </div>
            </div>

            {/* Visual Engine (ComfyUI) */}
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ 
                    background: comfyStatus.online ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                    padding: '10px', 
                    borderRadius: '12px',
                    border: `1px solid ${comfyStatus.online ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                }}>
                    <Zap size={20} color={comfyStatus.online ? '#10b981' : '#ef4444'} />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: '#71717a', letterSpacing: '0.05em' }}>Visual Engine</span>
                        <div style={{ 
                            width: '6px', height: '6px', borderRadius: '50%', 
                            background: comfyStatus.online ? '#10b981' : '#ef4444',
                            boxShadow: comfyStatus.online ? '0 0 8px #10b981' : '0 0 8px #ef4444'
                        }} />
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600', color: comfyStatus.online ? '#fff' : '#ef4444', marginTop: '2px' }}>
                        {comfyStatus.loading ? 'Initializing...' : (comfyStatus.online ? 'ComfyUI Ready' : 'Disconnected')}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#71717a', marginTop: '2px' }}>
                        {comfyStatus.online ? 'SDXL Pipeline Active' : 'Start ComfyUI (Port 8000)'}
                    </div>
                </div>
            </div>

            {/* Lab Vitals (VRAM) */}
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ 
                    background: 'rgba(255, 255, 255, 0.03)', 
                    padding: '10px', 
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                    <Activity size={20} color="#a1a1aa" />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: '#71717a', letterSpacing: '0.05em' }}>Lab Vitals</span>
                        {isRefreshing && <RefreshCw size={10} color="#a855f7" className="spin" />}
                    </div>
                    {vramStats ? (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '2px' }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#fff' }}>{vramStats.vramPct}% VRAM</div>
                                <div style={{ fontSize: '0.7rem', color: '#71717a' }}>{vramStats.vramUsed}/{vramStats.vramTotal} GB</div>
                            </div>
                            <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${vramStats.vramPct}%` }}
                                    style={{ height: '100%', background: 'linear-gradient(90deg, #a855f7, #ec4899)', borderRadius: '2px' }} 
                                />
                            </div>
                        </>
                    ) : (
                        <div style={{ fontSize: '0.8rem', color: '#71717a', marginTop: '8px', fontStyle: 'italic' }}>
                            Waiting for telemetry...
                        </div>
                    )}
                </div>
            </div>

            {/* Status Footer */}
            <div style={{ 
                gridColumn: '1 / -1', 
                borderTop: '1px solid rgba(255,255,255,0.05)', 
                paddingTop: '0.75rem', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                zIndex: 1
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isReady ? (
                        <>
                            <ShieldCheck size={14} color="#10b981" />
                            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '600' }}>Lab Synchronized: Ready for Roleplay</span>
                        </>
                    ) : (
                        <>
                            <AlertCircle size={14} color="#ef4444" />
                            <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: '600' }}>Signal Lost: Offline Services Detected</span>
                        </>
                    )}
                </div>
                <button 
                    onClick={refreshStats}
                    style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        cursor: 'pointer', 
                        color: '#71717a',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.7rem'
                    }}
                >
                    <Terminal size={12} />
                    Run Diagnostics
                </button>
            </div>
        </motion.div>
    );
};

export default memo(LiveLabWidget);
