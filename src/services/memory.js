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
