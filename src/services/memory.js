/**
 * Service to manage character diaries and legacy memory migrations.
 */
import * as db from './db';

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
