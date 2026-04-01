import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, X, Calendar, Sparkles } from 'lucide-react';

const InventoryModal = ({ isOpen, onClose, inventory, personaName }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
                    <motion.div 
                        className="modal-content glass-panel" 
                        onClick={(e) => e.stopPropagation()}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        style={{ 
                            maxWidth: '600px', 
                            width: '90%', 
                            maxHeight: '80vh', 
                            overflow: 'hidden', 
                            display: 'flex', 
                            flexDirection: 'column',
                            padding: '0'
                        }}
                    >
                        <div className="modal-header" style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ 
                                    background: 'rgba(236, 72, 153, 0.1)', 
                                    padding: '8px', 
                                    borderRadius: '12px',
                                    color: '#ec4899'
                                }}>
                                    <Package size={20} />
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>{personaName}'s Collection</h2>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#a1a1aa' }}>Permanently stored gifts & items</p>
                                </div>
                            </div>
                            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '1.5rem' }}>
                            {(!inventory || inventory.length === 0) ? (
                                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#71717a' }}>
                                    <Sparkles size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                                    <p>No items collected yet.</p>
                                    <p style={{ fontSize: '0.75rem' }}>Send a gift to start building {personaName}'s collection!</p>
                                </div>
                            ) : (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                                    gap: '1rem'
                                }}>
                                    {inventory.map((item, idx) => (
                                        <motion.div 
                                            key={item.id || idx}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="glass-panel"
                                            style={{
                                                padding: '1rem',
                                                textAlign: 'center',
                                                background: 'rgba(255,255,255,0.02)',
                                                border: '1px solid rgba(255,255,255,0.05)',
                                                borderRadius: '16px',
                                                position: 'relative'
                                            }}
                                        >
                                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{item.icon}</div>
                                            <div style={{ fontWeight: '700', fontSize: '0.85rem', marginBottom: '0.25rem', color: '#f4f4f5' }}>{item.name}</div>
                                            <div style={{ fontSize: '0.7rem', color: '#f472b6', fontWeight: 'bold' }}>+{item.bonus} Bond</div>
                                            
                                            <div style={{ 
                                                marginTop: '0.5rem', 
                                                paddingTop: '0.5rem', 
                                                borderTop: '1px solid rgba(255,255,255,0.03)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '4px',
                                                fontSize: '0.6rem',
                                                color: '#71717a'
                                            }}>
                                                <Calendar size={10} />
                                                {item.receivedAt ? new Date(item.receivedAt).toLocaleDateString() : 'Classic'}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default InventoryModal;
