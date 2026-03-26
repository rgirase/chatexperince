/**
 * LocationService manages the available roleplay environments.
 * Each location has a name, a background image, and a 'situation' prompt for the AI.
 */

export const LOCATIONS = {
    'bedroom_dim': {
        name: 'Dimly Lit Bedroom',
        mood: 'Intimate & Quiet',
        sensory: 'Soft shadows & warm light',
        image: '/assets/locations/bedroom_dim.jpg',
        keywords: ['bedroom', 'bed', 'sheets', 'pillow', 'under the covers', 'sleep'],
        situation: 'Inside a dimly lit bedroom. The atmosphere is quiet, intimate, and focused entirely on the space between you two.'
    },
    'living_room_evening': {
        name: 'Living Room (Evening)',
        mood: 'Relaxed & Cozy',
        sensory: 'Warm lamplight & soft cushions',
        image: '/assets/locations/living_room_evening.jpg',
        keywords: ['living room', 'couch', 'sofa', 'television', 'tv', 'fireplace', 'lounge'],
        situation: 'A cozy living room in the evening. Soft lamplight creates a warm, relaxed environment for conversation or closeness.'
    },
    'kitchen_morning': {
        name: 'Kitchen (Morning)',
        mood: 'Fresh & Bright',
        sensory: 'Coffee aroma & sunlight',
        image: '/assets/locations/kitchen_morning.jpg',
        keywords: ['kitchen', 'breakfast', 'coffee', 'cooking', 'counter', 'morning', 'fridge'],
        situation: 'A bright, sunlit kitchen in the morning. The smell of fresh coffee and the start of a new day define the mood.'
    },
    'kitchen_evening': {
        name: 'Kitchen (Evening)',
        mood: 'Domestic & Warm',
        sensory: 'Dinner prep & soft light',
        image: '/assets/locations/kitchen_evening.jpg',
        keywords: ['dinner', 'wine', 'cooking dinner', 'sink', 'kitchen counter'],
        situation: 'The kitchen at night. A more focused, intimate domesticity as the day winds down.'
    },
    'living_room_afternoon': {
        name: 'Living Room (Afternoon)',
        mood: 'Bright & Airy',
        sensory: 'Daylight & open space',
        image: '/assets/locations/living_room_afternoon.jpg',
        keywords: ['afternoon', 'daylight', 'sunlight', 'reading', 'window'],
        situation: 'The living room during a bright afternoon. The space feels open, energetic, and full of natural light.'
    },
    'steamy_shower': {
        name: 'Steamy Shower',
        mood: 'Sensual & Private',
        sensory: 'Hot steam & running water',
        image: '/assets/locations/steamy_shower.jpg',
        keywords: ['shower', 'bathroom', 'steam', 'water', 'shampoo', 'soap', 'naked', 'towel'],
        situation: 'Inside a hot, steamy shower. The sound of running water and the thick mist create a highly private and sensual environment.'
    },
    'public_park': {
        name: 'Public Park',
        mood: 'Open & Refreshing',
        sensory: 'Green grass & fresh breeze',
        image: '/assets/locations/public_park.jpg',
        keywords: ['park', 'grass', 'trees', 'walking', 'bench', 'outside', 'nature', 'sun'],
        situation: 'Out in a beautiful public park. The open air and natural surroundings provide a refreshing change of pace.'
    },
    'club_night': {
        name: 'Club Night',
        mood: 'Energetic & Pulsing',
        sensory: 'Neon lights & heavy bass',
        image: '/assets/locations/club_night.jpg',
        keywords: ['club', 'dance', 'music', 'bar', 'drinks', 'neon', 'party', 'crowd'],
        situation: 'In a pulsing nightclub. The music is loud, the lights are flashing, and the energy of the crowd is everywhere.'
    },
    'club_restroom': {
        name: 'Club Restroom',
        mood: 'Secretive & Urgent',
        sensory: 'Muffled music & cold tiles',
        image: '/assets/locations/club_restroom.jpg',
        keywords: ['club bathroom', 'stall', 'restroom', 'sink', 'mirror', 'muffled'],
        situation: 'Away from the noise in the club restroom. A clandestine, high-tension moment shared in secret.'
    },
    'restaurant': {
        name: 'Restaurant',
        mood: 'Elegant & Social',
        sensory: 'clinking glasses & soft chatter',
        image: '/assets/locations/restaurant.jpg',
        keywords: ['restaurant', 'dinner', 'table', 'menu', 'waiter', 'eating', 'wine', 'date'],
        situation: 'Seated at a table in an elegant restaurant. The atmosphere is sophisticated and perfect for a shared meal.'
    },
    'restaurant_restroom': {
        name: 'Restaurant Restroom',
        mood: 'Risky & Quiet',
        sensory: 'Clean scent & locked door',
        image: '/assets/locations/restaurant_restroom.jpg',
        keywords: ['restaurant bathroom', 'locked door', 'powder room'],
        situation: 'In the restaurant restroom. A brief escape from the public eye into a more personal, risky interaction.'
    },
    'suv_car': {
        name: 'SUV Car',
        mood: 'Mobile & Close',
        sensory: 'Leather scent & engine hum',
        image: '/assets/locations/suv_car.jpg',
        keywords: ['car', 'driving', 'seat', 'suv', 'dashboard', 'window', 'traffic', 'parking'],
        situation: 'Inside a spacious SUV. The confined space of the vehicle creates an unexpected sense of closeness while on the move.'
    },
    'cabin_summer': {
        name: 'Cabin (Summer)',
        mood: 'Rustic & Warm',
        sensory: 'Wood scent & lake breeze',
        image: '/assets/locations/cabin_summer.jpg',
        keywords: ['cabin', 'lake', 'woods', 'summer', 'dock', 'forest'],
        situation: 'A rustic wooden cabin during the summer. The sounds of the forest and the warmth of the season create a peaceful retreat.'
    },
    'cabin_winter': {
        name: 'Cabin (Winter)',
        mood: 'Cozy & Snow-bound',
        sensory: 'Crackling fire & cold air',
        image: '/assets/locations/cabin_winter.jpg',
        keywords: ['winter', 'snow', 'fireplace', 'blanket', 'cold', 'cabin'],
        situation: 'Snug inside a cabin in the middle of winter. A fire is crackling in the hearth as the snow falls outside.'
    },
    'balcony_river': {
        name: 'Balcony (River View)',
        mood: 'Scenic & Romantic',
        sensory: 'Rushing water & night air',
        image: '/assets/locations/balcony_river.jpg',
        keywords: ['balcony', 'river', 'view', 'railing', 'outside', 'waterfront'],
        situation: 'On a high balcony overlooking a wide, shimmering river. The view is breathtaking and the air is cool.'
    },
    'balcony_eiffel': {
        name: 'Balcony (Eiffel View)',
        mood: 'Iconic & Parisienne',
        sensory: 'City lights & distant hum',
        image: '/assets/locations/balcony_eiffel.jpg',
        keywords: ['paris', 'eiffel', 'tower', 'balcony', 'french', 'city lights'],
        situation: 'On a private balcony with a stunning, direct view of the illuminated Eiffel Tower in Paris.'
    },
    'ny_street': {
        name: 'New York Street',
        mood: 'Urban & Anonymous',
        sensory: 'City sirens & concrete',
        image: '/assets/locations/ny_street.jpg',
        keywords: ['new york', 'street', 'sidewalk', 'buildings', 'urban', 'city', 'taxi', 'alley'],
        situation: 'Walking along a quiet side street in New York City. The towering buildings and city energy surround you.'
    },
    'paris_street': {
        name: 'Paris Street',
        mood: 'Charming & Artistic',
        sensory: 'Cobblestones & cafe sounds',
        image: '/assets/locations/paris_street.jpg',
        keywords: ['paris', 'cobblestone', 'cafe', 'street', 'sidewalk', 'architecture'],
        situation: 'A charming, narrow street in Paris. Cobblestones underfoot and the romantic architecture create a magical vibe.'
    },
    'office_meeting': {
        name: 'Office Meeting Room',
        mood: 'Professional & Tense',
        sensory: 'Glass walls & boardroom table',
        image: '/assets/locations/office_meeting.jpg',
        keywords: ['meeting', 'office', 'boardroom', 'conference', 'table', 'presentation', 'work'],
        situation: 'In a modern office meeting room. The glass walls and professional setting hide an underlying personal tension.'
    },
    'office_boss': {
        name: 'Boss Cabin',
        mood: 'Authoritative & Private',
        sensory: 'Leather chair & private desk',
        image: '/assets/locations/office_boss.jpg',
        keywords: ['boss', 'office', 'desk', 'cabin', 'private office', 'leather chair', 'work'],
        situation: 'Inside the private office of the boss. Behind the heavy door, the power dynamic shifts into something more personal.'
    }
};

export const getLocation = (id) => LOCATIONS[id] || LOCATIONS['bedroom_dim'];

export const getAllLocations = () => Object.entries(LOCATIONS).map(([id, data]) => ({ id, ...data }));
