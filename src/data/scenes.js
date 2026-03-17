/**
 * Scene definitions for the Live Backgrounds system.
 * Each scene includes a background image and a set of visual effect classes.
 */

export const SCENES = {
    'sleeper_bus': {
        id: 'sleeper_bus',
        name: 'Sleeper Bus (India)',
        background: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=2070', // High-quality bus interior/atmosphere
        effects: ['light-streaks', 'vibration'],
        overlayColor: 'rgba(0, 30, 60, 0.4)',
        keywords: ['bus', 'sleeper', 'coach', 'travel', 'road', 'highway']
    },
    'night_club': {
        id: 'night_club',
        name: 'VIP Night Club',
        background: 'https://images.unsplash.com/photo-1514525253361-bee8718a7439?auto=format&fit=crop&q=80&w=2070',
        effects: ['club-pulse'],
        overlayColor: 'rgba(60, 0, 80, 0.6)',
        keywords: ['club', 'nightclub', 'dance', 'party', 'bar', 'drink', 'music']
    },
    'bridal_suite': {
        id: 'bridal_suite',
        name: 'Bridal Suite',
        background: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=2070', // Warm, romantic interior
        effects: ['ambient-glow'],
        overlayColor: 'rgba(80, 40, 0, 0.3)',
        keywords: ['bedroom', 'bridal', 'suite', 'room', 'bed', 'wedding', 'night']
    },
    'default': {
        id: 'default',
        name: 'Generic Atmosphere',
        background: null, // Falls back to the standard radial gradients
        effects: ['slow-drift'],
        overlayColor: 'rgba(0,0,0,0)',
        keywords: []
    }
};

/**
 * Detects the most appropriate scene ID from a given text.
 */
export const detectSceneId = (text) => {
    if (!text) return 'default';
    const lowerText = text.toLowerCase();
    
    for (const [id, scene] of Object.entries(SCENES)) {
        if (id === 'default') continue;
        if (scene.keywords.some(kw => lowerText.includes(kw))) {
            return id;
        }
    }
    return null; // No change
};
