import React from 'react';
import { X, Camera, Sparkles, User, Play, Star } from 'lucide-react';

const ActionLibraryModal = ({ isOpen, onClose, persona, onExecuteAction }) => {
    if (!isOpen) return null;

    // Sample Actions provided to the user
    const sampleActions = [
        { 
            id: 'casual_sitting', 
            label: 'Casual Sitting', 
            icon: <User size={20} />, 
            prompt: 'sitting relaxed on a chair, legs crossed, hands on knees, casual look, soft indoor lighting',
            description: 'A natural, everyday pose for casual conversation.'
        },
        { 
            id: 'wink_flirty', 
            label: 'Playful Wink', 
            icon: <Sparkles size={20} />, 
            prompt: 'winking at the camera, playful smirk, flirty expression, close-up shot, vibrant lighting',
            description: 'A fun, charismatic reaction to a tease.'
        },
        { 
            id: 'sultry_stare', 
            label: 'Sultry Gaze', 
            icon: <Star size={20} />, 
            prompt: 'intense deep gaze at the camera, seductive expression, parted lips, dramatic lighting, moody atmosphere',
            description: 'A more intimate, high-tension visual moment.'
        },
        { 
            id: 'dynamic_action', 
            label: 'Dynamic Motion', 
            icon: <Play size={20} />, 
            prompt: 'mid-action pose, motion blur, looking over shoulder, dynamic angle, energetic atmosphere',
            description: 'Capturing a moment of movement or transition.'
        }
    ];

    const handleActionClick = (action) => {
        // Use the same default/saved model as Magic Selfie to avoid ComfyUI errors
        const defaultModel = localStorage.getItem('lastSelectedPonyModel') || "realismByStableYogi_ponyV3VAE.safetensors";
        
        // Passing isSilent: true to only create the image bubble without chat text
        // Using 'none' for clothing/color to let the prompt handle it
        onExecuteAction(action, defaultModel, 'none', 'none', { isSilent: true });
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <h2 className="premium-gradient-text" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Camera size={20} /> Action & Pose Studio
                    </h2>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="modal-body">
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
                        Trigger a specific visual moment. ${persona.name} will act out the pose and generate a matching image.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {sampleActions.map(action => (
                            <button
                                key={action.id}
                                onClick={() => handleActionClick(action)}
                                className="action-item-btn"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    padding: '16px',
                                    borderRadius: '16px',
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    width: '100%'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(168, 85, 247, 0.1)';
                                    e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.3)';
                                    e.currentTarget.style.transform = 'translateX(4px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                                    e.currentTarget.style.transform = 'translateX(0)';
                                }}
                            >
                                <div style={{ 
                                    width: '40px', 
                                    height: '40px', 
                                    borderRadius: '12px', 
                                    background: 'rgba(168, 85, 247, 0.2)', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    color: 'var(--primary-color)'
                                }}>
                                    {action.icon}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: '#fff', fontWeight: '600', fontSize: '1rem' }}>{action.label}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2px' }}>{action.description}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="modal-footer">
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Actions use your active Pony Diffusion configuration.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ActionLibraryModal;
