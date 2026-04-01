/**
 * Scene definitions for the Live Backgrounds system.
 * Each scene includes a background image and a set of visual effect classes.
 */

export const SCENES = {
    'sleeper_bus': {
        id: 'sleeper_bus',
        name: 'Sleeper Bus (India)',
        background: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=2070',
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
        background: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=2070',
        effects: ['ambient-glow'],
        overlayColor: 'rgba(80, 40, 0, 0.3)',
        keywords: ['bedroom', 'bridal', 'suite', 'room', 'bed', 'wedding', 'night']
    },
    'ceo_office': {
        id: 'ceo_office',
        name: 'Executive CEO Suite',
        background: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2070',
        effects: ['city-glow'],
        overlayColor: 'rgba(0,0,0,0.4)',
        keywords: ['office', 'ceo', 'desk', 'corporate', 'meeting', 'work']
    },
    'private_jet': {
        id: 'private_jet',
        name: 'Private Jet Cabin',
        background: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&q=80&w=2070',
        effects: ['slow-drift'],
        overlayColor: 'rgba(255,255,255,0.05)',
        keywords: ['jet', 'plane', 'flight', 'cabin', 'airplane']
    },
    'luxury_yacht': {
        id: 'luxury_yacht',
        name: 'Luxury Yacht Deck',
        background: 'https://images.unsplash.com/photo-1567891777160-59913922f280?auto=format&fit=crop&q=80&w=2070',
        effects: ['yacht-sway'],
        overlayColor: 'rgba(0,100,200,0.1)',
        keywords: ['yacht', 'deck', 'boat', 'ocean', 'sea', 'sailing']
    },
    'penthouse_balcony': {
        id: 'penthouse_balcony',
        name: 'Penthouse Balcony',
        background: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=2070',
        effects: ['city-lights-flicker'],
        overlayColor: 'rgba(0,0,0,0.5)',
        keywords: ['penthouse', 'balcony', 'skyline', 'view', 'rooftop']
    },
    'jacuzzi_spa': {
        id: 'jacuzzi_spa',
        name: 'Private Jacuzzi Spa',
        background: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&q=80&w=2070',
        effects: ['steam-rising'],
        overlayColor: 'rgba(100,0,100,0.2)',
        keywords: ['jacuzzi', 'spa', 'hot tub', 'pool', 'massage', 'relax']
    },
    'luxury_cinema': {
        id: 'luxury_cinema',
        name: 'VIP Cinema Box',
        background: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=2070',
        effects: ['screen-flicker'],
        overlayColor: 'rgba(0,0,0,0.8)',
        keywords: ['cinema', 'theater', 'movie', 'show', 'opera']
    },
    'designer_boutique': {
        id: 'designer_boutique',
        name: 'Designer Boutique',
        background: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=2070',
        effects: ['ambient-glow'],
        overlayColor: 'rgba(255,255,255,0.1)',
        keywords: ['boutique', 'shop', 'fitting', 'dressing', 'clothes', 'luxury']
    },
    'uni_library': {
        id: 'uni_library',
        name: 'University Library',
        background: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=2070',
        effects: ['dust-motes'],
        overlayColor: 'rgba(50,30,0,0.4)',
        keywords: ['library', 'books', 'quiet', 'shelves', 'study', 'university']
    },
    'luxury_elevator': {
        id: 'luxury_elevator',
        name: 'Luxury Elevator',
        background: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=2070', // Reusing a high-end metal/glass view
        effects: ['fast-drift'],
        overlayColor: 'rgba(255,255,255,0.2)',
        keywords: ['elevator', 'lift', 'lobby']
    },
    'estate_stables': {
        id: 'estate_stables',
        name: 'Rustic Estate Stables',
        background: 'https://images.unsplash.com/photo-1553177595-462f4a3ea320?auto=format&fit=crop&q=80&w=2070',
        effects: ['sun-beams'],
        overlayColor: 'rgba(100,50,0,0.3)',
        keywords: ['stables', 'horse', 'estate', 'barn', 'rural']
    },
    'mountain_cabin': {
        id: 'mountain_cabin',
        name: 'Mountain Cabin',
        background: 'https://images.unsplash.com/photo-1518732714860-b62714ce0c59?auto=format&fit=crop&q=80&w=2070',
        effects: ['candle-flicker'],
        overlayColor: 'rgba(80,30,0,0.5)',
        keywords: ['cabin', 'mountain', 'snow', 'fireplace', 'woods', 'forest']
    },
    'traditional_kitchen': {
        id: 'traditional_kitchen',
        name: 'Traditional Kitchen',
        background: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=2070',
        effects: ['ambient-glow'],
        overlayColor: 'rgba(150,100,0,0.2)',
        keywords: ['kitchen', 'pantry', 'cooking', 'spice', 'home']
    },
    'moonbreak_terrace': {
        id: 'moonbreak_terrace',
        name: 'Moonlit Terrace',
        background: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=2070',
        effects: ['slow-drift'],
        overlayColor: 'rgba(0,0,50,0.6)',
        keywords: ['terrace', 'balcony', 'outdoor', 'stars', 'moonlight', 'roof']
    },
    'limousine': {
        id: 'limousine',
        name: 'Luxury Limousine',
        background: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=2070',
        effects: ['light-streaks'],
        overlayColor: 'rgba(0,0,0,0.7)',
        keywords: ['limo', 'limousine', 'car', 'chauffeur', 'drive']
    },
    'default': {
        id: 'default',
        name: 'Generic Atmosphere',
        background: null,
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
