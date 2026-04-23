/**
 * ReputationService
 * Analyzes cross-character chat history to determine the user's "Aura" (archetype).
 */

const ARCHETYPES = [
    { id: 'Protector', name: 'The Mysterious Protector', color: '#38bdf8', keywords: ['safe', 'protect', 'care', 'help', 'guard'] },
    { id: 'Confidante', name: 'The Intense Confidante', color: '#10b981', keywords: ['secret', 'understand', 'tell me', 'listen', 'deep'] },
    { id: 'Chamer', name: 'The Charming Stranger', color: '#fbbf24', keywords: ['beautiful', 'stunning', 'smile', 'dance', 'lovely'] },
    { id: 'Provocateur', name: 'The Bold Provocateur', color: '#ef4444', keywords: ['dare', 'want', 'take', 'now', 'bold'] },
    { id: 'Observer', name: 'The Keen Observer', color: '#a78bfa', keywords: ['notice', 'watch', 'quiet', 'see', 'look'] }
];

let cachedAura = null;
let lastAuraCalcTime = 0;
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

export const getUserAura = () => {
    // Return cached value if it's fresh enough (prevents massive storage scans on every mount)
    const now = Date.now();
    if (cachedAura && (now - lastAuraCalcTime < CACHE_DURATION)) {
        return cachedAura;
    }

    // 1. Check if we have a reasonably fresh saved aura before scanning
    try {
        const savedAura = localStorage.getItem('userAura');
        const lastScan = parseInt(localStorage.getItem('last_aura_scan_time') || '0');
        if (savedAura && (now - lastScan < CACHE_DURATION * 12)) { // Cache for 1 hour
            const parsed = JSON.parse(savedAura);
            cachedAura = parsed;
            return parsed;
        }
    } catch (e) {}

    // 1. Gather all user messages across all chats
    let allUserMessages = "";
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            console.log("[Reputation] Performing deep scan of histories...");
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('chat_')) {
                    try {
                        const saved = localStorage.getItem(key);
                        if (saved) {
                            const chat = JSON.parse(saved);
                            if (Array.isArray(chat)) {
                                allUserMessages += chat
                                    .filter(m => m.role === 'user')
                                    .map(m => m.content)
                                    .join(' ')
                                    .toLowerCase();
                            }
                        }
                    } catch (e) {
                        // Ignore individual chat failures
                    }
                }
            }
        }
    } catch (e) {
        console.error("[Reputation] Critical storage failure", e);
    }

    if (!allUserMessages) return null;

    // 2. Count keyword occurrences
    const scores = ARCHETYPES.map(arc => {
        const score = arc.keywords.reduce((acc, kw) => {
            const regex = new RegExp(`\\b${kw}\\b`, 'gi');
            const count = (allUserMessages.match(regex) || []).length;
            return acc + count;
        }, 0);
        return { ...arc, score };
    });

    // 3. Find the highest score
    const winner = scores.reduce((prev, current) => (prev.score > current.score) ? prev : current);

    // Fallback if no keywords matched
    const result = (winner.score === 0) ? ARCHETYPES[2] : winner;
    
    // Update Cache
    cachedAura = result;
    lastAuraCalcTime = Date.now();

    return result;
};

export const updateAura = () => {
    const aura = getUserAura();
    if (aura) {
        localStorage.setItem('userAura', JSON.stringify(aura));
        localStorage.setItem('last_aura_scan_time', Date.now().toString());
    }
    return aura;
};

/**
 * getRelationshipLabel
 * Returns a human-readable label for the relationship progress percentage.
 */
export const getRelationshipLabel = (score = 0) => {
    if (score < 10) return "Stranger";
    if (score < 25) return "Acquaintance";
    if (score < 45) return "Deepening Bond";
    if (score < 65) return "Close Companion";
    if (score < 85) return "Inseparable";
    if (score <= 100) return "Soulmate";
    return "Unknown";
};

/**
 * getUserTitle
 * Returns a unique title based on the user's Aura and Relationship growth.
 */
export const getUserTitle = (auraId, globalReputation = 0) => {
    const titles = {
        'Protector': ['The Guarded Heart', 'The Stalwart Shield', 'The Eternal Protector'],
        'Confidante': ['The Secret Keeper', 'The Soul Reader', 'The Ultimate Confidante'],
        'Chamer': ['The Wandering Star', 'The Silver Tongue', 'The Heart\'s Desire'],
        'Provocateur': ['The Flame Igniter', 'The Shadow Dancer', 'The Master of Desires'],
        'Observer': ['The Silent Witness', 'The World Seer', 'The Oracle of Truth']
    };

    const choices = titles[auraId] || ['The Mysterious Stranger'];
    if (globalReputation < 30) return choices[0];
    if (globalReputation < 70) return choices[1];
    return choices[2];
};
