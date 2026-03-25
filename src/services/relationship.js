import * as db from './db';

/**
 * Service to manage character relationship levels (affection) and wardrobe states.
 */

export const getAffection = async (personaId) => {
    try {
        const score = await db.getItem('settings', `score_${personaId}`);
        return score || 50; // Default to 50 to match useChatLogic
    } catch (e) {
        console.error(`Failed to get affection for ${personaId}`, e);
        return 50;
    }
};

export const addAffection = async (personaId, amount) => {
    try {
        const current = await getAffection(personaId);
        const updated = Math.max(0, Math.min(100, current + amount));
        await db.setItem('settings', `score_${personaId}`, updated);
        return updated;
    } catch (e) {
        console.error(`Failed to update affection for ${personaId}`, e);
        return 50;
    }
};

export const getEquippedOutfit = async (personaId) => {
    try {
        return await db.getItem('wardrobe', `equipped_${personaId}`);
    } catch (e) {
        console.error(`Failed to get equipped outfit for ${personaId}`, e);
        return null;
    }
};

export const setEquippedOutfit = async (personaId, outfitId) => {
    try {
        await db.setItem('wardrobe', `equipped_${personaId}`, outfitId);
        return true;
    } catch (e) {
        console.error(`Failed to set equipped outfit for ${personaId}`, e);
        return false;
    }
};
