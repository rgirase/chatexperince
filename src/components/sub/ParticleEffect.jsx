import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ParticleEffect = ({ type = 'hearts', count = 12, onComplete }) => {
    const [particles, setParticles] = useState([]);

    useEffect(() => {
        const icons = {
            hearts: ['❤️', '💖', '💝', '💕'],
            sparkles: ['✨', '⭐', '🌟'],
            confetti: ['🎉', '🎊', '✨']
        };

        const selectedIcons = icons[type] || icons.hearts;
        
        const newParticles = Array.from({ length: count }).map((_, i) => ({
            id: i,
            icon: selectedIcons[Math.floor(Math.random() * selectedIcons.length)],
            x: Math.random() * 100 - 50, // center offset
            y: Math.random() * 100 - 50,
            size: Math.random() * 20 + 20,
            duration: Math.random() * 1.5 + 1.5,
            delay: Math.random() * 0.5
        }));

        setParticles(newParticles);

        const timer = setTimeout(() => {
            if (onComplete) onComplete();
        }, 3000);

        return () => clearTimeout(timer);
    }, [type, count, onComplete]);

    return (
        <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 9999,
        }}>
            <AnimatePresence>
                {particles.map((p) => (
                    <motion.div
                        key={p.id}
                        initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                        animate={{ 
                            opacity: [0, 1, 1, 0], 
                            scale: [0, 1.5, 1, 0.5],
                            x: p.x * 4, // Spread out
                            y: p.y * 6 - 200, // Float up
                            rotate: Math.random() * 360
                        }}
                        transition={{ 
                            duration: p.duration, 
                            delay: p.delay,
                            ease: "easeOut" 
                        }}
                        style={{
                            position: 'absolute',
                            fontSize: `${p.size}px`,
                        }}
                    >
                        {p.icon}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default ParticleEffect;
