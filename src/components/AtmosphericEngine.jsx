import React, { useEffect, useState } from 'react';

/**
 * Bio-Metric Atmospheric Engine
 * Syncs the UI aesthetic with character intensity and mood.
 */
const AtmosphericEngine = ({ mood, intensity }) => {
    const [pulseSpeed, setPulseSpeed] = useState(4);
    const [glowColor, setGlowColor] = useState('rgba(124, 58, 237, 0.1)'); // Default purple

    useEffect(() => {
        // Map intensity (1-5) to pulse speed (seconds per cycle)
        // High intensity = faster pulse (1-2s), Low intensity = slower (6-8s)
        const speed = 8 - (intensity * 1.4);
        setPulseSpeed(Math.max(1, speed));

        // Map mood to glow colors
        const moodLower = (mood || 'Calm').toLowerCase();
        if (moodLower.includes('angry') || moodLower.includes('intense') || moodLower.includes('heat')) {
            setGlowColor('rgba(239, 68, 68, 0.15)'); // Red
        } else if (moodLower.includes('sad') || moodLower.includes('blue') || moodLower.includes('lonely')) {
            setGlowColor('rgba(59, 130, 246, 0.15)'); // Blue
        } else if (moodLower.includes('happy') || moodLower.includes('excited') || moodLower.includes('love')) {
            setGlowColor('rgba(236, 72, 153, 0.15)'); // Pink
        } else if (moodLower.includes('aroused') || moodLower.includes('lust') || moodLower.includes('forbidden')) {
            setGlowColor('rgba(168, 85, 247, 0.2)'); // Deep Purple
        } else {
            setGlowColor('rgba(124, 58, 237, 0.1)'); // Default Neural
        }
    }, [mood, intensity]);

    return (
        <div 
            className="atmospheric-layers" 
            style={{
                position: 'fixed',
                inset: 0,
                pointerEvents: 'none',
                zIndex: 0,
                overflow: 'hidden',
                '--glow-color': glowColor,
                '--pulse-speed': `${pulseSpeed}s`,
                '--intensity-filter': intensity >= 5 ? 'contrast(1.05) saturate(1.1)' : 'none'
            }}
        >
            {/* Bio-Metric Pulse Glow */}
            <div 
                className="pulse-glow"
                style={{
                    position: 'absolute',
                    inset: '-10%',
                    background: `radial-gradient(circle at center, var(--glow-color) 0%, transparent 70%)`,
                    animation: `atmospheric-pulse var(--pulse-speed) ease-in-out infinite`,
                    opacity: 0.6
                }}
            />

            {/* Neural Noise Overlay */}
            <div 
                className="neural-noise"
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")',
                    opacity: intensity > 3 ? 0.08 : 0.04,
                    filter: 'contrast(150%) brightness(150%)',
                    mixBlendingMode: 'overlay'
                }}
            />

            {/* Fixed styles that don't change based on props */}
            <style>{`
                @keyframes atmospheric-pulse {
                    0% { transform: scale(1); opacity: 0.4; }
                    50% { transform: scale(1.1); opacity: 0.7; }
                    100% { transform: scale(1); opacity: 0.4; }
                }
                
                /* Apply intensity filter to a specific layer instead of the whole body */
                .atmospheric-layers {
                    filter: var(--intensity-filter);
                    transition: filter 0.5s ease;
                }
            `}</style>
        </div>
    );
};

export default React.memo(AtmosphericEngine);
