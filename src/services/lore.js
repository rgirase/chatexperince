import * as db from './db';
import { getCompletion } from './llm';

/**
 * LoreService 2.0 (Deep Intelligence)
 * Manages the "Ledger of Secrets" and shared lore across personas using LLM extraction.
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

/**
 * Periodically extracts persistent world facts or character secrets from a conversation.
 * Called from ChatInterface/useChatLogic.
 */
export const extractLore = async (persona, messages) => {
    if (!messages || messages.length < 5) return;
    
    // Only run every 10 messages for efficiency
    if (messages.length % 10 !== 0) return;

    const charName = persona.name.split('(')[0].trim();
    const context = messages.slice(-10).map(m => `${m.role === 'user' ? 'User' : charName}: ${m.content}`).join('\n');

    const prompt = `[LORE_EXTRACTOR_UNIT]
Analyze the following chat context and identify any CRITICAL, LONG-TERM facts about the world, the user, or character secrets discovered.
Only extract facts that should persist and affect other characters in the SAME category (${persona.category}).

Context:
${context}

Output Rules:
1. Return exactly one short sentence per fact.
2. Focus on: Secrets, Major Decisions, User Preferences, World State changes.
3. If no significant facts were found, return "NONE".
4. Examples: 
   - "The user is planning a secret trip to Mumbai next week."
   - "Nisha revealed that she is bored with her marriage."

Format:
Fact 1: [Text]
Fact 2: [Text]
`;

    try {
        const result = await getCompletion(prompt, 0.5);
        if (!result || result.includes("NONE")) return;

        // Clean up thinking blocks if present
        const cleanResult = result.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

        const facts = cleanResult.split('\n')
            .filter(l => l.includes(':'))
            .map(l => l.split(':')[1].trim());

        for (const fact of facts) {
            await addLoreFact(fact, [persona.category, persona.id]);
        }
        console.log(`[Lore] Extracted ${facts.length} facts for category: ${persona.category}`);
    } catch (e) {
        console.error("[Lore] Extraction failed", e);
    }
};

export const addLoreFact = async (fact, tags = []) => {
    if (!fact) return;
    const id = `lore_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
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

export const syncLoreFromSummary = async (summary) => {
    if (!summary) return;
    const facts = summary.split('\n').filter(line => line.includes('-') || line.includes('*'));
    for (const fact of facts) {
        const cleanFact = fact.replace(/^[-*]\s*/, '').trim();
        if (cleanFact.length > 10) {
            await addLoreFact(cleanFact, ['Global']);
        }
    }
};

/**
 * Returns a prompt block for system injection. 
 * Optimized to only show facts relevant to the persona.
 */
export const getLorePrompt = async (persona) => {
    const allLore = await getLore();
    if (allLore.length === 0) return "";
    
    // Filter by tags (category) or global
    const relevant = allLore
        .filter(l => {
            const tags = l.tags || [];
            return tags.includes(persona.category) || tags.includes('Global');
        })
        .slice(-10); // Context windowing

    if (relevant.length === 0) return "";

    return "\n\n### SHARED CONTINUITY (WORLD LORE & SECRETS)\n" + 
           "You are aware of the following facts from this world:\n" +
           relevant.map(l => `- ${l.content}`).join('\n') + 
           "\n(Reference these secrets/facts only if they naturally fit the conversation.)\n";
};
