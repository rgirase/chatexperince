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
        keywords: ['bus', 'sleeper', 'coach', 'travel', 'road', 'highway'],
        hotspots: [
            { id: 'curtains', x: '15%', y: '40%', label: 'Close the curtains', action: 'draws the small floral curtains of the berth, creating a private pocket of darkness' },
            { id: 'water', x: '80%', y: '70%', label: 'Offer water', action: 'hands her a chilled bottle of water, our fingers brushing for a moment' },
            { id: 'pillow', x: '40%', y: '80%', label: 'Adjust pillow', action: 'reaches out to adjust the thin sleeper bus pillow behind her head' }
        ]
    },
    'night_club': {
        id: 'night_club',
        name: 'VIP Night Club',
        background: 'https://images.unsplash.com/photo-1514525253361-bee8718a7439?auto=format&fit=crop&q=80&w=2070',
        effects: ['club-pulse'],
        overlayColor: 'rgba(60, 0, 80, 0.6)',
        keywords: ['club', 'nightclub', 'dance', 'party', 'bar', 'drink', 'music'],
        hotspots: [
            { id: 'drink', x: '70%', y: '60%', label: 'Order a cocktail', action: 'signals the waiter to bring another round of strong cocktails' },
            { id: 'speakers', x: '20%', y: '30%', label: 'Lean closer', action: 'leans in close to her ear to speak over the thumping bass of the club' },
            { id: 'couch', x: '50%', y: '75%', label: 'Pat the seat', action: 'pats the plush velvet couch next to me, inviting her to sit closer' }
        ]
    },
    'bridal_suite': {
        id: 'bridal_suite',
        name: 'Bridal Suite',
        background: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=2070', // Warm, romantic interior
        effects: ['ambient-glow'],
        overlayColor: 'rgba(80, 40, 0, 0.3)',
        keywords: ['bedroom', 'bridal', 'suite', 'room', 'bed', 'wedding', 'night'],
        hotspots: [
            { id: 'henna', x: '30%', y: '65%', label: 'Touch her hands', action: 'reaches out to gently trace the intricate henna patterns on her palms' },
            { id: 'mirror', x: '10%', y: '40%', label: 'Look in mirror', action: 'gestures toward the large ornate mirror, admiring the way she looks in her bridal attire' },
            { id: 'lamp', x: '90%', y: '50%', label: 'Dim the lights', action: 'reaches for the bedside lamp to dim the warm golden glow of the room' }
        ]
    },
    'default': {
        id: 'default',
        name: 'Generic Atmosphere',
        background: null, // Falls back to the standard radial gradients
        effects: ['slow-drift'],
        overlayColor: 'rgba(0,0,0,0)',
        keywords: [],
        hotspots: []
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
