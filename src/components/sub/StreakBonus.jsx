import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Gift, CheckCircle2 } from 'lucide-react';

const StreakBonus = ({ streak, lastRewardDate, onClaim }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (streak > 0) {
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, [streak]);

    const isRewardAvailable = lastRewardDate !== new Date().toDateString();

    const getStreakMessage = () => {
        if (streak === 1) return "First day back! Welcome!";
        if (streak < 3) return `${streak} day streak! Keep it up!`;
        if (streak === 3) return "3-Day Streak! Mini-gift unlocked!";
        if (streak === 7) return "7-Day Streak! Premium gift unlocked!";
        return `${streak} day streak! You're on fire!`;
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div 
                    initial={{ opacity: 0, y: 100, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.9 }}
                    className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md"
                >
                    <div className="bg-gray-900/90 backdrop-blur-xl border border-pink-500/30 rounded-2xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.6)] flex items-center gap-4">
                        <div className="relative">
                            <div className="bg-gradient-to-br from-orange-500 to-red-600 p-3 rounded-xl shadow-lg">
                                <Flame size={28} color="white" fill="white" className="animate-pulse" />
                            </div>
                            <div className="absolute -top-1 -right-1 bg-pink-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-gray-900">
                                {streak}
                            </div>
                        </div>

                        <div className="flex-1">
                            <h3 className="text-white font-bold text-sm">Daily Return</h3>
                            <p className="text-pink-300/80 text-xs">{getStreakMessage()}</p>
                        </div>

                        {isRewardAvailable ? (
                            <button 
                                onClick={() => {
                                    onClaim();
                                    setIsVisible(false);
                                }}
                                className="bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95 flex items-center gap-2"
                            >
                                <Gift size={14} />
                                Claim
                            </button>
                        ) : (
                            <div className="flex flex-col items-center gap-1 opacity-50">
                                <CheckCircle2 size={20} className="text-green-500" />
                                <span className="text-[10px] text-white/40 uppercase font-bold tracking-tighter">Done</span>
                            </div>
                        )}

                        <button 
                            onClick={() => setIsVisible(false)}
                            className="absolute -top-2 -right-2 bg-gray-800 text-white/50 hover:text-white rounded-full p-1 border border-white/10"
                        >
                            <span className="text-sm font-bold block w-4 h-4 leading-4 text-center">×</span>
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default StreakBonus;
