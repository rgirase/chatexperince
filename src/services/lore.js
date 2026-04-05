import * as db from './db';

/**
 * LoreService
 * Tracks "Facts" and "World Knowledge" extracted from chat history.
 */

export const getLore = async () => {
    try {
        const lore = await db.getAll('lore');
        return lore || [];
    } catch (e) {
        console.error("[Lore] Failed to fetch lore", e);
        return [];
    }
};

export const addLoreFact = async (fact, tags = []) => {
    if (!fact) return;
    const id = 'lore_' + Date.now();
    try {
        await db.setItem('lore', id, {
            id,
            content: fact,
            tags,
            timestamp: new Date().toISOString()
        });
        console.log("[Lore] Fact stored:", fact);
    } catch (e) {
        console.error("[Lore] Failed to save fact", e);
    }
};

/**
 * extractLoreFromMessage
 * Scans a message for potential "Lore" facts.
 * In a real production app, this would use an LLM call.
 * For now, we use a heuristic or the LLM already does it in the chat logic.
 */
export const syncLoreFromSummary = async (summary) => {
    if (!summary) return;
    // Simple split for now, assuming the LLM provided a bulleted list or similar
    const facts = summary.split('\n').filter(line => line.includes('-') || line.includes('*'));
    for (const fact of facts) {
        const cleanFact = fact.replace(/^[-*]\s*/, '').trim();
        if (cleanFact.length > 10) {
            await addLoreFact(cleanFact);
        }
    }
};

export const getLorePrompt = async () => {
    const allLore = await getLore();
    if (allLore.length === 0) return "";
    
    return "\n\n[PERSISTENT WORLD LORE]\n" + 
           allLore.slice(-10).map(l => `- ${l.content}`).join('\n') + 
           "\n(Reference these facts if relevant to the current scene.)\n";
};
