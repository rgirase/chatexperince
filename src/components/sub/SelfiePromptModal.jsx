import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Wand2, Sparkles, Droplets, Flame, Skull, Utensils, Shirt, Palette, MapPin, Zap, Sun, Play, Layers, Settings, User, Search, Trash2, CheckCircle2 } from 'lucide-react';
import { AVAILABLE_PONY_MODELS } from '../../config';
import { CLOTHING_TYPES, COLORS, SKIN_TEXTURES, LIGHTING_MODES } from '../../data/imageGenOptions';

const ACTION_CATEGORIES = {
    "Styles": [
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
    ],
    "Scenarios": [
        { label: "Steamy Shower", text: "(standing in a steamy glass shower:1.3), (water droplets on skin:1.2), (wet hair:1.3), (steamy atmosphere:1.4), condensation on glass, looking at viewer, seductive, naked, masterpiece, realistic skin" },
        { label: "Shower Intimacy", text: "(standing in a steamy glass shower:1.3), (shower sex:1.5), (vaginal penetration:1.4), pinned against wet glass wall, water splashing, (steamy atmosphere:1.4), intense expression, wet skin, naked, extreme detail, masterpiece, realistic skin" },
        { label: "CEO Desk", text: "sitting on a massive mahogany executive desk, (legs spread:1.2), paperwork scattered, high-end office background, city skyline through floor-to-ceiling windows, (topped:1.2), dominant expression" },
        { label: "Against Office Window", text: "pinned against a floor-to-ceiling glass window, (rear view:1.3), looking back over shoulder, city lights below, (reflection on glass:1.2), high-rise office background, seductive" },
        { label: "Private Jet Bed", text: "lying on a luxury leather bed inside a private jet, (cabin window view:1.2), clouds outside, soft cabin lighting, (sheer lingerie:1.2), relaxed and inviting" },
        { label: "Yacht Deck", text: "(standing on a luxury yacht deck:1.3), sun-drenched, turquoise ocean background, (bikini:1.2), wind-blown hair, (sea spray on skin:1.2), yacht railing, vacation vibe" },
        { label: "Penthouse Balcony", text: "standing on a penthouse balcony at night, (city skyline:1.4), glowing neon lights, (silk robe:1.2), holding a glass of wine, luxurious atmosphere" },
        { label: "Jacuzzi Spa", text: "submerged in a private jacuzzi, (bubbles and steam:1.3), wet hair, (glistening skin:1.2), low ambient lighting, (night:1.2), intimate atmosphere" },
        { label: "VIP Cinema Box", text: "sitting in a plush velvet theater seat, (dim screen glow:1.3), dark theater background, (skirt lifted:1.2), hand between legs, secretive expression" },
        { label: "Boutique Dressing Room", text: "inside a designer boutique dressing room, (three-way mirror reflections:1.3), high-end clothes on hangers, (trying on lingerie:1.2), holding a dress in front of self, shy but seductive" },
        { label: "Library Stacks", text: "leaning against a bookshelf in a grand library, (hidden corner:1.2), narrow aisle, (pulling up skirt:1.3), looking around nervously, (forbidden:1.2), detailed book spines" },
        { label: "Luxury Elevator", text: "inside a mirror-lined luxury elevator, (brushed steel walls:1.2), (reflection:1.3), pinned against the wall, (skirt ruffled:1.2), high-tension atmosphere" },
        { label: "Limousine Backseat", text: "in the backseat of a luxury limousine, (leather interior:1.2), (city light streaks through window:1.3), (partition closed:1.2), mini-bar background, intimate proximity" },
        { label: "Estate Stables", text: "inside rustic estate stables, (sunbeams through wooden slats:1.3), (hay on floor:1.2), leather saddles, (wearing only a white shirt:1.2), dusty and atmospheric" },
        { label: "Mountain Cabin", text: "lying on a fur rug in front of a fireplace, (warm orange fire glow:1.4), (snow outside window:1.2), rustic log cabin background, cozy and intimate" },
        { label: "Traditional Kitchen", text: "standing in a traditional kitchen, (copper pans background:1.2), (leaning over counter:1.3), (wearing a saree/traditional dress:1.1), warm domestic lighting" },
        { label: "Moonlit Terrace", text: "standing on a moonlit terrace, (stars in sky:1.3), (laundry lines with hanging silk:1.2), night breeze, (nightgown:1.2), looking at the moon" }
    ]
};

const CATEGORY_ICONS = {
    "Styles": <Sparkles size={16} />,
    "Positions": <Layers size={16} />,
    "Fluids": <Droplets size={16} />,
    "Kink & BD": <Skull size={16} />,
    "Oral": <Utensils size={16} />,
    "Hardcore": <Flame size={16} />,
    "Scenarios": <MapPin size={16} />
};

const SelfiePromptModal = ({ isOpen, onClose, onConfirm }) => {
    const [prompt, setPrompt] = useState("");
    const [activeTab, setActiveTab] = useState('Doing'); // 'Doing', 'Looking', 'Setting'
    const [activeCategory, setActiveCategory] = useState("Positions");
    const [searchQuery, setSearchQuery] = useState("");
    const [aspectRatio, setAspectRatio] = useState('portrait');
    const [selectedModel, setSelectedModel] = useState(localStorage.getItem('lastSelectedPonyModel') || "realismByStableYogi_ponyV3VAE.safetensors");
    const [selectedClothing, setSelectedClothing] = useState('none');
    const [selectedColor, setSelectedColor] = useState('none');
    const [selectedSkin, setSelectedSkin] = useState('none');
    const [selectedLighting, setSelectedLighting] = useState('cinematic');
    const [isRealismHigh, setIsRealismHigh] = useState(true);
    const [isAnimated, setIsAnimated] = useState(false);

    const AVAILABLE_MODELS = AVAILABLE_PONY_MODELS;

    const handleSubmit = () => {
        onConfirm(prompt, aspectRatio, selectedModel, selectedClothing, selectedColor, selectedSkin, selectedLighting, isRealismHigh, isAnimated);
        setPrompt("");
        onClose();
    };

    const toggleAction = (text) => {
        if (prompt.includes(text)) {
            setPrompt(prev => prev.replace(text, '').replace(', ,', ',').replace(/^, /, '').trim());
        } else {
            setPrompt(prev => prev ? `${prev}, ${text}` : text);
        }
    };

    const getSelectedCount = (cat) => {
        return ACTION_CATEGORIES[cat].filter(act => prompt.includes(act.text)).length;
    };

    const filteredActions = searchQuery 
        ? Object.values(ACTION_CATEGORIES).flat().filter(act => 
            act.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
            act.text.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : ACTION_CATEGORIES[activeCategory];

    const activeTagsByLabel = Object.values(ACTION_CATEGORIES).flat().filter(act => prompt.includes(act.text));

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="modal-overlay" onClick={onClose}>
                    <motion.div 
                        className="modal-content glass-panel" 
                        onClick={(e) => e.stopPropagation()}
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 30 }}
                        style={{ 
                            maxWidth: '820px', 
                            padding: '0', 
                            overflow: 'hidden', 
                            maxHeight: '85vh', 
                            width: '95%',
                            display: 'flex', 
                            flexDirection: 'column',
                            margin: 'auto'
                        }}
                    >
                        {/* COMPACT HEADER */}
                        <div className="modal-header" style={{ flexShrink: 0, padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.4)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div className="premium-icon-glow">
                                    <Camera className="premium-gradient-text" size={22} />
                                </div>
                                <h2 style={{ margin: 0, fontSize: '1.1rem', color: 'white' }}>Magic Selfie <span style={{ color: '#a1a1aa', fontWeight: 'lighter', fontSize: '0.75rem', marginLeft: '8px' }}>v2.5 Pro Hub</span></h2>
                            </div>
                            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: '5px', borderRadius: '50%' }}>
                                <X size={16} />
                            </button>
                        </div>

                        {/* COMPACT TAB NAV */}
                        <div style={{ flexShrink: 0, display: 'flex', padding: '0 12px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            {[
                                { id: 'Doing', icon: Wand2, label: 'Scene' },
                                { id: 'Looking', icon: User, label: 'Physical' },
                                { id: 'Setting', icon: Settings, label: 'Config' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    style={{
                                        padding: '12px 14px',
                                        border: 'none',
                                        background: 'transparent',
                                        color: activeTab === tab.id ? '#c084fc' : '#71717a',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        position: 'relative',
                                        fontSize: '0.8rem',
                                        fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    <tab.icon size={14} />
                                    {tab.label}
                                    {activeTab === tab.id && (
                                        <motion.div 
                                            layoutId="tab-underline"
                                            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: 'var(--primary-color)' }} 
                                        />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* MAIN CONTENT AREA - DYNAMIC GROWTH */}
                        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <AnimatePresence mode="wait">
                                {activeTab === 'Doing' && (
                                    <motion.div
                                        key="hub-doing"
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}
                                    >
                                        {/* COMPACT SIDEBAR */}
                                        <div style={{ width: '160px', flexShrink: 0, background: 'rgba(0,0,0,0.3)', borderRight: '1px solid rgba(255,255,255,0.05)', overflowY: 'auto', padding: '6px' }}>
                                            <div style={{ padding: '6px', marginBottom: '6px' }}>
                                                <div style={{ position: 'relative' }}>
                                                    <Search size={10} style={{ position: 'absolute', left: '8px', top: '9px', color: '#71717a' }} />
                                                    <input 
                                                        type="text" 
                                                        placeholder="Search..." 
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        style={{ width: '100%', padding: '5px 8px 5px 24px', background: 'rgba(255,255,255,0.05)', border: '1px solid #3f3f46', borderRadius: '6px', color: 'white', fontSize: '0.7rem' }}
                                                    />
                                                </div>
                                            </div>

                                            {Object.keys(ACTION_CATEGORIES).map(cat => {
                                                const count = getSelectedCount(cat);
                                                return (
                                                    <button
                                                        key={cat}
                                                        onClick={() => { setActiveCategory(cat); setSearchQuery(""); }}
                                                        style={{
                                                            width: '100%', padding: '8px 10px', border: 'none', borderRadius: '6px',
                                                            background: activeCategory === cat && !searchQuery ? 'rgba(168, 85, 247, 0.12)' : 'transparent',
                                                            color: activeCategory === cat && !searchQuery ? 'white' : '#a1a1aa',
                                                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                            marginBottom: '1px', transition: 'all 0.2s', gap: '6px'
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                                                            {CATEGORY_ICONS[cat]}
                                                            <span style={{ fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: activeCategory === cat ? 'bold' : 'normal' }}>{cat}</span>
                                                        </div>
                                                        {count > 0 && (
                                                            <span style={{ flexShrink: 0, background: 'var(--primary-color)', color: 'white', fontSize: '0.55rem', padding: '1px 4px', borderRadius: '6px', fontWeight: 'bold' }}>
                                                                {count}
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* FLEXIBLE TAG GRID */}
                                        <div style={{ flex: 1, padding: '16px', overflowY: 'auto', background: 'rgba(0,0,0,0.1)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                <div style={{ flex: 1 }}>
                                                    <h3 style={{ margin: 0, color: 'white', fontSize: '0.9rem' }}>{searchQuery ? 'Search Results' : activeCategory}</h3>
                                                    <p style={{ margin: '2px 0 0 0', fontSize: '0.65rem', color: '#71717a' }}>{searchQuery ? `Found ${filteredActions.length} matches` : `${activeCategory.toLowerCase()}`}</p>
                                                </div>
                                                {!searchQuery && (
                                                  <button 
                                                    onClick={() => {
                                                        const texts = ACTION_CATEGORIES[activeCategory].map(a => a.text);
                                                        let newPrompt = prompt;
                                                        texts.forEach(t => {
                                                            newPrompt = newPrompt.replace(t, '').replace(', ,', ',').replace(/^, /, '').trim();
                                                        });
                                                        setPrompt(newPrompt);
                                                    }}
                                                    style={{ flexShrink: 0, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.6rem', cursor: 'pointer' }}
                                                  >
                                                    Reset
                                                  </button>
                                                )}
                                            </div>

                                            {/* SPECIAL INJECTION FOR STYLES CATEGORY */}
                                            {activeCategory === "Styles" && !searchQuery && (
                                                <div style={{ marginBottom: '14px', padding: '10px', background: 'rgba(168, 85, 247, 0.08)', borderRadius: '10px', border: '1px solid rgba(168, 85, 247, 0.15)' }}>
                                                    <div style={{ color: '#c084fc', fontSize: '0.7rem', marginBottom: '6px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                        <Shirt size={10} /> Base Foundation
                                                    </div>
                                                    <select 
                                                        value={selectedClothing} 
                                                        onChange={(e) => setSelectedClothing(e.target.value)} 
                                                        className="premium-select" 
                                                        style={{ width: '100%', padding: '6px 10px', background: 'rgba(0,0,0,0.4)', border: '1px solid #3f3f46', fontSize: '0.75rem' }}
                                                    >
                                                        {CLOTHING_TYPES.map(type => <option key={type.id} value={type.id}>{type.label}</option>)}
                                                    </select>
                                                </div>
                                            )}

                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '8px' }}>
                                                {filteredActions.map((act, i) => {
                                                    const isActive = prompt.includes(act.text);
                                                    return (
                                                        <motion.button
                                                            key={`${activeCategory}-${i}`}
                                                            onClick={() => toggleAction(act.text)}
                                                            initial={{ opacity: 0, scale: 0.98 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            whileHover={{ scale: 1.01 }}
                                                            whileTap={{ scale: 0.99 }}
                                                            style={{
                                                                background: isActive ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.02)',
                                                                border: `1px solid ${isActive ? '#c084fc' : 'rgba(255,255,255,0.06)'}`,
                                                                color: isActive ? 'white' : '#a1a1aa',
                                                                padding: '8px', borderRadius: '8px', fontSize: '0.7rem', cursor: 'pointer',
                                                                textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '2px', position: 'relative'
                                                            }}
                                                        >
                                                            {isActive && <CheckCircle2 size={10} style={{ position: 'absolute', right: '6px', top: '6px', color: '#c084fc' }} />}
                                                            <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{act.label}</span>
                                                        </motion.button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {activeTab === 'Looking' && (
                                    <motion.div key="hub-looking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1, padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', overflowY: 'auto' }}>
                                        <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                            <div style={{ color: '#60a5fa', fontSize: '0.75rem', marginBottom: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Palette size={12} /> Ambient Color
                                            </div>
                                            <select value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)} className="premium-select" style={{ width: '100%', padding: '8px', fontSize: '0.75rem' }}>
                                                {COLORS.map(color => <option key={color.id} value={color.id}>{color.label}</option>)}
                                            </select>
                                        </div>
                                        <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                            <div style={{ color: '#f472b6', fontSize: '0.75rem', marginBottom: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Droplets size={12} /> Skin Texture
                                            </div>
                                            <select value={selectedSkin} onChange={(e) => setSelectedSkin(e.target.value)} className="premium-select" style={{ width: '100%', padding: '8px', fontSize: '0.75rem' }}>
                                                {SKIN_TEXTURES.map(skin => <option key={skin.id} value={skin.id}>{skin.label}</option>)}
                                            </select>
                                        </div>
                                        <div style={{ gridColumn: 'span 2', padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                            <div style={{ color: '#f97316', fontSize: '0.75rem', marginBottom: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Sun size={12} /> Cinematic Lighting & Atmosphere
                                            </div>
                                            <select value={selectedLighting} onChange={(e) => setSelectedLighting(e.target.value)} className="premium-select" style={{ width: '100%', padding: '8px', fontSize: '0.75rem' }}>
                                                {LIGHTING_MODES.map(mode => <option key={mode.id} value={mode.id}>{mode.label}</option>)}
                                            </select>
                                        </div>
                                    </motion.div>
                                )}

                                {activeTab === 'Setting' && (
                                    <motion.div key="hub-setting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                                            <div 
                                                onClick={() => setIsRealismHigh(!isRealismHigh)}
                                                style={{
                                                    background: isRealismHigh ? 'rgba(168, 85, 247, 0.1)' : 'rgba(255,255,255,0.02)',
                                                    border: `1px solid ${isRealismHigh ? '#c084fc' : '#3f3f46'}`,
                                                    padding: '14px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s'
                                                }}
                                            >
                                                <Zap size={18} color={isRealismHigh ? '#c084fc' : '#71717a'} />
                                                <div style={{ color: 'white', fontWeight: 'bold', fontSize: '0.85rem', marginTop: '6px' }}>Realism Boost</div>
                                                <div style={{ color: '#71717a', fontSize: '0.65rem' }}>Hi-res modules</div>
                                            </div>
                                            <div 
                                                onClick={() => setIsAnimated(!isAnimated)}
                                                style={{
                                                    background: isAnimated ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.02)',
                                                    border: `1px solid ${isAnimated ? '#3b82f6' : '#3f3f46'}`,
                                                    padding: '14px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s'
                                                }}
                                            >
                                                <Play size={18} color={isAnimated ? '#3b82f6' : '#71717a'} />
                                                <div style={{ color: 'white', fontWeight: 'bold', fontSize: '0.85rem', marginTop: '6px' }}>Live Photo</div>
                                                <div style={{ color: '#71717a', fontSize: '0.65rem' }}>3s Motion</div>
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: '16px' }}>
                                            <div style={{ color: '#c084fc', fontSize: '0.75rem', marginBottom: '6px', fontWeight: 'bold' }}>Aspect Ratio</div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {['portrait', 'landscape', 'square'].map(ar => (
                                                    <button
                                                        key={ar}
                                                        onClick={() => setAspectRatio(ar)}
                                                        style={{
                                                            flex: 1, padding: '10px', borderRadius: '8px',
                                                            border: aspectRatio === ar ? '1.5px solid #c084fc' : '1px solid #3f3f46',
                                                            background: aspectRatio === ar ? 'rgba(192, 132, 252, 0.12)' : 'rgba(255,255,255,0.02)',
                                                            color: 'white', cursor: 'pointer', fontSize: '0.8rem'
                                                        }}
                                                    >
                                                        {ar}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <div style={{ color: '#c084fc', fontSize: '0.75rem', marginBottom: '6px', fontWeight: 'bold' }}>Diffusion Model</div>
                                            <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="premium-select" style={{ width: '100%', padding: '10px', fontSize: '0.8rem' }}>
                                                {AVAILABLE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                            </select>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* FOOTER - ENSURED VISIBILITY */}
                        <div style={{ flexShrink: 0, padding: '12px 16px', background: 'rgba(0,0,0,0.6)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            {/* ACTIVE TAGS SUMMARY */}
                            {activeTagsByLabel.length > 0 && (
                                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '8px' }} className="hide-scrollbar">
                                    <button onClick={() => setPrompt("")} style={{ flexShrink: 0, background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#ef4444', padding: '2px 6px', borderRadius: '12px', fontSize: '0.6rem', display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap' }}>
                                        <Trash2 size={9} /> Reset
                                    </button>
                                    {activeTagsByLabel.map((act, i) => (
                                        <span key={i} style={{ flexShrink: 0, background: 'rgba(168, 85, 247, 0.15)', border: '1px solid #c084fc', color: 'white', padding: '2px 6px', borderRadius: '12px', fontSize: '0.6rem', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                                            {act.label}
                                            <X size={9} style={{ cursor: 'pointer' }} onClick={() => toggleAction(act.text)} />
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <div style={{ flex: 1 }}>
                                    <textarea
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder="Mood / Refinements..."
                                        style={{
                                            width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '8px', color: 'white', padding: '8px 12px', height: '32px', fontSize: '0.8rem',
                                            outline: 'none', resize: 'none', flexShrink: 0
                                        }}
                                    />
                                </div>
                                <button 
                                    onClick={handleSubmit}
                                    className="premium-gradient-btn"
                                    style={{
                                        padding: '10px 24px', borderRadius: '10px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        fontSize: '0.9rem', fontWeight: 'bold',
                                        flexShrink: 0
                                    }}
                                >
                                    <Sparkles size={16} />
                                    Generate
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default SelfiePromptModal;
