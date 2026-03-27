import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MoodOverlay = ({ score, intensity }) => {
  // Logic for mood triggers
  const isBlushing = score > 80 || (intensity >= 4 && score > 60);
  const isIntense = intensity >= 5;
  const isComforted = score > 70 && intensity <= 2;

  return (
    <div className="mood-overlay-container">
      <AnimatePresence>
        {isBlushing && (
          <motion.div 
            key="blush"
            className="mood-overlay-container mood-blush"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
        {isIntense && (
          <motion.div 
            key="intense"
            className="mood-overlay-container mood-intensity"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
        {isComforted && (
          <motion.div 
            key="comfort"
            className="mood-overlay-container mood-comfort"
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
