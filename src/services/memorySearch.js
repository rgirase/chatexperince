import * as db from './db';

/**
 * searchHistory
 * Searches across all archived conversations for a specific persona to find relevant snippets.
 */
export const searchHistory = async (personaId, query) => {
    if (!query || query.length < 3) return null;

    try {
        // 1. Get all archived conversations
        const allConversations = await db.getAll('conversations') || [];
        
        // 2. Filter for this persona
        const personaConvos = allConversations.filter(c => c.personaId === personaId);
        
        if (personaConvos.length === 0) return null;

        // 3. Simple Keyword Match / TF-IDF light
        const keywords = query.toLowerCase().split(/\W+/).filter(w => w.length > 3);
        if (keywords.length === 0) return null;

        const matches = [];

        personaConvos.forEach(convo => {
            convo.messages.forEach((msg, idx) => {
                if (msg.role === 'ai') return; // We mainly want to recall what the USER said
                
                const content = msg.content.toLowerCase();
                let score = 0;
                keywords.forEach(kw => {
                    if (content.includes(kw)) score++;
                });

                if (score > 0) {
                    // Grab the user message and the subsequent AI response for context
                    const snippet = {
                        user: msg.content,
                        ai: convo.messages[idx + 1]?.content || "",
                        timestamp: convo.timestamp,
                        score
                    };
                    matches.push(snippet);
                }
            });
        });

        // 4. Sort by relevance and recency
        matches.sort((a, b) => b.score - a.score || new Date(b.timestamp) - new Date(a.timestamp));

        // Return top 2 unique matches
        return matches.slice(0, 2);
    } catch (e) {
        console.error("[MemorySearch] Search failed", e);
        return null;
    }
};

/**
 * detectRecallIntent
 * Heuristic to check if the user is asking the character to remember something.
 */
export const detectRecallIntent = (text) => {
    const triggers = [
        "remember when", "do you remember", "did i tell you", 
        "last time we", "back then", "you told me", "don't you know"
    ];
    const lower = text.toLowerCase();
    return triggers.some(t => lower.includes(t));
};
