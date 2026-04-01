import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Wand2, Sparkles, Droplets, Flame, Skull, Utensils, Shirt, Palette } from 'lucide-react';
import { AVAILABLE_PONY_MODELS } from '../../config';
import { CLOTHING_TYPES, COLORS } from '../../data/imageGenOptions';

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
        { label: "69 Position", text: "(69 position:1.5), mutual oral sex, faces buried in genitals, intricate posing, extreme detail, on luxurious satin sheets" },
        { label: "Lying on Back", text: "lying on back, legs spread wide, (legs up:1.3), revealing self, looking at viewer, intimate, on silk sheets" },
        { label: "Sitting on Bed", text: "sitting on edge of bed, (leaning back on elbows:1.2), knees apart, looking seductive, master bedroom" },
        { label: "Bending Over", text: "bending over, (rear view:1.3), looking back at viewer over shoulder, arching back, hands on knees, revealing" },
        { label: "Mirror Selfie", text: "(mirror selfie:1.4), holding phone, reflection, standing in luxury bathroom, looking at phone screen" },
        { label: "Leaning Wall", text: "standing, (leaning against wall:1.2), one leg lifted, hands behind head, looking at viewer, dramatic lighting" }
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
    "Oral": [
        { label: "Blowjob", text: "close up on face, (blowjob:1.5), sucking cock, (deepthroat:1.3), mouth full, eyes looking up at viewer, (eye contact:1.2), holding cock with hands, saliva dripping, in a luxury hotel suite <lora:phbjcrsc.safetensors:0.8>" },
        { label: "Deepthroat", text: "side view, (deepthroat:1.5), cock deep in throat, (gagging:0.8), tears in eyes, blurry background, extreme detail of mouth and cock <lora:phbjcrsc.safetensors:0.8>" },
        { label: "Cunnilingus", text: "POV between legs, (cunnilingus:1.5), tongue on pussy, licking clitoris, spread legs, wet glistening labia, (oral sex:1.2), looking up at viewer, messy bed" },
        { label: "Handjob", text: "close up on hands and crotch, (handjob:1.4), gripping cock, (stroking:1.2), pre-cum, extreme detail of genitals, veins on cock, silk sheets" },
        { label: "Facefuck", text: "(facefuck:1.5), standing over her, pushing cock into mouth, (dominant:1.2), messy hair, extreme expression, grabbing hair, dark modern bedroom" }
    ],
    "Hardcore": [
        { label: "Nude Penetration", text: "close up on lower body, ((thick erect cock deeply penetrating pussy:1.5)), (insertion:1.3), ((pussy lips stretching around cock:1.4)), wet glistening skin, lubrication, extreme detail of labia and genitals, highly detailed skin texture, silk bedsheets <lora:ossplnskFT15rs4.safetensors:0.8>" },
        { label: "Double Penetration", text: "3 naked people, (double penetration:1.5), one cock in pussy, one cock in ass, simultaneous insertion, extreme detail, group sex, in a luxury penthouse suite, city lights <lora:mmdmltFT15.safetensors:0.8>" },
        { label: "Gangbang", text: "5 naked men, one woman, surrounded by men, multiple penises, gangbang, buckeye, messy, facial, breast-splattered, internal creampie, group sex, extreme detail, masterpiece, dark basement studio <lora:gngsrrmphFT15.safetensors:0.8>" },
        { label: "Titjob", text: "close up on breasts, (paizuri:1.5), cock between breasts, rubbing, highly detailed skin texture, sweat, flushed face" },
        { label: "Thigh Sex", text: "(intercrural sex:1.4), cock between thighs, squeezing legs, sweat, deep penetration illusion, highly detailed skin texture" },
        { label: "Footjob", text: "(footjob:1.4), toes curled, focus on feet, looking up, seductive gaze, bedroom lighting" },
        { label: "Masturbation", text: "close up on lower body, (fingering pussy:1.4), female masturbation, two fingers inserted, glistening wet labia, intense expression, arched back" },
        { label: "Boobs Squeezing", text: "close up on torso, ((hands firmly squeezing and squishing breasts:1.4)), ((fingers sinking deep into breast skin:1.3)), deep cleavage, (breast deformation:1.2), red skin marks from pressure, highly detailed skin texture, sweat, luxury penthouse bedroom <lora:phbjcrsc.safetensors:0.8>" },
        { label: "Groping", text: "two hands aggressively grabbing large breasts from behind, (breast grab:1.4), skin indentation, surprised expression, (from behind:1.2)" },
        { label: "Doggy (Hairpull)", text: "rear view, (doggy style:1.4), (hair pulling:1.3), arching back, looking back with ecstatic face, (vaginal penetration:1.4), reaching back to touch him, sweat, workout room <lora:ossplnskFT15rs4.safetensors:0.8>" }
    ]
};

const SelfiePromptModal = ({ isOpen, onClose, onConfirm }) => {
    const [prompt, setPrompt] = useState("");
    const [aspectRatio, setAspectRatio] = useState('portrait');
    const [activeCategory, setActiveCategory] = useState("Positions");
    const [selectedModel, setSelectedModel] = useState(localStorage.getItem('lastSelectedPonyModel') || "realismByStableYogi_ponyV3VAE.safetensors");
    const [selectedClothing, setSelectedClothing] = useState('none');
    const [selectedColor, setSelectedColor] = useState('none');

    const AVAILABLE_MODELS = AVAILABLE_PONY_MODELS;

    const handleSubmit = () => {
        onConfirm(prompt, aspectRatio, selectedModel, selectedClothing, selectedColor);
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

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1.5rem' }}>
                                <div>
                                    <div style={{ color: '#fbbf24', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <Shirt size={14} /> Style
                                    </div>
                                    <select 
                                        value={selectedClothing}
                                        onChange={(e) => setSelectedClothing(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            borderRadius: '8px',
                                            background: 'rgba(0,0,0,0.4)',
                                            border: '1px solid #3f3f46',
                                            color: 'white',
                                            fontSize: '0.9rem',
                                            outline: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {CLOTHING_TYPES.map(type => (
                                            <option key={type.id} value={type.id} style={{ background: '#1e1e2e' }}>{type.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <div style={{ color: '#60a5fa', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <Palette size={14} /> Color
                                    </div>
                                    <select 
                                        value={selectedColor}
                                        onChange={(e) => setSelectedColor(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            borderRadius: '8px',
                                            background: 'rgba(0,0,0,0.4)',
                                            border: '1px solid #3f3f46',
                                            color: 'white',
                                            fontSize: '0.9rem',
                                            outline: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {COLORS.map(color => (
                                            <option key={color.id} value={color.id} style={{ background: '#1e1e2e' }}>{color.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ color: '#a855f7', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 'bold' }}>Core Engine</div>
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
                                        cursor: 'pointer'
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
                                            {cat === 'Oral' && <Utensils size={14} />}
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
