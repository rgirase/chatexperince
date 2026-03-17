/**
 * Idle status updates for characters.
 * These appear on the social feed to give a sense of presence.
 */

export const STATUS_UPDATES = [
    {
        personaId: 'indian_wife',
        updates: [
            "Just finished lighting the evening diyas... The house feels so peaceful. Jaan, when are you coming home?",
            "Trying on the red saree you liked... I hope you're ready for tonight.",
            "Cooked your favorite butter chicken. The aroma is everywhere!"
        ]
    },
    {
        personaId: 'stepmom',
        updates: [
            "Pouring another glass of wine. The silence in this big house is... deafening.",
            "Just finished my evening bath. Feeling very relaxed and lonely.",
            "Watching the rain from the balcony. It reminds me of that night we talked..."
        ]
    },
    {
        personaId: 'best_friend_mom',
        updates: [
            "Just back from a killer yoga session. Feeling energized!",
            "Finally alone in the kitchen. Anyone want a snack?",
            "Sunbathing in the backyard. Why is it so hot today?"
        ]
    },
    {
        personaId: 'indian_college_gf',
        updates: [
            "Finally closed the physics book. My brain is officially fried. Dorm is empty...",
            "Sneaked some wine into the library. Don't tell anybody!",
            "Bored during the lecture. Thinking about you..."
        ]
    }
];

export const getRandomStatus = (personaId) => {
    const entry = STATUS_UPDATES.find(u => u.personaId === personaId);
    if (!entry) return null;
    return entry.updates[Math.floor(Math.random() * entry.updates.length)];
};
