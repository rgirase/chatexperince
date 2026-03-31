import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Wand2, Sparkles, Droplets, Flame, Skull } from 'lucide-react';

const ACTION_CATEGORIES = {
    "Outfits": [
        { label: "Sheer Lace Dress", text: "wearing a highly transparent sheer black Italian designer lace dress WITHOUT LINGERIE, highly seductive" },
        { label: "Transparent Saree", text: "wearing a highly seductive, transparent party wear saree without blouse" },
        { label: "Library Nude", text: "standing gracefully by a large window in a grand mahogany-paneled library, nude portrait" },
        { label: "Reclining Sexy", text: "reclining on a velvet chaise lounge in master suite, extremely attractive and seductive" },
        { label: "Bralette Off", text: "front view, (removing clothes:1.4), taking off bralette, pulling up top, (topless:1.2), revealed breasts, seductive smile, on a grand estate balcony, moonlight <lora:bralette-off.safetensors:0.8>" }
    ],
    "Positions": [
        { label: "Missionary", text: "POV, missionary position, (vaginal penetration:1.4), legs wrapped around waist, eye contact, intense expression, sweat on skin, intimate, on a massive silk bed, master suite <lora:mssncopFT15.safetensors:0.8>" },
        { label: "Anal Doggy", text: "rear view, (anal penetration:1.4), cock in ass, doggy style, stretching anus, extreme detail of sphincter and genitals, sweating, in a high-end mansion home gym, workout equipment background <lora:ossplnskFT15rs4.safetensors:0.8>" },
        { label: "Cowgirl", text: "facing viewer, sitting on cock, (vaginal penetration:1.4), cock in pussy, cowgirl position, bouncing, extreme detail of labia and genitals, in a luxury bedroom, velvet headboard <lora:ossplnskFT15rs4.safetensors:0.8>" },
        { label: "Anal Cowgirl", text: "facing viewer, sitting on cock, (anal penetration:1.4), cock in ass, cowgirl position, bouncing, extreme detail of labia and anus, in a luxury bedroom, velvet headboard <lora:ossplnskFT15rs4.safetensors:0.8>" },
        { label: "Anal Side Lying", text: "side view, spooning, (anal penetration:1.4), cock in ass, side-lying position, legs pulled back, extreme detail, in a private morning studio, soft lighting <lora:ossplnskFT15rs4.safetensors:0.8>" },
        { label: "Reverse Cowgirl", text: "rear view, sitting on cock, reverse cowgirl, (vaginal penetration:1.4), looking back at viewer over shoulder, arching back, seductive gaze, on a penthouse rooftop balcony, sunset skyline <lora:rvcgcoopcclnFT15.safetensors:0.8>" },
        { label: "Face Sitting", text: "(facesitting:1.4), sitting on face, smothering, extreme expression, looking down, shiny skin, dominant" },
        { label: "69 Position", text: "(69 position:1.5), mutual oral sex, faces buried in genitals, intricate posing, extreme detail, on luxurious satin sheets" }
    ],
    "Fluids": [
        { label: "Cumshot", text: "close up on face and massive breasts, ((thick viscous white cum splattered all over face and boobs:1.5)), (cum dripping from lips:1.3), messy face, glazed eyes, highly detailed skin texture, pearl necklace, masterpiece, bathroom mirror background <lora:orlpvmltlnccFT15.safetensors:0.8>" },
        { label: "Creampie (Internal)", text: "close up on crotch, (creampie:1.5), thick white cum leaking from pussy, gaping, extreme detail of labia, legs spread wide, messy, intimate" },
        { label: "Facial Cumshot", text: "close up on face, (facial cumshot:1.5), thick cum splattered across cheeks and nose, closed eyes, tongue out, messy, highly detailed masterpiece" },
        { label: "Squirt", text: "(female ejaculation:1.5), squirting, heavy wetness, pool of liquid, glistening skin, intense orgasm face, messy bed" },
        { label: "Cum Drenched", text: "(covered in cum:1.5), dripping semen, glazed eyes, ahegao face, panting, completely exhausted, shiny wet body" }
    ],
    "Kink & BD": [
        { label: "Shibari", text: "(full body shibari:1.5), intricate rope bondage, suspension, helpless, blushing, distressed expression, dark studio" },
        { label: "Spanking", text: "rear view, (spanking:1.4), bright red handprint on bare ass, (bent over:1.2), crying in pleasure, tears, bdsm, detailed skin marks" },
        { label: "Pet Play (Leash)", text: "wearing collar, (leash play:1.3), on hands and knees, crawling, (gagged:1.2), submissive, carpeted floor" },
        { label: "Magic Wand", text: "using hitachi magic wand, vibrator on pussy, (intense orgasm:1.4), arching back, gripping sheets, flushed face" },
        { label: "Latex & Nylons", text: "shiny black latex bodysuit, (ripped pantyhose:1.4), thighhighs, stiletto heels, posing seductively, neon rim lighting" },
        { label: "Breast Bondage", text: "close up on torso, (breast bondage:1.5), ropes around breasts, (clover clamps:0.7), skin indentation, red rope marks, (topped:1.2), in a dark BDSM studio, leather gear in background <lora:breast_bondage_v2.safetensors:0.8>" }
    ],
    "Hardcore": [
        { label: "Nude Penetration", text: "close up on lower body, ((thick erect cock deeply penetrating pussy:1.5)), (insertion:1.3), ((pussy lips stretching around cock:1.4)), wet glistening skin, lubrication, extreme detail of labia and genitals, highly detailed skin texture, silk bedsheets <lora:ossplnskFT15rs4.safetensors:0.8>" },
        { label: "Double Penetration", text: "3 naked people, (double penetration:1.5), one cock in pussy, one cock in ass, simultaneous insertion, extreme detail, group sex, in a luxury penthouse suite, city lights <lora:mmdmltFT15.safetensors:0.8>" },
        { label: "Gangbang", text: "5 naked men, one woman, surrounded by men, multiple penises, gangbang, buckeye, messy, facial, breast-splattered, internal creampie, group sex, extreme detail, masterpiece, dark basement studio <lora:gngsrrmphFT15.safetensors:0.8>" },
        { label: "Oral Sex", text: "close up on face, (deepthroat:1.4), sucking cock, mouth full, saliva, looking up at camera, (gagging:0.8), messy hair, in a private mahogany office, executive office desk <lora:orlpvmltlnccFT15.safetensors:0.8>" },
        { label: "Titjob", text: "close up on breasts, (paizuri:1.5), cock between breasts, rubbing, highly detailed skin texture, sweat, flushed face" },
        { label: "Thigh Sex", text: "(intercrural sex:1.4), cock between thighs, squeezing legs, sweat, deep penetration illusion, highly detailed skin texture" },
        { label: "Footjob", text: "(footjob:1.4), toes curled, focus on feet, looking up, seductive gaze, bedroom lighting" },
        { label: "Masturbation", text: "close up on lower body, (fingering pussy:1.4), female masturbation, two fingers inserted, glistening wet labia, intense expression, arched back" },
        { label: "Boobs Squeezing", text: "close up on torso, ((hands firmly squeezing and squishing breasts:1.4)), ((fingers sinking deep into breast skin:1.3)), deep cleavage, (breast deformation:1.2), red skin marks from pressure, highly detailed skin texture, sweat, luxury penthouse bedroom <lora:phbjcrsc.safetensors:0.8>" },
        { label: "Groping", text: "two hands aggressively grabbing large breasts from behind, (breast grab:1.4), skin indentation, surprised expression, (from behind:1.2)" }
    ]
};

const SelfiePromptModal = ({ isOpen, onClose, onConfirm }) => {
    const [prompt, setPrompt] = useState("");
    const [aspectRatio, setAspectRatio] = useState('portrait');
    const [activeCategory, setActiveCategory] = useState("Positions");
    const [selectedModel, setSelectedModel] = useState(localStorage.getItem('lastSelectedPonyModel') || "0184PONYLordkamix_v10.safetensors");

    const AVAILABLE_MODELS = [
        { id: "0184PONYLordkamix_v10.safetensors", name: "Pony: LordKamix v10 (Default)" },
        { id: "vendoPonyRealistic_v13Lora.safetensors", name: "Pony: Vendo Realistic v13" },
        { id: "pornmasterProPony_realismV1.safetensors", name: "Pony: Pornmaster Pro Realism" },
        { id: "realismByStableYogi_ponyV3VAE.safetensors", name: "Pony: Stable Yogi Realism V3" },
        { id: "ponyMegaMixXL_v20.safetensors", name: "Pony: Mega Mix XL v2" },
        { id: "aimrimPonyIllusSDXL_v10ILLFP16.safetensors", name: "Pony: Aimrim Illustrious" },
        { id: "getphatPonyMysticEast_v30.safetensors", name: "Pony: Mystic East" },
        { id: "vendoPonyAnimated_v10.safetensors", name: "Pony: Vendo Animated" },
        { id: "v1-5-pruned-emaonly.safetensors", name: "SD 1.5: Base (Not Recommended)" }
    ];

    const handleSubmit = () => {
        onConfirm(prompt, aspectRatio, selectedModel);
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
                        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', paddingBottom: '90px' }}>
                            <p style={{ color: '#ccc', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                Describe exactly what you want to see. The character's current appearance and location will be added automatically.
                            </p>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ color: '#fbbf24', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 'bold' }}>Core Engine</div>
                                <select 
                                    value={selectedModel}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setSelectedModel(val);
                                        localStorage.setItem('lastSelectedPonyModel', val);
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        background: 'rgba(0,0,0,0.4)',
                                        border: '1px solid #3f3f46',
                                        color: 'white',
                                        fontSize: '0.9rem',
                                        outline: 'none',
                                        cursor: 'pointer',
                                        appearance: 'none',
                                        backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23a1a1aa%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`,
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 12px top 50%',
                                        backgroundSize: '12px auto'
                                    }}
                                >
                                    {AVAILABLE_MODELS.map(model => (
                                        <option key={model.id} value={model.id} style={{ background: '#1e1e2e', color: 'white' }}>
                                            {model.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }} className="hide-scrollbar">
                                    {Object.keys(ACTION_CATEGORIES).map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setActiveCategory(cat)}
                                            style={{
                                                padding: '6px 14px',
                                                borderRadius: '20px',
                                                whiteSpace: 'nowrap',
                                                border: activeCategory === cat ? '1px solid #c084fc' : '1px solid transparent',
                                                background: activeCategory === cat ? 'rgba(192, 132, 252, 0.2)' : 'rgba(255,255,255,0.05)',
                                                color: activeCategory === cat ? 'white' : '#a1a1aa',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem',
                                                fontWeight: activeCategory === cat ? 'bold' : 'normal',
                                                transition: 'all 0.2s',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}
                                        >
                                            {cat === 'Outfits' && <Sparkles size={14} />}
                                            {cat === 'Fluids' && <Droplets size={14} />}
                                            {cat === 'Hardcore' && <Flame size={14} />}
                                            {cat === 'Kink & BD' && <Skull size={14} />}
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                                
                                <div style={{ minHeight: '130px', position: 'relative' }}>
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={activeCategory}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.15 }}
                                            style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignContent: 'flex-start' }}
                                        >
                                            {ACTION_CATEGORIES[activeCategory].map((act, i) => (
                                                <button
                                                    key={`${activeCategory}-${i}`}
                                                    onClick={() => setPrompt(prev => prev ? `${prev}, ${act.text}` : act.text)}
                                                    style={{
                                                        background: 'rgba(239, 68, 68, 0.1)',
                                                        border: '1px solid rgba(239, 68, 68, 0.2)',
                                                        color: '#ef4444',
                                                        padding: '6px 12px',
                                                        borderRadius: '8px',
                                                        fontSize: '0.8rem',
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
                                        </motion.div>
                                    </AnimatePresence>
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
