/**
 * LocationService
 * Manages character positions and provides associated background assets.
 */

export const LOCATIONS = {
    HOME: {
        id: 'home',
        name: 'Home',
        backgrounds: {
            morning: '/assets/backgrounds/home_morning.jpg',
            afternoon: '/assets/backgrounds/home_afternoon.jpg',
            evening: '/assets/backgrounds/home_evening.jpg',
            night: '/assets/backgrounds/home_night.jpg'
        }
    },
    OFFICE: {
        id: 'office',
        name: 'Office',
        backgrounds: {
            day: '/assets/backgrounds/office_day.jpg',
            night: '/assets/backgrounds/office_night.jpg'
        }
    },
    OUTDOORS: {
        id: 'outdoors',
        name: 'Outdoors',
        backgrounds: {
            sunny: '/assets/backgrounds/park_sunny.jpg',
            rainy: '/assets/backgrounds/park_rainy.jpg',
            night: '/assets/backgrounds/park_night.jpg'
        }
    },
    VIP_LOUNGE: {
        id: 'vip_lounge',
        name: 'VIP Lounge',
        backgrounds: {
            default: '/assets/backgrounds/vip_lounge.jpg'
        }
    }
};

class LocationService {
    constructor() {
        this.characterLocations = {}; // characterId -> locationId
    }

    setLocation(characterId, locationId) {
        if (LOCATIONS[locationId]) {
            this.characterLocations[characterId] = locationId;
            localStorage.setItem(`location_${characterId}`, locationId);
        }
    }

    getLocation(characterId) {
        return this.characterLocations[characterId] || localStorage.getItem(`location_${characterId}`) || 'HOME';
    }

    getTimeOfDay() {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 17) return 'afternoon';
        if (hour >= 17 && hour < 21) return 'evening';
        return 'night';
    }

    getBackground(characterId, timeOfDay) {
        const t = timeOfDay || this.getTimeOfDay();
        const locationId = this.getLocation(characterId);
        const location = LOCATIONS[locationId] || LOCATIONS.HOME;
        
        // Return time-specific background or default
        return location.backgrounds[t] || location.backgrounds.default || Object.values(location.backgrounds)[0];
    }
}

export const locationService = new LocationService();
