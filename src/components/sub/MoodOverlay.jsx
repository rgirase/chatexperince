import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MoodOverlay = ({ score, intensity, mood }) => {
  const isBlushing = score > 80 || (intensity >= 4 && score > 60) || mood === 'Flirty';
  const isIntense = intensity >= 5 || mood === 'Intense';
  const isComforted = (score > 70 && intensity <= 2) || mood === 'Supportive' || mood === 'Calm';
  const isGuilty = mood === 'Guilty';
  const isAngry = mood === 'Angry';

  return (
    <div className="mood-overlay-container" style={{ pointerEvents: 'none' }}>
      <AnimatePresence>
        {isBlushing && (
          <motion.div 
            key="blush"
            className="mood-overlay-container mood-blush"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
          />
        )}
        {isIntense && (
          <motion.div 
            key="intense"
            className="mood-overlay-container mood-intensity"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 0.2, scale: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
        {isComforted && (
          <motion.div 
            key="comfort"
            className="mood-overlay-container mood-comfort"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            exit={{ opacity: 0 }}
          />
        )}
        {isGuilty && (
          <motion.div 
            key="guilty"
            className="mood-overlay-container"
            style={{ background: 'radial-gradient(circle, transparent 20%, rgba(0,0,0,0.6) 100%)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
        {isAngry && (
          <motion.div 
            key="angry"
            className="mood-overlay-container"
            style={{ background: 'radial-gradient(circle, transparent 40%, rgba(239, 68, 68, 0.15) 100%)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MoodOverlay;
