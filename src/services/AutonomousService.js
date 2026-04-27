import { getCompletion, checkServerStatus } from './llm';
import * as db from './db';
import { personas as defaultPersonas } from '../data/personas';
import { generateImage } from './imageGenerator';

const STATIC_MOMENTS = [
    { status: "Just thinking about our last conversation... truly unforgettable.", visual: "contemplative, soft lighting, profile shot" },
    { status: "Getting ready for a long day. Wishing you were here to see this.", visual: "getting ready in mirror, morning light, domestic" },
    { status: "Sometimes I wonder what life would be like if we met sooner.", visual: "gazing out window, rain, mood lighting" },
    { status: "Found something today that reminded me of you. Can't wait to share.", visual: "holding small object, close up, smiling" },
    { status: "The city feels so empty tonight. Counting down the minutes.", visual: "city lights background, balcony, night" },
    { status: "Taking some time for myself, but you're still on my mind.", visual: "relaxing, cozy environment, soft focus" },
    { status: "Listening to that song you mentioned. I think I finally get it.", visual: "wearing headphones, closed eyes, artistic" }
];

/**
 * AutonomousService: Simulates "Off-screen" lives for personas.
 */
class AutonomousService {
    constructor() {
        this.isRunning = false;
        this.checkInterval = 1000 * 60 * 60; // Check every hour
    }

    async boot() {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log("[Autonomous] Simulation Engine Booted.");
        
        // Non-blocking initialization
        setTimeout(async () => {
            const rawEvents = await db.getAll('persona_events');
            const existing = (rawEvents || []).map(item => item.value || item);
            
            if (existing.length === 0) {
                console.log("[Autonomous] Seeding initial moments...");
                await this.seedInitialEvents();
            }

            this.runSimulation();
        }, 1000);
    }

    async seedInitialEvents() {
        const candidates = [...defaultPersonas].sort(() => 0.5 - Math.random()).slice(0, 5);
        for (const persona of candidates) {
            await this.generateMoment(persona);
        }
    }

    async runSimulation() {
        try {
            const lastRun = parseInt(localStorage.getItem('last_autonomous_run') || '0');
            const now = Date.now();

            if (now - lastRun > 1000 * 60 * 60 * 4) {
                await this.generateGlobalMoments();
                localStorage.setItem('last_autonomous_run', now.toString());
            }
        } catch (e) {
            console.error("[Autonomous] Simulation failed", e);
        } finally {
            setTimeout(() => this.runSimulation(), this.checkInterval);
        }
    }

    async generateGlobalMoments() {
        const candidates = [...defaultPersonas].sort(() => 0.5 - Math.random()).slice(0, 2);
        for (const persona of candidates) {
            await this.generateMoment(persona);
        }
    }

    async generateMoment(persona) {
        console.log(`[Autonomous] Creating moment for ${persona.name}...`);
        const charName = persona.name.split('(')[0].trim();
        
        const prompt = `[AUTONOMOUS_LIFE_SIMULATOR]
Character: ${persona.name}
Backstory: ${persona.tagline}
Task: Describe what ${charName} is doing right now while the user is away. 
Rules: Output ONLY JSON { "status": "Quote", "visual": "SDXL tags" }`;

        let momentData = null;
        try {
            const response = await getCompletion(prompt, 0.8);
            const jsonMatch = response.replace(/<think>[\s\S]*?<\/think>/gi, '').match(/\{[\s\S]*\}/);
            if (jsonMatch) momentData = JSON.parse(jsonMatch[0]);
        } catch (e) {
            const fallback = STATIC_MOMENTS[Math.floor(Math.random() * STATIC_MOMENTS.length)];
            momentData = { status: fallback.status, visual: fallback.visual };
        }

        if (momentData) {
            const uniqueSuffix = Math.random().toString(36).substring(2, 7);
            const eventId = `event_${persona.id}_${Date.now()}_${uniqueSuffix}`;
            
            const event = {
                id: eventId,
                personaId: persona.id,
                personaName: charName,
                status: momentData.status,
                visualPrompt: momentData.visual,
                timestamp: Date.now(),
                type: 'aura_moment',
                isMediaPending: true
            };

            await db.setItem('persona_events', eventId, event);
            
            // Trigger Autonomous Image Generation
            this.triggerAutonomousImaging(eventId, persona, momentData.visual);
        }
    }

    async triggerAutonomousImaging(eventId, persona, visualPrompt) {
        try {
            // Check if Image Engine is online
            const status = await checkServerStatus('comfy');
            if (!status.online) {
                console.warn("[Autonomous] Image engine offline. Using fallback profile pic.");
                await this.resolveToStatic(eventId, persona.image);
                return;
            }

            console.log(`[Autonomous] Generating unique image for ${eventId}...`);
            const b64 = await generateImage({
                persona,
                prompt: visualPrompt,
                aspectRatio: 'portrait'
            });

            if (b64) {
                const raw = await db.getItem('persona_events', eventId);
                const event = raw?.value || raw;
                await db.setItem('persona_events', eventId, {
                    ...event,
                    isMediaPending: false,
                    imageUrl: b64
                });
                console.log(`[Autonomous] Image resolved for ${eventId}`);
            }
        } catch (e) {
            console.error("[Autonomous] Imaging failed", e);
            await this.resolveToStatic(eventId, persona.image);
        }
    }

    async resolveToStatic(eventId, fallbackUrl) {
        const raw = await db.getItem('persona_events', eventId);
        const event = raw?.value || raw;
        if (event) {
            await db.setItem('persona_events', eventId, {
                ...event,
                isMediaPending: false,
                imageUrl: fallbackUrl
            });
        }
    }

    async getRecentEvents() {
        try {
            const rawEvents = await db.getAll('persona_events');
            const events = (rawEvents || []).map(item => item.value || item);
            return events.sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);
        } catch (e) { return []; }
    }
}

export const auraLife = new AutonomousService();
