import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, X } from 'lucide-react';

const GiftsModal = ({ isOpen, onClose, onSendGift }) => {
    const gifts = [
        { name: "Coffee", icon: "☕", bonus: 5, description: "A warm drink to start the day." },
        { name: "Flowers", icon: "🌸", bonus: 10, description: "A beautiful bouquet of roses." },
        { name: "Chocolate", icon: "🍫", bonus: 15, description: "Luxury dark chocolate pralines." },
        { name: "Jewelry", icon: "💍", bonus: 25, description: "A sparkly necklace to make her shine." },
        { name: "Perfume", icon: "🧴", bonus: 20, description: "A seductive designer fragrance." },
        { name: "Lingerie", icon: "👙", bonus: 30, description: "Something sexy for a special night." }
    ];

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
                    >
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Gift className="premium-gradient-text" size={24} />
                                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Send a Gift</h2>
                            </div>
                            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="gift-grid" style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                                gap: '1rem',
                                padding: '0.5rem'
                            }}>
                                {gifts.map((gift, i) => (
                                    <motion.div 
                                        key={i} 
                                        className="glass-panel"
                                        style={{
                                            padding: '1.5rem',
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid rgba(255,255,255,0.05)',
                                            borderRadius: '16px'
                                        }}
                                        whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.08)' }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => onSendGift(gift)}
                                    >
                                        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{gift.icon}</div>
                                        <div style={{ fontWeight: '800', fontSize: '1rem', marginBottom: '0.25rem' }}>{gift.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#f472b6', fontWeight: 'bold' }}>+{gift.bonus} Bond</div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default GiftsModal;
