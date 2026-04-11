import * as db from './db';
import { callLMStudio } from './llm';

/**
 * Neural Recall Service
 * Handles long-term memory extraction, scene persistence, and lore retrieval.
 */

const SCENE_STATE_KEY = (personaId, sessionId) => `scene_${personaId}_${sessionId}`;
const LORE_STORE = 'lore';

/**
 * 1. Scene Persistence
 * Tracks 'fixed' environmental details that often get lost in history slides.
 */
export const updateSceneState = async (personaId, sessionId, delta) => {
    const key = SCENE_STATE_KEY(personaId, sessionId);
    const existing = await db.getItem('scene_state', key) || {
        location: 'Unknown',
        wardrobe: 'Default',
        timeOfDay: 'Present',
        currentGoal: 'None',
        weather: 'Clear'
    };
    
    const updated = { ...existing, ...delta, lastUpdated: Date.now() };
    await db.setItem('scene_state', key, updated);
    return updated;
};

export const getSceneState = async (personaId, sessionId) => {
    const key = SCENE_STATE_KEY(personaId, sessionId);
    return await db.getItem('scene_state', key);
};

/**
 * 2. Lore Extraction (Background Task)
 * Analyzes recent dialogue to find "Fixed Facts" about the User or World.
 */
export const extractLoreFromDialogue = async (persona, messages) => {
    if (messages.length < 2) return;
    
    const recent = messages.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n');
    const existingLore = await db.getAll(LORE_STORE);
    const loreSummary = existingLore.slice(-10).map(l => l.value.fact).join(', ');

    const prompt = `[LORE EXTRACTION ENGINE]
Analyze the recent dialogue between ${persona.name} and the User.
Identify any NEW, PERMANENT facts about the User, the relationship, or the world that aren't already known.

Known Facts: ${loreSummary || 'None'}

Recent Dialogue:
${recent}

Output exactly this JSON format for each NEW fact:
{
  "newFacts": [
    { "category": "user_info|relationship|world_event", "fact": "short specific sentence", "importance": 1-5 }
  ]
}

Rules:
- Only extract GENUINELY new and specific information.
- Avoid repetitive or trivial observations.
- If no new facts, return {"newFacts": []}.
- Keep facts objective and useful for future context.
`;

    try {
        const result = await callLMStudio(prompt, 0.3, false);
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);
            if (data.newFacts && data.newFacts.length > 0) {
                for (const fact of data.newFacts) {
                    const id = `lore_${persona.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                    await db.setItem(LORE_STORE, id, { 
                        ...fact, 
                        personaId: persona.id,
                        timestamp: Date.now() 
                    });
                }
                console.log(`[MemoryEngine] Extracted ${data.newFacts.length} new lore entries.`);
            }
        }
    } catch (e) {
        console.warn("[MemoryEngine] Lore extraction skipped/failed", e);
    }
};

/**
 * 3. Lore Retrieval (Proactive Memory)
 * Finds lore relevant to the current user input to inject into the prompt.
 */
export const retrieveRelevantLore = async (personaId, userInput) => {
    const allLore = await db.getAll(LORE_STORE);
    const personaLore = allLore.filter(l => l.value.personaId === personaId);
    
    if (personaLore.length === 0) return [];

    // Simple keyword-based relevance (Fast & Client-side)
    const keywords = userInput.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    
    const rankedLore = personaLore.map(l => {
        let score = 0;
        const factText = l.value.fact.toLowerCase();
        keywords.forEach(kw => {
            if (factText.includes(kw)) score += 1;
        });
        // Boost by importance
        score *= (l.value.importance || 1);
        return { ...l.value, score };
    });

    return rankedLore
        .filter(l => l.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5); // Return top 5 relevant facts
};
