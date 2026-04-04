import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Copy, Terminal, ChevronDown, ChevronUp } from 'lucide-react';
import logger from '../../services/logger';

const LogViewerModal = ({ isOpen, onClose }) => {
    const [logs, setLogs] = useState(logger.getLogs());
    const [filter, setFilter] = useState('all');
    const scrollRef = useRef(null);

    useEffect(() => {
        const handleLogAdded = (e) => {
            setLogs([...e.detail]);
        };

        window.addEventListener('app_log_added', handleLogAdded);
        return () => window.removeEventListener('app_log_added', handleLogAdded);
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    const copyToClipboard = () => {
        const text = logs.map(l => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.message}`).join('\n');
        navigator.clipboard.writeText(text);
        alert("Logs copied to clipboard!");
    };

    const filteredLogs = logs.filter(l => filter === 'all' || l.type === filter);

    if (!isOpen) return null;

    return (
        <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ zIndex: 30000 }} // Higher than other modals
        >
            <motion.div 
                className="modal-container"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                style={{ 
                    width: '95%', 
                    maxWidth: '800px', 
                    height: '85vh', 
                    display: 'flex', 
                    flexDirection: 'column',
                    padding: 0,
                    overflow: 'hidden'
                }}
            >
                {/* Header */}
                <div style={{ 
                    padding: '1rem', 
                    borderBottom: '1px solid rgba(255,255,255,0.05)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    background: 'rgba(255,255,255,0.02)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Terminal size={20} className="premium-gradient-text" />
                        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>System Logs</h3>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                            onClick={copyToClipboard}
                            className="header-action-btn"
                            title="Copy All"
                            style={{ background: 'rgba(57, 162, 219, 0.1)', color: '#39a2db' }}
                        >
                            <Copy size={18} />
                        </button>
                        <button 
                            onClick={() => logger.clear()}
                            className="header-action-btn"
                            title="Clear Logs"
                            style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e' }}
                        >
                            <Trash2 size={18} />
                        </button>
                        <button onClick={onClose} className="header-action-btn">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div style={{ 
                    padding: '0.5rem 1rem', 
                    display: 'flex', 
                    gap: '10px', 
                    overflowX: 'auto', 
                    background: 'rgba(0,0,0,0.2)',
                    fontSize: '0.8rem'
                }}>
                    {['all', 'log', 'warn', 'error'].map(t => (
                        <button 
                            key={t}
                            onClick={() => setFilter(t)}
                            style={{
                                padding: '4px 12px',
                                borderRadius: '15px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: filter === t ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                                color: filter === t ? '#c084fc' : '#a1a1aa',
                                cursor: 'pointer',
                                textTransform: 'capitalize'
                            }}
                        >
                            {t}
                        </button>
                    ))}
                    <div style={{ marginLeft: 'auto', color: '#71717a' }}>
                        {filteredLogs.length} items
                    </div>
                </div>

                {/* Log List */}
                <div 
                    ref={scrollRef}
                    style={{ 
                        flex: 1, 
                        overflowY: 'auto', 
                        padding: '1rem', 
                        fontFamily: 'monospace', 
                        fontSize: '0.75rem', 
                        lineHeight: '1.4'
                    }}
                >
                    {filteredLogs.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#71717a' }}>No logs captured yet.</div>
                    ) : (
                        filteredLogs.map(log => (
                            <div 
                                key={log.id} 
                                style={{ 
                                    marginBottom: '8px', 
                                    paddingBottom: '4px', 
                                    borderBottom: '1px solid rgba(255,255,255,0.02)',
                                    display: 'flex',
                                    gap: '10px'
                                }}
                            >
                                <span style={{ color: '#71717a', flexShrink: 0 }}>{log.timestamp}</span>
                                <span style={{ 
                                    flexShrink: 0, 
                                    width: '45px', 
                                    color: log.type === 'error' ? '#f43f5e' : (log.type === 'warn' ? '#fbbf24' : '#39a2db'),
                                    fontWeight: 'bold'
                                }}>
                                    [{log.type.toUpperCase()}]
                                </span>
                                <span style={{ 
                                    wordBreak: 'break-all', 
                                    whiteSpace: 'pre-wrap', 
                                    color: log.type === 'error' ? '#fecaca' : '#f4f4f5' 
                                }}>
                                    {log.message}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default LogViewerModal;
