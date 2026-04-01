import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Smile, Frown, Heart, Zap, Shield, AlertCircle, Ghost, 
  Wind, Flame, Compass, Coffee, Sparkles 
} from 'lucide-react';

const moodConfigs = {
  'Happy': { icon: <Smile size={14} />, color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.1)' },
  'Sad': { icon: <Frown size={14} />, color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.1)' },
  'Flirty': { icon: <Heart size={14} />, color: '#f472b6', bg: 'rgba(244, 114, 182, 0.1)' },
  'Intense': { icon: <Zap size={14} />, color: '#f87171', bg: 'rgba(248, 113, 113, 0.1)' },
  'Guilty': { icon: <Shield size={14} />, color: '#9ca3af', bg: 'rgba(156, 163, 175, 0.1)' },
  'Angry': { icon: <Flame size={14} />, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
  'Neutral': { icon: <Compass size={14} />, color: '#a1a1aa', bg: 'rgba(161, 161, 170, 0.1)' },
  'Supportive': { icon: <Sparkles size={14} />, color: '#34d399', bg: 'rgba(52, 211, 153, 0.1)' },
  'Confused': { icon: <AlertCircle size={14} />, color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.1)' },
  'Playful': { icon: <Ghost size={14} />, color: '#fb7185', bg: 'rgba(251, 113, 133, 0.1)' },
  'Calm': { icon: <Wind size={14} />, color: '#2dd4bf', bg: 'rgba(45, 212, 191, 0.1)' },
  'Tired': { icon: <Coffee size={14} />, color: '#b45309', bg: 'rgba(180, 83, 9, 0.1)' },
};

const MoodMeter = ({ mood, isBadge }) => {
  const config = moodConfigs[mood] || moodConfigs['Neutral'];
  
  if (isBadge) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={`badge-${mood}`}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: config.bg,
            border: `1px solid ${config.color}`,
            color: config.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(10px)',
            boxShadow: `0 0 10px ${config.color}30`,
            zIndex: 10
          }}
          title={mood}
        >
          {config.icon}
        </motion.div>
      </AnimatePresence>
    );
  }
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={mood}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        className="mood-pill"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '100px',
          background: config.bg,
          border: `1px solid ${config.color}20`,
          color: config.color,
          fontSize: '0.7rem',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          backdropFilter: 'blur(10px)',
          boxShadow: `0 0 10px ${config.color}15`
        }}
      >
        <span style={{ display: 'flex' }}>{config.icon}</span>
        {mood}
      </motion.div>
    </AnimatePresence>
  );
};

export default MoodMeter;
