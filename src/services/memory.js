/**
 * Service to manage long-term character milestones and memories.
 */

export const saveMilestone = (personaId, milestone) => {
    const memories = getMemories(personaId);
    const updated = [...memories, {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        content: milestone
    }];
    localStorage.setItem(`milestones_${personaId}`, JSON.stringify(updated));
    return updated;
};

export const getMemories = (personaId) => {
    try {
        const saved = localStorage.getItem(`milestones_${personaId}`);
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        console.error(`Failed to parse memories for ${personaId}`, e);
        return [];
    }
};

export const clearMemories = (personaId) => {
    localStorage.removeItem(`milestones_${personaId}`);
};

export const deleteMilestone = (personaId, milestoneId) => {
    const memories = getMemories(personaId);
    const updated = memories.filter(m => m.id !== milestoneId);
    localStorage.setItem(`milestones_${personaId}`, JSON.stringify(updated));
    return updated;
};

export const deleteDiaryEntry = (personaId, entryId) => {
    try {
        const key = `diaries_${personaId}`;
        const diaries = JSON.parse(localStorage.getItem(key) || '[]');
        const updated = diaries.filter(d => d.id !== entryId);
        localStorage.setItem(key, JSON.stringify(updated));
        return updated;
    } catch (e) {
        console.error("Failed to delete diary entry", e);
        return [];
    }
};
