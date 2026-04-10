import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Cpu, Activity, ShieldCheck, AlertCircle, Loader2, ArrowRight, Home } from 'lucide-react';
import { checkServerStatus } from '../../services/llm';

const SignalBridge = ({ onComplete }) => {
    const [step, setStep] = useState('diagnosing'); // diagnosing, failed, ready
    const [stats, setStats] = useState({
        lm: { online: false, name: 'Neural Core', loading: true },
        comfy: { online: false, name: 'Visual Engine', loading: true }
    });

    const runDiagnostics = async () => {
        setStep('diagnosing');
        // Initial delay for dramatic effect
        await new Promise(r => setTimeout(r, 1500));
        
        const lm = await checkServerStatus('lm');
        setStats(prev => ({ ...prev, lm: { ...prev.lm, online: lm.online, loading: false, model: lm.activeModel } }));
        
        await new Promise(r => setTimeout(r, 800));
        const comfy = await checkServerStatus('comfy');
        setStats(prev => ({ ...prev, comfy: { ...prev.comfy, online: comfy.online, loading: false } }));

        if (lm.online && comfy.online) {
            setStep('ready');
        } else {
            setStep('failed');
        }
    };

    useEffect(() => {
        runDiagnostics();
    }, []);

    const Node = ({ type, data, position }) => {
        const Icon = type === 'lm' ? Cpu : Zap;
        const color = data.online ? (type === 'lm' ? '#a855f7' : '#10b981') : '#ef4444';
        
        return (
            <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                    position: 'absolute',
                    left: `${position.x}%`,
                    top: `${position.y}%`,
                    transform: 'translate(-50%, -50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    zIndex: 2
                }}
            >
                <div style={{ position: 'relative' }}>
                    <motion.div 
                        animate={data.online ? { 
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.6, 0.3]
                        } : {}}
                        transition={{ repeat: Infinity, duration: 2 }}
                        style={{ 
                            position: 'absolute', 
                            inset: -15, 
                            borderRadius: '50%', 
                            background: color,
                            filter: 'blur(20px)',
                            zIndex: -1
                        }} 
                    />
                    <div style={{ 
                        width: '64px', 
                        height: '64px', 
                        borderRadius: '20px', 
                        background: 'rgba(9, 9, 11, 0.8)', 
                        border: `2px solid ${data.loading ? '#3f3f46' : color}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: data.online ? `0 0 20px ${color}40` : 'none',
                    }}>
                        {data.loading ? <Loader2 size={32} color="#71717a" className="spin" /> : <Icon size={32} color={color} />}
                    </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', color: '#71717a', letterSpacing: '0.1em' }}>{data.name}</div>
                    <div style={{ fontSize: '1rem', fontWeight: '600', color: data.online ? '#fff' : '#ef4444' }}>
                        {data.loading ? 'Scanning...' : (data.online ? 'Online' : 'Offline')}
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <div style={{ 
            position: 'fixed', 
            inset: 0, 
            background: '#09090b', 
            zIndex: 10000, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'white',
            overflow: 'hidden'
        }}>
            {/* Background Grid */}
            <div style={{ 
                position: 'absolute', 
                inset: 0, 
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)', 
                backgroundSize: '40px 40px',
                maskImage: 'radial-gradient(circle at center, black, transparent 80%)'
            }} />

            <div style={{ position: 'relative', width: '100%', maxWidth: '800px', height: '400px', marginBottom: '4rem' }}>
                {/* SVG Connections */}
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 }}>
                    <motion.path 
                        d="M 50 50 L 25 75" 
                        stroke={stats.lm.online ? '#a855f7' : '#3f3f46'} 
                        strokeWidth="2" 
                        fill="none" 
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: stats.lm.loading ? 0 : 1 }}
                        transition={{ duration: 1 }}
                        style={{ filter: stats.lm.online ? 'drop-shadow(0 0 5px #a855f7)' : 'none' }}
                    />
                    <motion.path 
                        d="M 50 50 L 75 75" 
                        stroke={stats.comfy.online ? '#10b981' : '#3f3f46'} 
                        strokeWidth="2" 
                        fill="none" 
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: stats.comfy.loading ? 0 : 1 }}
                        transition={{ duration: 1 }}
                        style={{ filter: stats.comfy.online ? 'drop-shadow(0 0 5px #10b981)' : 'none' }}
                    />
                </svg>

                {/* Central Hub */}
                <Node type="hub" data={{ online: step === 'ready', name: 'Local Client', loading: false }} position={{ x: 50, y: 30 }} />
                
                {/* Backends */}
                <Node type="lm" data={stats.lm} position={{ x: 25, y: 75 }} />
                <Node type="comfy" data={stats.comfy} position={{ x: 75, y: 75 }} />
            </div>

            <div style={{ maxWidth: '500px', textAlign: 'center', padding: '0 2rem' }}>
                <AnimatePresence mode="wait">
                    {step === 'diagnosing' && (
                        <motion.div key="diag" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <h1 className="premium-gradient-text" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Synchronizing Neural Core</h1>
                            <p style={{ color: '#a1a1aa', lineHeight: 1.6 }}>Establishing encrypted tunnels to local AI services. Please ensure LM Studio and ComfyUI are running.</p>
                        </motion.div>
                    )}
                    {step === 'ready' && (
                        <motion.div key="ready" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '50%', border: '1px solid #10b981' }}>
                                    <ShieldCheck size={32} color="#10b981" />
                                </div>
                            </div>
                            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>All Systems Nominal</h1>
                            <p style={{ color: '#a1a1aa', marginBottom: '2rem' }}>Connection established. Your neural engines are prime and ready for infinite storytelling.</p>
                             <button 
                                 onClick={() => {
                                     console.log("[SignalBridge] Enter Aura clicked");
                                     onComplete();
                                 }}
                                 className="premium-btn"
                                 style={{ 
                                     padding: '1rem 2.5rem', 
                                     fontSize: '1.1rem', 
                                     fontWeight: 'bold', 
                                     display: 'flex', 
                                     alignItems: 'center', 
                                     gap: '12px', 
                                     margin: '2rem auto 0',
                                     cursor: 'pointer',
                                     pointerEvents: 'auto',
                                     position: 'relative',
                                     zIndex: 100
                                 }}
                             >
                                 Enter Aura <ArrowRight size={20} />
                             </button>
                        </motion.div>
                    )}
                    {step === 'failed' && (
                        <motion.div key="failed" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#ef4444' }}>Signal Interrupted</h1>
                            <p style={{ color: '#a1a1aa', marginBottom: '2rem' }}>One or more services could not be reached. You can proceed, but AI features may be limited.</p>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                <button 
                                    onClick={runDiagnostics}
                                    className="back-btn"
                                    style={{ padding: '0.75rem 1.5rem' }}
                                >
                                    Retry Diagnostics
                                </button>
                                <button 
                                    onClick={() => {
                                        console.log("[SignalBridge] Proceed Anyway clicked");
                                        onComplete();
                                    }}
                                    style={{ 
                                        background: 'transparent', 
                                        border: '1px solid #3f3f46', 
                                        color: '#a1a1aa', 
                                        padding: '0.75rem 1.5rem', 
                                        borderRadius: '12px', 
                                        cursor: 'pointer',
                                        pointerEvents: 'auto'
                                    }}
                                >
                                    Proceed Anyway
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            <div style={{ position: 'absolute', bottom: '2rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#3f3f46', fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '0.2em' }}>
                <Activity size={12} />
                REAL-TIME TELEMETRY ACTIVE
            </div>
        </div>
    );
};

export default SignalBridge;
