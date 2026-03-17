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

export const getUserAura = () => {
    // 1. Gather all user messages across all chats
    let allUserMessages = "";
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
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
    if (winner.score === 0) {
        return ARCHETYPES[2]; // Default to Charmer or something neutral
    }

    return winner;
};

export const updateAura = () => {
    const aura = getUserAura();
    if (aura) {
        localStorage.setItem('userAura', JSON.stringify(aura));
    }
    return aura;
};
