import React from 'react';
import { motion } from 'framer-motion';

const AuraPulse = ({ score = 50, intensity = 3 }) => {
    // Determine color based on relationship score
    // 0-30: Blue/Neutral
    // 31-60: Green/Friendly
    // 61-85: Pink/Affectionate
    // 86-100: Red/Intimate
    const getAuraColor = (s) => {
        if (s <= 30) return 'rgba(56, 189, 248, 0.5)'; // sky-400
        if (s <= 60) return 'rgba(16, 185, 129, 0.5)'; // emerald-500
        if (s <= 85) return 'rgba(244, 114, 182, 0.5)'; // pink-400
        return 'rgba(239, 68, 68, 0.5)'; // red-500
    };

    const color = getAuraColor(score);
    
    // Pulse speed based on intensity (1-5)
    // Intensity 1: 3s
    // Intensity 5: 0.8s
    const duration = 3.5 - (intensity * 0.5);

    return (
        <div className="aura-pulse-wrapper" style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: -1
        }}>
            {/* Inner Glow */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                    duration: duration,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                style={{
                    position: 'absolute',
                    inset: '-10px',
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
                    filter: 'blur(10px)'
                }}
            />
            
            {/* Outer Ring */}
            <motion.div
                animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.1, 0.3, 0.1],
                }}
                transition={{
                    duration: duration * 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.2
                }}
                style={{
                    position: 'absolute',
                    inset: '-20px',
                    borderRadius: '50%',
                    border: `2px solid ${color}`,
                    filter: 'blur(5px)'
                }}
            />
        </div>
    );
};

export default AuraPulse;
