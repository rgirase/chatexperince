import React from 'react';
import { X, Sliders, Type, Zap, Target, Sparkles, Flame } from 'lucide-react';

const DirectorSettingsModal = ({ isOpen, onClose, settings, onUpdate, onPlotTwist }) => {
    if (!isOpen) return null;

    const styles = [
        { id: 'Novel', label: 'Novel Prose', desc: 'Descriptive, immersive, multi-paragraph storytelling.' },
        { id: 'Casual', label: 'Casual Texting', desc: 'Fast-paced, modern, and direct dialogue.' },
        { id: 'Bratty', label: 'Bratty / Teasing', desc: 'High-attitude, defiant, and playful tone.' },
    ];

    const focuses = ['Mixed', 'Dialogue', 'Action'];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                <div className="modal-header">
                    <h2 className="premium-gradient-text" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Sliders size={20} /> Narrative Director
                    </h2>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="modal-body" style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '24px',
                    maxHeight: '60vh',
                    overflowY: 'auto',
                    paddingRight: '8px',
                    paddingBottom: '8px'
                }}>
                    
                    {/* Writing Style */}
                    <section>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--primary-color)' }}>
                            <Type size={16} /> WRITING STYLE
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {styles.map(style => (
                                <button
                                    key={style.id}
                                    onClick={() => onUpdate({ ...settings, style: style.id })}
                                    style={{
                                        textAlign: 'left',
                                        padding: '12px',
                                        borderRadius: '12px',
                                        background: settings.style === style.id ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                                        border: `1px solid ${settings.style === style.id ? 'var(--primary-color)' : 'rgba(255, 255, 255, 0.1)'}`,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div style={{ fontWeight: '600', fontSize: '0.95rem', color: '#fff', marginBottom: '2px' }}>{style.label}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{style.desc}</div>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Tension Slider */}
                    <section>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--primary-color)' }}>
                                <Zap size={16} /> ATMOSPHERIC TENSION
                            </label>
                            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>{settings.tension}/5</span>
                        </div>
                        <input 
                            type="range" 
                            min="1" 
                            max="5" 
                            value={settings.tension} 
                            onChange={(e) => onUpdate({ ...settings, tension: parseInt(e.target.value) })}
                            className="intensity-slider"
                            style={{ width: '100%' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                            <span>Comfortable</span>
                            <span>Forbidden</span>
                        </div>
                    </section>

                    {/* Narrative Focus */}
                    <section>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--primary-color)' }}>
                            <Target size={16} /> NARRATIVE FOCUS
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {focuses.map(f => (
                                <button
                                    key={f}
                                    onClick={() => onUpdate({ ...settings, focus: f })}
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        borderRadius: '20px',
                                        background: settings.focus === f ? 'var(--primary-color)' : 'rgba(255, 255, 255, 0.05)',
                                        border: 'none',
                                        color: '#fff',
                                        fontSize: '0.85rem',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Plot Twist Engine - Phase 6 */}
                    <section style={{ marginTop: '8px', padding: '16px', background: 'rgba(168, 85, 247, 0.05)', borderRadius: '16px', border: '1px solid rgba(168, 85, 247, 0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '0.9rem', color: '#a855f7' }}>
                                <Sparkles size={16} /> STORY DRAMA
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#a1a1aa', cursor: 'pointer' }}>
                                <input 
                                    type="checkbox" 
                                    checked={settings.chaosMode} 
                                    onChange={(e) => onUpdate({ ...settings, chaosMode: e.target.checked })}
                                    style={{ accentColor: '#a855f7' }}
                                />
                                Chaos Mode
                            </label>
                        </div>
                        <button 
                            onClick={() => { onPlotTwist(); onClose(); }}
                            style={{ 
                                width: '100%', 
                                padding: '12px', 
                                borderRadius: '12px', 
                                background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                                color: '#fff',
                                border: 'none',
                                fontWeight: 'bold',
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                boxShadow: '0 4px 15px rgba(124, 58, 237, 0.3)'
                            }}
                        >
                            <Flame size={18} /> TRIGGER PLOT TWIST
                        </button>
                        <p style={{ margin: '8px 0 0 0', fontSize: '0.7rem', color: '#71717a', textAlign: 'center' }}>
                            Injects an unexpected, dynamic event into the scene.
                        </p>
                    </section>
                </div>

                <div className="modal-footer">
                    <button className="send-btn" style={{ width: '100%', borderRadius: '12px', height: '44px' }} onClick={onClose}>
                        APPLY NARRATIVE DIRECTIVES
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DirectorSettingsModal;
