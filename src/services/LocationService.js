/**
 * LocationService manages the available roleplay environments.
 * Each location has a name, a background image, and a 'situation' prompt for the AI.
 */

export const LOCATIONS = {
    'kitchen_morning': {
        name: 'Kitchen',
        mood: 'Cozy Morning',
        sensory: 'Smell of coffee & sunlight',
        image: '/assets/locations/home_morning.jpg',
        situation: 'It is a bright morning in the kitchen. The sun is streaming through the windows, and the smell of fresh coffee is in the air.'
    },
    'living_room_night': {
        name: 'Living Room',
        mood: 'Quiet Evening',
        sensory: 'Soft lamplight & silence',
        image: '/assets/locations/home_night.jpg',
        situation: 'The house is quiet and dimly lit, with only the soft glow of the television and a few lamps. A cozy, intimate atmosphere.'
    },
    'poolside_day': {
        name: 'Poolside',
        mood: 'Sunny & Refreshing',
        sensory: 'Sparkling water & warm breeze',
        image: '/assets/locations/poolside_day.jpg',
        situation: 'Out by the pool on a hot, sunny day. The water is sparkling, and there is a gentle breeze.'
    },
    'bedroom_intimate': {
        name: 'Bedroom',
        mood: 'Deeply Intimate',
        sensory: 'Soft silk & warm shadows',
        image: '/assets/locations/bedroom_intimate.jpg',
        situation: 'Inside the private bedroom. The lighting is soft and warm, creating a very personal and focused environment.'
    },
    'office_late': {
        name: 'Home Office',
        mood: 'Late Night Focus',
        sensory: 'Desk lamp glow & solitude',
        image: '/assets/locations/office_late.jpg',
        situation: 'Late at night in the home office. A single desk lamp illuminates the workspace, surrounded by shadows and silence.'
    }
};

export const getLocation = (id) => LOCATIONS[id] || LOCATIONS['kitchen_morning'];

export const getAllLocations = () => Object.entries(LOCATIONS).map(([id, data]) => ({ id, ...data }));
