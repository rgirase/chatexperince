/**
 * Service to manage long-term character milestones and memories.
 * Updated to use IndexedDB (db.js) for high-capacity storage.
 */
import * as db from './db';

export const saveMilestone = async (personaId, milestone) => {
    const memories = await getMemories(personaId);
    const updated = [...memories, {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        content: milestone
    }];
    await db.setItem('memories', `milestones_${personaId}`, updated);
    return updated;
};

export const getMemories = async (personaId) => {
    try {
        let saved = await db.getItem('memories', `milestones_${personaId}`);
        if (!saved) {
            // Migration check
            const local = localStorage.getItem(`milestones_${personaId}`);
            if (local) {
                saved = JSON.parse(local);
                await db.setItem('memories', `milestones_${personaId}`, saved);
            }
        }
        return saved || [];
    } catch (e) {
        console.error(`Failed to parse memories for ${personaId}`, e);
        return [];
    }
};

export const clearMemories = async (personaId) => {
    await db.removeItem('memories', `milestones_${personaId}`);
};

export const deleteMilestone = async (personaId, milestoneId) => {
    const memories = await getMemories(personaId);
    const updated = memories.filter(m => m.id !== milestoneId);
    await db.setItem('memories', `milestones_${personaId}`, updated);
    return updated;
};

export const deleteDiaryEntry = async (personaId, entryId) => {
    try {
        const key = `diaries_${personaId}`;
        let diaries = await db.getItem('memories', key);
        if (!diaries) {
            const local = localStorage.getItem(key);
            if (local) {
                diaries = JSON.parse(local);
                await db.setItem('memories', key, diaries);
            }
        }
        const updated = (diaries || []).filter(d => d.id !== entryId);
        await db.setItem('memories', key, updated);
        return updated;
    } catch (e) {
        console.error("Failed to delete diary entry", e);
        return [];
    }
};

export const getDiaries = async (personaId) => {
    try {
        const key = `diaries_${personaId}`;
        let diaries = await db.getItem('memories', key);
        if (!diaries) {
            const local = localStorage.getItem(key);
            if (local) {
                diaries = JSON.parse(local);
                await db.setItem('memories', key, diaries);
            }
        }
        return diaries || [];
    } catch (e) {
        console.error("Failed to fetch diaries", e);
        return [];
    }
};
