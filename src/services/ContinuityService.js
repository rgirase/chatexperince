import { getCompletion } from './llm';
import * as db from './db';

/**
 * ContinuityService: Manages the "Ledger of Secrets" and shared lore across personas.
 */
class ContinuityService {
    /**
     * Extracts persistent world facts or character secrets from a conversation.
     * Throttled to avoid excessive API calls.
     */
    async processInteraction(persona, messages) {
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

            const facts = result.split('\n')
                .filter(l => l.includes(':'))
                .map(l => l.split(':')[1].trim());

            for (const fact of facts) {
                await this.saveLore(fact, persona.category, persona.id);
            }
            console.log(`[Continuity] Extracted ${facts.length} facts for category: ${persona.category}`);
        } catch (e) {
            console.error("[Continuity] Extraction failed", e);
        }
    }

    /**
     * Saves a piece of lore to IndexedDB.
     */
    async saveLore(fact, category, sourceId) {
        const id = `lore_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const loreObj = {
            id,
            fact,
            category,
            sourceId,
            timestamp: Date.now()
        };
        await db.setItem('lore', id, loreObj);
    }

    /**
     * Fetches all relevant lore for a persona and returns a formatted prompt block.
     */
    async getLorePrompt(persona) {
        try {
            const allLore = await db.getAll('lore');
            // Filter by category or global relevance
            const relevant = allLore
                .filter(l => l.category === persona.category || l.category === 'Global')
                .slice(-10); // Keep only the most recent 10 facts to avoid context bloat

            if (relevant.length === 0) return "";

            return `
### SHARED CONTINUITY & WORLD LORE
You are aware of the following persistent facts about this world and the user:
${relevant.map((l, i) => `${i + 1}. ${l.fact}`).join('\n')}
--------------------------------------------------
`;
        } catch (e) {
            return "";
        }
    }
}

export const continuity = new ContinuityService();
