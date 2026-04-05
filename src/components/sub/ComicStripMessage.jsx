import React from 'react';
import { motion } from 'framer-motion';
import { Download, Sparkles } from 'lucide-react';

const ComicStripMessage = ({ message, onDownload }) => {
    const panels = message.panels || [];
    
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="comic-strip-container"
            style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                padding: '12px',
                background: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(10px)',
                borderRadius: '24px',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}
        >
            <div className="comic-header" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 8px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={16} className="premium-gradient-text" />
                    <span style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>Story Strip</span>
                </div>
                {message.isComplete && (
                    <button 
                        onClick={() => onDownload(message)}
                        style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}
                    >
                        <Download size={16} />
                    </button>
                )}
            </div>

            <div className="comic-panels-grid" style={{
                display: 'grid',
                gridTemplateColumns: panels.length > 2 ? 'repeat(auto-fit, minmax(200px, 1fr))' : '1fr',
                gap: '12px'
            }}>
                {panels.map((panel, idx) => (
                    <motion.div 
                        key={idx}
                        className="comic-panel"
                        whileHover={{ scale: 1.02 }}
                        style={{
                            position: 'relative',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            border: '4px solid #fff',
                            boxShadow: '0 10px 20px rgba(0,0,0,0.4)',
                            background: '#111',
                            aspectRatio: '1'
                        }}
                    >
                        {panel.url ? (
                            <img 
                                src={panel.url} 
                                alt={`Panel ${idx + 1}`}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <div className="skeleton" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: '0.8rem', color: '#555' }}>Panel {idx + 1}...</span>
                            </div>
                        )}
                        
                        {panel.caption && (
                            <div className="panel-caption" style={{
                                position: 'absolute',
                                bottom: '0',
                                left: '0',
                                right: '0',
                                background: 'white',
                                color: 'black',
                                padding: '8px',
                                fontSize: '0.8rem',
                                fontWeight: '700',
                                textAlign: 'center',
                                borderTop: '2px solid black',
                                textTransform: 'uppercase',
                                lineHeight: '1.2'
                            }}>
                                {panel.caption}
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
            
            {!message.isComplete && (
                <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#a855f7', fontWeight: '600', animation: 'pulse 1.5s infinite' }}>
                    ILLUSTRATING NARRATIVE...
                </div>
            )}
        </motion.div>
    );
};

export default ComicStripMessage;
