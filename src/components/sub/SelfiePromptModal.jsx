import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Wand2 } from 'lucide-react';

const SelfiePromptModal = ({ isOpen, onClose, onConfirm }) => {
    const [prompt, setPrompt] = useState("");
    const [aspectRatio, setAspectRatio] = useState('portrait');

    const handleSubmit = () => {
        onConfirm(prompt, aspectRatio);
        setPrompt("");
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="modal-overlay" onClick={onClose}>
                    <motion.div 
                        className="modal-content glass-panel" 
                        onClick={(e) => e.stopPropagation()}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        style={{ maxWidth: '500px' }}
                    >
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Camera className="premium-gradient-text" size={24} />
                                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Magic Selfie</h2>
                            </div>
                            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p style={{ color: '#ccc', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                Describe exactly what you want to see. The character's current appearance and location will be added automatically.
                            </p>
                            
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ color: '#fbbf24', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 'bold' }}>Fun Outfits & Poses</div>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                                    {[
                                        { label: "Sheer Lace Dress", text: "wearing a highly transparent sheer black Italian designer lace dress WITHOUT LINGERIE, highly seductive" },
                                        { label: "Transparent Saree", text: "wearing a highly seductive, transparent party wear saree without blouse" },
                                        { label: "Library Nude", text: "standing gracefully by a large window in a grand mahogany-paneled library, nude portrait" },
                                        { label: "Reclining Sexy", text: "reclining on a velvet chaise lounge in master suite, extremely attractive and seductive" }
                                    ].map((act, i) => (
                                        <button
                                            key={`fun-${i}`}
                                            onClick={() => setPrompt(prev => prev ? `${prev}, ${act.text}` : act.text)}
                                            style={{
                                                background: 'rgba(56, 189, 248, 0.1)',
                                                border: '1px solid rgba(56, 189, 248, 0.2)',
                                                color: '#38bdf8',
                                                padding: '4px 10px',
                                                borderRadius: '8px',
                                                fontSize: '0.75rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                fontWeight: '600'
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)'; }}
                                        >
                                            {act.label}
                                        </button>
                                    ))}
                                </div>
                                
                                <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 'bold' }}>Explicit Actions</div>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {[
                                        { label: "Nude Penetration", text: "close up on lower body, ((thick erect cock deeply penetrating pussy:1.5)), (insertion:1.3), ((pussy lips stretching around cock:1.4)), wet glistening skin, lubrication, extreme detail of labia and genitals, highly detailed skin texture, silk bedsheets <lora:ossplnskFT15rs4.safetensors:0.8>" },
                                        { label: "Gangbang", text: "5 naked men, one woman, surrounded by men, multiple penises, gangbang, buckeye, messy, facial, breast-splattered, internal creampie, group sex, extreme detail, masterpiece, dark basement studio <lora:gngsrrmphFT15.safetensors:0.8>" },
                                        { label: "Cumshot", text: "close up on face and massive breasts, ((thick viscous white cum splattered all over face and boobs:1.5)), (cum dripping from lips:1.3), messy face, glazed eyes, highly detailed skin texture, pearl necklace, masterpiece, bathroom mirror background <lora:orlpvmltlnccFT15.safetensors:0.8>" },
                                        { label: "Cowgirl", text: "facing viewer, sitting on cock, (vaginal penetration:1.4), cock in pussy, cowgirl position, bouncing, extreme detail of labia and genitals, in a luxury bedroom, velvet headboard <lora:ossplnskFT15rs4.safetensors:0.8>" },
                                        { label: "Boobs Squeezing", text: "close up on torso, ((hands firmly squeezing and squishing breasts:1.4)), ((fingers sinking deep into breast skin:1.3)), deep cleavage, (breast deformation:1.2), red skin marks from pressure, highly detailed skin texture, sweat, luxury penthouse bedroom <lora:phbjcrsc.safetensors:0.8>" },
                                        { label: "Missionary", text: "POV, missionary position, (vaginal penetration:1.4), legs wrapped around waist, eye contact, intense expression, sweat on skin, intimate, on a massive silk bed, master suite <lora:mssncopFT15.safetensors:0.8>" },
                                        { label: "Oral Sex", text: "close up on face, (deepthroat:1.4), sucking cock, mouth full, saliva, looking up at camera, (gagging:0.8), messy hair, in a private mahogany office, executive office desk <lora:orlpvmltlnccFT15.safetensors:0.8>" },
                                        { label: "Anal Doggy", text: "rear view, (anal penetration:1.4), cock in ass, doggy style, stretching anus, extreme detail of sphincter and genitals, sweating, in a high-end mansion home gym, workout equipment background <lora:ossplnskFT15rs4.safetensors:0.8>" },
                                        { label: "Anal Cowgirl", text: "facing viewer, sitting on cock, (anal penetration:1.4), cock in ass, cowgirl position, bouncing, extreme detail of labia and anus, in a luxury bedroom, velvet headboard <lora:ossplnskFT15rs4.safetensors:0.8>" },
                                        { label: "Anal Side Lying", text: "side view, spooning, (anal penetration:1.4), cock in ass, side-lying position, legs pulled back, extreme detail, in a private morning studio, soft lighting <lora:ossplnskFT15rs4.safetensors:0.8>" },
                                        { label: "Reverse Cowgirl", text: "rear view, sitting on cock, reverse cowgirl, (vaginal penetration:1.4), looking back at viewer over shoulder, arching back, seductive gaze, on a penthouse rooftop balcony, sunset skyline <lora:rvcgcoopcclnFT15.safetensors:0.8>" },
                                        { label: "Double Penetration", text: "3 naked people, (double penetration:1.5), one cock in pussy, one cock in ass, simultaneous insertion, extreme detail, group sex, in a luxury penthouse suite, city lights <lora:mmdmltFT15.safetensors:0.8>" },
                                        { label: "Breast Bondage", text: "close up on torso, (breast bondage:1.5), ropes around breasts, (clover clamps:0.7), skin indentation, red rope marks, (topped:1.2), in a dark BDSM studio, leather gear in background <lora:breast_bondage_v2.safetensors:0.8>" },
                                        { label: "Bralette Off", text: "front view, (removing clothes:1.4), taking off bralette, pulling up top, (topless:1.2), revealed breasts, seductive smile, on a grand estate balcony, moonlight <lora:bralette-off.safetensors:0.8>" },
                                        { label: "Titjob", text: "close up on breasts, (paizuri:1.5), cock between breasts, rubbing, highly detailed skin texture, sweat, flushed face" },
                                        { label: "Creampie (Internal)", text: "close up on crotch, (creampie:1.5), thick white cum leaking from pussy, gaping, extreme detail of labia, legs spread wide, messy, intimate" },
                                        { label: "Masturbation", text: "close up on lower body, (fingering pussy:1.4), female masturbation, two fingers inserted, glistening wet labia, intense expression, arched back" },
                                        { label: "69 Position", text: "(69 position:1.5), mutual oral sex, faces buried in genitals, intricate posing, extreme detail, on luxurious satin sheets" },
                                        { label: "Facial Cumshot", text: "close up on face, (facial cumshot:1.5), thick cum splattered across cheeks and nose, closed eyes, tongue out, messy, highly detailed masterpiece" },
                                        { label: "Spanking", text: "rear view, (spanking:1.4), bright red handprint on bare ass, (bent over:1.2), crying in pleasure, tears, bdsm, detailed skin marks" },
                                        { label: "Groping", text: "two hands aggressively grabbing large breasts from behind, (breast grab:1.4), skin indentation, surprised expression, (from behind:1.2)" }
                                    ].map((act, i) => (
                                        <button
                                            key={`exp-${i}`}
                                            onClick={() => setPrompt(prev => prev ? `${prev}, ${act.text}` : act.text)}
                                            style={{
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                                color: '#ef4444',
                                                padding: '4px 10px',
                                                borderRadius: '8px',
                                                fontSize: '0.75rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                fontWeight: '600'
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
                                        >
                                            {act.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ color: '#c084fc', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 'bold' }}>Aspect Ratio</div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {[
                                        { id: 'portrait', label: '📱 Portrait', desc: 'Tall' },
                                        { id: 'landscape', label: '🖥️ Landscape', desc: 'Wide' },
                                        { id: 'square', label: '🔲 Square', desc: '1:1' }
                                    ].map(ar => (
                                        <button
                                            key={ar.id}
                                            onClick={() => setAspectRatio(ar.id)}
                                            style={{
                                                flex: 1,
                                                padding: '10px 5px',
                                                borderRadius: '8px',
                                                border: aspectRatio === ar.id ? '2px solid #c084fc' : '1px solid #3f3f46',
                                                background: aspectRatio === ar.id ? 'rgba(192, 132, 252, 0.2)' : 'rgba(255,255,255,0.05)',
                                                color: aspectRatio === ar.id ? 'white' : '#a1a1aa',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}
                                        >
                                            <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{ar.label}</span>
                                            <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{ar.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Example: wearing a tight red dress, sitting on a leather sofa, looking seductive..."
                                style={{
                                    width: '100%',
                                    background: 'rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    color: 'white',
                                    padding: '1rem',
                                    height: '100px',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    resize: 'none',
                                    marginBottom: '1.5rem'
                                }}
                                autoFocus
                            />
                            <button 
                                onClick={handleSubmit}
                                className="premium-gradient-btn"
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    background: 'var(--user-msg-bg)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    cursor: 'pointer'
                                }}
                            >
                                <Wand2 size={20} /> Generate Magic Photo
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default SelfiePromptModal;
