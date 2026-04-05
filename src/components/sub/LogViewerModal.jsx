import React, { useState } from 'react';
import { X, FileText, Copy, Check, Download } from 'lucide-react';

const LogViewerModal = ({ isOpen, onClose, messages = [], personaName = "Character" }) => {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    // Format messages for viewing/export
    const rawLog = messages.map(msg => {
        const role = msg.role === 'user' ? 'USER' : personaName.toUpperCase();
        return `[${role}]: ${msg.content}`;
    }).join('\n\n');

    const handleCopy = () => {
        navigator.clipboard.writeText(rawLog);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const element = document.createElement("a");
        const file = new Blob([rawLog], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = `narrative_log_${personaName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', height: '80vh' }}>
                <div className="modal-header">
                    <h2 className="premium-gradient-text" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FileText size={20} /> Narrative History Log
                    </h2>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="modal-body" style={{ background: 'rgba(0,0,0,0.2)', margin: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <pre style={{ 
                        whiteSpace: 'pre-wrap', 
                        fontFamily: 'monospace', 
                        fontSize: '0.85rem', 
                        color: 'rgba(255,255,255,0.8)',
                        padding: '1rem',
                        margin: 0,
                        lineHeight: '1.6'
                    }}>
                        {rawLog}
                    </pre>
                </div>

                <div className="modal-footer" style={{ gap: '12px' }}>
                    <button 
                        onClick={handleCopy} 
                        className="premium-btn primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
                    >
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                        {copied ? 'Copied!' : 'Copy to Clipboard'}
                    </button>
                    <button 
                        onClick={handleDownload} 
                        className="premium-btn secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'rgba(255,255,255,0.05)' }}
                    >
                        <Download size={18} /> Download .txt
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LogViewerModal;
