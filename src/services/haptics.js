/**
 * HapticService
 * Provides subtle physical feedback using the browser Vibration API.
 */

export const playHaptic = (pattern = 'light') => {
    if (!navigator.vibrate) return;

    switch (pattern) {
        case 'light':
            navigator.vibrate(15);
            break;
        case 'medium':
            navigator.vibrate(30);
            break;
        case 'heavy':
            navigator.vibrate(60);
            break;
        case 'heartbeat':
            navigator.vibrate([40, 100, 40]);
            break;
        case 'pulse':
            navigator.vibrate([20, 50, 20, 50, 20]);
            break;
        default:
            navigator.vibrate(20);
    }
};

export const vibrateOnTouch = (text) => {
    if (!text) return;
    
    const lowercase = text.toLowerCase();
    
    // Heuristic: Vibrate on physical contact keywords
    const touchKeywords = ['touch', 'hand', 'finger', 'brush', 'hold', 'hug', 'kiss', 'caress', 'tap', 'shoulder'];
    const intensityKeywords = ['grab', 'pull', 'rough', 'intense', 'fast'];
    const heartKeywords = ['love', 'heart', 'thump', 'beat', 'deep'];

    if (intensityKeywords.some(kw => lowercase.includes(kw))) {
        playHaptic('heavy');
    } else if (heartKeywords.some(kw => lowercase.includes(kw))) {
        playHaptic('heartbeat');
    } else if (touchKeywords.some(kw => lowercase.includes(kw))) {
        playHaptic('light');
    }
};
