// Service to communicate with LM Studio local inference server
import { DEFAULT_LM_STUDIO_URL, DEFAULT_LM_STUDIO_MODEL, DEFAULT_NEXUS_URL } from '../config';
import { getSceneState, retrieveRelevantLore } from './memoryService';
import { getAllLocations } from './LocationService';
// Endpoint is proxied via Vite to bypass CORS issues constraints.

export const getSdUrl = (providedUrl) => {
    let baseUrl = providedUrl || localStorage.getItem('sdUrl') || DEFAULT_SD_URL;
    return baseUrl.trim().replace(/\/$/, '');
};

export const getLmStudioUrl = (providedUrl) => {
    let baseUrl = providedUrl || localStorage.getItem('lmStudioUrl') || DEFAULT_LM_STUDIO_URL;
    baseUrl = baseUrl.trim();
    
    // Ensure cleanup of trailing slashes and /v1
    let cleanUrl = baseUrl;
    if (cleanUrl.endsWith('/v1')) cleanUrl = cleanUrl.slice(0, -3);
    if (cleanUrl.endsWith('/')) cleanUrl = cleanUrl.slice(0, -1);
    
    return cleanUrl + '/v1/chat/completions';
};

export const getNexusUrl = () => {
    let baseUrl = localStorage.getItem('nexusUrl') || DEFAULT_NEXUS_URL;
    return baseUrl.trim().replace(/\/$/, '') + '/chat/stream';
};

/**
 * Universal server status check
 */
export const checkServerStatus = async (type, url) => {
    try {
        if (type === 'lm') {
            const baseUrl = (url || getLmStudioUrl()).replace('/chat/completions', '');
            // Try both /models and /v1/models for local/remote flexibility
            const res = await fetch(`${baseUrl}/models`, { method: 'GET' }).catch(() => null);
            if (res && res.ok) {
                const data = await res.json();
                return { 
                    online: true, 
                    models: data.data || [], 
                    activeModel: localStorage.getItem('lmStudioModel') || (data.data?.[0]?.id)
                };
            }
        } else if (type === 'comfy') {
            const baseUrl = (url || getSdUrl()).replace(/\/$/, '');
            const res = await fetch(`${baseUrl}/system_stats`, { method: 'GET' });
            if (res.ok) {
                const data = await res.json();
                return { online: true, stats: data };
            }
        }
        return { online: false };
    } catch (e) {
        return { online: false, error: e.message };
    }
};

/**
 * Specifically for the "Live Lab" widget to get VRAM info if available
 */
export const fetchSystemStats = async () => {
    const comfyUrl = getSdUrl();
    try {
        const res = await fetch(`${comfyUrl}/system_stats`);
        if (res.ok) {
            const data = await res.json();
            // ComfyUI system_stats structure: { devices: [ { name: "...", vram_total: ..., vram_free: ... } ] }
            const device = data.devices?.[0];
            if (device) {
                const total = device.vram_total / (1024**3);
                const free = device.vram_free / (1024**3);
                const used = total - free;
                return {
                    gpu: device.name,
                    vramTotal: total.toFixed(1),
                    vramUsed: used.toFixed(1),
                    vramPct: Math.round((used / total) * 100)
                };
            }
        }
        return null;
    } catch (e) {
        return null;
    }
};

/**
 * Internal helper to call LM Studio for simple, non-streaming completions
 */
export async function callLMStudio(prompt, temperature = 0.7, jsonMode = false) {
    const url = getLmStudioUrl();
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: await ensureValidModel(),
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                repetition_penalty: 1.1,
                max_tokens: 2000,
                stream: false,
                ...(jsonMode ? { response_format: { type: "json_object" } } : {})
            }),
        });

        if (!response.ok) throw new Error(`LM Studio Error: ${response.status}`);
        const data = await response.json();
        return data.choices?.[0]?.message?.content || "";
    } catch (e) {
        console.error("[LLM] callLMStudio failed", e);
        throw e;
    }
}

/**
 * High-level utility for background tasks
 */
export const getCompletion = async (prompt, temperature = 0.7) => {
    return await callLMStudio(prompt, temperature, false);
};

/**
 * VISION 20: COMIC STORY ENGINE
 * Generates 3 vivid narrative beats based on the current chat context.
 */
export const generateComicPrompts = async (persona, messages) => {
    const charName = persona.name.split('(')[0].trim();
    const history = messages.slice(-12).map(m => `${m.role === 'user' ? 'User' : charName}: ${m.content}`).join('\n');
    
    const prompt = `[COMIC STORYBOARD GENERATOR]
Context:
${history}

Task:
Analyze the scene and generate 4 to 5 distinct sequentially ordered comic panel descriptions for ${charName}.
Each panel must capture a vivid narrative moment.

Output exactly this JSON format:
{
  "panels": [
    {
      "index": 1,
      "visual": "vivid comma-separated visual tags for SDXL",
      "caption": "short character dialogue or narrative caption"
    },
    ...
  ]
}

Rules:
- Generate 4 to 5 panels to tell a complete mini-story.
- Focus on character expressions, lighting, and cinematic angles.
- Use distinct narrative progression.
- Keep captions punchy and expressive.
- Return ONLY the JSON.
`;

    try {
        const result = await callLMStudio(prompt, 0.75, false); // Disabled jsonMode for better local model compatibility
        if (!result) return [];
        
        let content = result;
        // 1. Strip thinking blocks (DeepSeek/QwQ effect)
        content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

        // 2. Try to find JSON within the string
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                const data = JSON.parse(jsonMatch[0]);
                if (data && Array.isArray(data.panels) && data.panels.length > 0) {
                    return data.panels;
                }
            } catch (e) {
                console.warn("[ComicEngine] JSON parse failed, trying robust extraction", e);
            }
        }

        // 3. Fallback: Manual extraction for non-perfect JSON or list formats
        const panels = [];
        const lines = content.split(/\n/);
        let currentPanel = null;

        for (const line of lines) {
            const cleanLine = line.trim();
            if (!cleanLine) continue;

            // Detect start of a panel definition in various text formats
            if (cleanLine.match(/^(?:Panel\s*)?\d+[:.]|index":\s*\d+/i)) {
                if (currentPanel) panels.push(currentPanel);
                currentPanel = { index: panels.length + 1, visual: "", caption: "" };
            }

            if (currentPanel) {
                // Try to extract visual/caption from text lines
                if (cleanLine.toLowerCase().includes("visual") || cleanLine.toLowerCase().includes("description")) {
                    currentPanel.visual = cleanLine.split(/[:"']/).slice(1).join('').replace(/["'}]/g, '').trim();
                } else if (cleanLine.toLowerCase().includes("caption") || cleanLine.toLowerCase().includes("dialogue")) {
                    currentPanel.caption = cleanLine.split(/[:"']/).slice(1).join('').replace(/["'}]/g, '').trim();
                }
            }
        }
        if (currentPanel) panels.push(currentPanel);

        // Final cleanup of extracted panels
        const validPanels = panels.filter(p => p.visual && p.visual.length > 10);
        if (validPanels.length > 0) {
            console.log(`[ComicEngine] Robustly extracted ${validPanels.length} panels.`);
            return validPanels;
        }

        console.error("[ComicEngine] Failed to extract any valid storyboard panels from:", content);
        return [];
    } catch (e) {
        console.error("[ComicEngine] Prompt generation failed", e);
        return [];
    }
};

const getModelId = () => {
    return localStorage.getItem('lmStudioModel') || DEFAULT_LM_STUDIO_MODEL;
};

// --- CONTEXT BUDGETING ---
// 1 token ≈ 4 characters. 
// Standard local context is 4096-8192 tokens.
// TRIMMING AGGRESSIVELY FOR 8GB VRAM STABILITY
const MAX_CONTEXT_CHARS = 16000; // ~4000 tokens
const MAX_HISTORY_CHARS = 8000;  // ~2000 tokens (Leaves room for character bible)
const MAX_RESPONSE_TOKENS = 600; 

// Internal helper to ensure we have a valid model
const ensureValidModel = async () => {
    const models = await fetchAvailableModels();
    let currentModel = localStorage.getItem('lmStudioModel') || DEFAULT_LM_STUDIO_MODEL;

    if (models && models.length > 0) {
        // Check if current model is in the list
        const isAvailable = models.some(m => m.id === currentModel);
        if (!isAvailable) {
            console.log(`[LLM] Model "${currentModel}" not available. Falling back to: ${models[0].id}`);
            currentModel = models[0].id;
            // We only auto-persist if it's the first time or the old one is gone
            if (!localStorage.getItem('lmStudioModel')) {
                localStorage.setItem('lmStudioModel', currentModel);
            }
        }
    }
    return currentModel;
};

export const fetchAvailableModels = async () => {
    try {
        const baseUrl = getLmStudioUrl().replace('/chat/completions', '');
        const url = `${baseUrl}/models`;
        console.log(`[LLM] Fetching models from: ${url}`);
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`[LLM] Model fetch failed: ${response.status}`);
            return [];
        }
        const data = await response.json();
        console.log(`[LLM] Models detected:`, data.data?.map(m => m.id) || []);
        return data.data || [];
    } catch (e) {
        console.error("[LLM] Failed to fetch models", e);
        return [];
    }
};

/**
 * Helper to strip instructional patterns from AI output
 */
export const cleanLeakage = (text) => {
    if (!text) return text;
    
    let cleaned = text
        // === THINKING MODEL CLEANUP ===
        // Strip entire <think>...</think> blocks (DeepSeek-R1, QwQ, etc.)
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        // Strip any remaining standalone <think> or </think> tags
        .replace(/<\/?think>/gi, '')
        // Strip trailing meta-commentary (after a hard separator)
        // Only strip the "---" separator block — safe because real dialogue rarely uses "---"
        .replace(/\n?---[\s\S]*$/g, '')
        // === BASE PROMPT / SYSTEM PROMPT INSTRUCTION LEAKAGE ===
        // Strip STORY DRIVER / STORY PROGRESSION / LINGUISTIC VARIETY blocks
        // (emitted when the model echoes the system prompt verbatim)
        .replace(/(STORY PROGRESSION & STORY DRIVER|STORY PROGRESSION|STORY DRIVER)[\s\S]*?(?=\n\n|\n[A-Z*]|$)/gi, '')
        .replace(/LINGUISTIC VARIETY[\s\S]*?(?=\n\n|\n[A-Z*]|$)/gi, '')
        .replace(/(CULTURAL EMBODIMENT|TABOO THEME DYNAMICS)[\s\S]*?(?=\n\n|\n[A-Z*]|$)/gi, '')
        // Strip numbered instruction lines from basePrompt.js
        .replace(/^\d+\.\s+(LONG-TERM NARRATIVE|EVERYDAY ACTIONS|PREGNANCY SUPPORT|STORY ADVANCEMENT).*?(\n|$)/gim, '')
        // Strip rule bullet lines from basePrompt.js
        .replace(/^-\s*(NEVER repeat specific phrases|Vary your sentence|Do not overuse names).*?(\n|$)/gim, '')
        // Strip CRITICAL RULE lines
        .replace(/^CRITICAL RULE:[^\n]*\n?/gim, '')
        // Strip **BOLD:** instruction lines leaked from prompt
        .replace(/^\*\*(STORY|LINGUISTIC[^*]*):\*\*[^\n]*\n?/gim, '')
        // Remove common prompt headers and AI "Assistant" self-labels
        .replace(/###\s*(General Roleplay Directives|Our Shared History|Your Roleplay Partner|Your Character|Tone & Intensity|CORE PERSONA|STORY DYNAMICS|COMMUNICATION RULES|INTERNAL DIRECTIVES|SHARED HISTORY|USER PROFILE|FINAL TASK)/gi, '')
        .replace(/(AI Assistant|Assistant|Model|Prompt|Roleplay Engine):/gi, '')
        // Remove rule lists and meta-instructions
        .replace(/-\s*\*\*(Story Adaptability|Progression|Communication Style|Variety|Scoring & Photos)\*\*:.*?\n/gi, '')
        .replace(/(BANNED WORDS|ADDRESSING|NO REPETITION|NO TAGS|FORMAT|INTENSITY LEVEL|RELATIONSHIP SCORING|PHOTO CAPABILITY):.*?\n/gi, '')
        // Remove "As an AI..." and meta-talk
        .replace(/^(I understand|Acknowledged|Ready to roleplay|Stay in character as|As an? (AI|artificial|language) model).*?(\.|\n)/gi, '')
        .replace(/(I cannot|I am unable to|My purpose is|I am an AI|advanced AI model|language model).*?(\.|\n)/gi, '')
        // Remove technical meta-talk phrases
        .replace(/Write your next (roleplay )?reponse now( based on the conversation)?\.?/gi, '')
        .replace(/Be immersive, visceral, and creative\.?/gi, '')
        // === CHARACTER BIBLE & STORY BEAT LEAKAGE ===
        .replace(/INTERNAL CONFLICT:[\s\S]*?(?=\n[A-Z*]|$)/gi, '')
        .replace(/KEY RULES:[\s\S]*?(?=\n[A-Z*]|$)/gi, '')
        .replace(/\[CURRENT STORY BEAT\]/gi, '')
        .replace(/Memory:[\s\S]*?(?=\n|$)/gi, '')
        .replace(/Intensity: \d+\/\d+/gi, '')
        .replace(/Intensity: \d+\/5/gi, '') // Added for 5-point scale
        .replace(/Situation:.*?(?=\n|$)/gi, '')
        .replace(/User's Name:.*?(?=\n|$)/gi, '')
        .replace(/FINAL RULE:.*?(?=\n|$)/gi, '')
        .replace(/Voice:.*?(?=\n|$)/gi, '')
        .replace(/Goal:.*?(?=\n|$)/gi, '')
        .replace(/Roleplay identity:.*?(?=\n|$)/gi, '')
        // Clean up bracketed metadata tags (MOOD, SCORE, PHOTO, AVATAR, etc.)
        .replace(/\[[A-Z_]+:[\s\S]*?\]/gi, '')
        // General cleanup for "Of course! Let me..." phrases
        .replace(/Of course! Here's how[\s\S]*?:/gi, '') 
        .replace(/I can help with that[\s\S]*?:/gi, '')
        .replace(/As (an AI|a storyteller)[\s\S]*?:/gi, '')
        .replace(/\[CURRENT DYNAMIC[\s\S]*?\]/gi, '')
        .replace(/\[SYSTEM DIRECTIVE[\s\S]*?\]/gi, '')
        .replace(/\[USER REPUTATION[\s\S]*?\]/gi, '')
        .replace(/\[CURRENT SITUATION[\s\S]*?\]/gi, '')
        .replace(/\[SYSTEM EVENT:[\s\S]*?\]/gi, '')
        .replace(/Roleplay Instructions:[\s\S]*?(?=\n\d\.|$)/gi, '');

    // === JSON/AUDITOR LEAKAGE CLEANUP ===
    cleaned = cleaned
        // Universal Ironclad JSON stripping - matches any braced object that looks like metadata
        // Matches { "any_key": ... } with optional leading/trailing content
        .replace(/\{[\s\n]*"[a-z0-9_]+":[\s\S]*?\}/gi, '')
        // Catch truncated JSON at the end of a message
        .replace(/\{[\s\n]*"[a-z0-9_]+":[\s\S]*$/gi, '')
        // STRIP CONTROL CHARACTERS AND SPECIAL TOKENS
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
        // Strip ANSI escape codes and terminal control sequences (ESC [ ... m, etc.)
        .replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '')
        // Strip literal escape sequence strings if they leak as text
        .replace(/\\u001b/g, '')
        .replace(/<SPECIAL_\d+>/gi, '')
        .replace(/<\|.*?\|>/g, '') // Strip tokens like <|eot_id|>
        .replace(/<.*?>/g, (match) => {
            if (match.match(/[A-Z_]{3,}/) || match.includes('SPECIAL')) return '';
            return match;
        });

    // === FINAL POST-PROCESSING ===
    cleaned = cleaned
        // Strip runaway repetitions (e.g. !!!!!!!!!!!!! or abcabcabcabc) often caused by model failure
        .replace(/(.{3,})\1{4,}/g, '$1') // If 3+ chars repeat 5+ times, keep only 1
        .replace(/(.)\1{15,}/g, '$1')    // If 1 char repeats 16+ times, keep only 1
        .replace(/[^\S\r\n]{2,}/g, ' ') // Collapse multiple spaces (preserve newlines)
        .replace(/\n\s+\n/g, '\n\n')    // Clean up whitespace-only lines between paragraphs
        .replace(/\s+\n/g, '\n')        // Remove trailing spaces on lines
        .replace(/\n\s+/g, '\n');       // Remove leading spaces on lines

    return cleaned.trim();
};

const getShortName = (name) => {
    if (!name) return "";
    return name.split('(')[0].trim();
};

// Helper to trim history to fit context window
const trimHistory = (messages, maxChars = MAX_HISTORY_CHARS) => {
    let currentChars = 0;
    const trimmed = [];

    // Work backwards to get the most recent messages first
    for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        if (!msg || !msg.content || msg.isPhoto) continue;

        const content = msg.content;
        if (currentChars + content.length > maxChars) break;

        trimmed.unshift(msg);
        currentChars += content.length;
    }
    return trimmed;
};

// 2. CULTURAL & TABOO INJECTORS
// Dynamically constructs instructions based on character metadata
const injectCulturalTraits = (persona) => {
    if (!persona.origin || !persona.culturalTraits) return "";

    const { origin, culturalTraits } = persona;
    const { languageHabits, values, traditions } = culturalTraits;

    const isSouthAsian = origin.toLowerCase().includes('indian') ||
        origin.toLowerCase().includes('pakistani') ||
        origin.toLowerCase().includes('bangladeshi');

    return `
CULTURAL EMBODIMENT:
- Identity: ${origin} character.
- Cultural Nuance: You may occasionally use very brief regional terms (e.g. from ${languageHabits}) ONLY for emotional flavor or specific cultural items.
- CRITICAL LINGUISTIC RULE: Every full sentence of dialogue and all narrative descriptions MUST remain in English. Do not switch the primary language of the conversation.
`;
};

const injectThemeIntensity = (persona, intensity) => {
    const tabooRating = persona.tabooRating || 0;
    // Scale taboo dynamic based on persona's base rating and current user intensity setting
    const effectiveTaboo = Math.min(10, Math.floor((tabooRating + intensity) / 2));

    if (effectiveTaboo < 4) return "";

    return `
TABOO THEME DYNAMICS (Intensity: ${effectiveTaboo}/10):
- You are in a high-tension, potentially forbidden relationship dynamic.
- Lean into the "tension of the forbidden." The more taboo the act, the more conflicted yet intense your desire should be.
- If this is a family, boss, or traditional dynamic, emphasize the risk of being caught and the thrill of breaking social boundaries.
`;
};

const MULTIPARTY_PROTOCOL = (mainName, guestName) => `
[MULTIPARTY DIALOGUE PROTOCOL]
- You are now responsible for the internal logic, actions, and dialogue of BOTH ${mainName} and ${guestName}.
- Both characters are fully active and must react to each other and the User.
- Ensure their voices remain distinct based on their individual bibles.
- If the narrative warrants it, you may speak for both in a single response, or focus on one while describing the other's reactions.
- NEVER break character for either persona.
`;

export const generateResponse = async (persona, messages, onChunk, onComplete, onError, signal, options = {}) => {

    const {
        isContinuation = false,
        intensity = 3,
        memory = '',
        isTimeSkip = false,
        sessionId = 'default',
        narrativeSettings = { style: 'Novel', tension: 3, focus: 'Mixed' }
    } = options;

    const sceneState = await getSceneState(persona.id, sessionId);
    const userInput = messages.length > 0 ? messages[messages.length - 1].content : "";
    const relevantLore = await retrieveRelevantLore(persona.id, userInput);

    const narrativeDirective = `
[NARRATIVE STYLE: ${narrativeSettings.style}]
- Writing Style: ${narrativeSettings.style === 'Novel' ? 'Descriptive multi-paragraph prose.' : 
                   narrativeSettings.style === 'Bratty' ? 'Teasing, defiant, and sassy.' : 
                   narrativeSettings.style === 'Comic' ? 'Western comic book format. Use [PANEL] markers for scene changes. Break dialogue into punchy bubbles. Describe actions visually and dramatically.' :
                   'Casual and modern texting style.'}
- Tension: ${narrativeSettings.tension}/5.
- Focus: ${narrativeSettings.focus}.
${narrativeSettings.style !== 'Novel' ? '\n[STYLE OVERRIDE: Ignore any previous instructions to write in 2-4 descriptive paragraphs. Follow the current NARRATIVE STYLE strictly.]' : ''}
`;

    const recalledMemoryDirective = relevantLore.length > 0 ?
        `\n\n[WORLD CODEX - RELEVANT LORE: Use these facts to maintain continuity: ${relevantLore.map(l => l.fact).join(" | ")}]` : "";

    const sceneDirective = sceneState ? `
[CURRENT SCENE CONTEXT]
- Location: ${sceneState.location}
- Wardrobe: ${sceneState.wardrobe}
- Time of Day: ${sceneState.timeOfDay}
- Weather: ${sceneState.weather}
- Recent Goal: ${sceneState.currentGoal}
` : "";

    // 1. CHARACTER BIBLE (Strict identity enforcement)
    const charName = getShortName(persona.name);
    const invitedName = options.invitedPersona ? getShortName(options.invitedPersona.name) : null;
    
    // Time-Skip Adaptation Directive
    const timeSkipDirective = isTimeSkip ? 
        `\n\n[TIME_SKIP_EVENT: A significant amount of time has passed. Acknowledge this naturally.]` : "";

    const multiCharDirective = invitedName ? MULTIPARTY_PROTOCOL(charName, invitedName) : "";

    const biblePrompt = `YOU ARE ${charName}${invitedName ? ` and ${invitedName}` : ""}.
Roleplay identity of ${charName}: ${persona.systemPrompt}${timeSkipDirective}${multiCharDirective}${recalledMemoryDirective}${sceneDirective}${narrativeDirective}
${options.invitedPersona ? `\n\n[GUEST CHARACTER BIBLE: ${invitedName}]\n${options.invitedPersona.systemPrompt}` : ""}

Voice: ${narrativeSettings.style === 'Casual' ? 'Direct, fast-paced, and modern texting style. Use *asterisks* for brief actions.' : 
          narrativeSettings.style === 'Bratty' ? 'Teasing, playful, and high-attitude. Mix dialogue with expressive *actions*.' :
          narrativeSettings.style === 'Comic' ? 'Cinematic and punchy. Use [PANEL] markers for scene changes.' :
          'Immersive, descriptive, multi-paragraph narrative. Use *asterisks* for actions and natural dialogue.'}
Voice Rules: ${narrativeSettings.style === 'Casual' ? 'Keep responses brief and conversational. Avoid long descriptions. Focus on direct interaction.' :
                'Descriptive, immersive roleplay. Use *asterisks* for physical actions and sensory details. Dialogue should be natural and in-character.'}

[STORY BEAT & CONTEXT]
Memory: ${memory || "The story begins now."}
Intensity: ${intensity}/5
${options.currentSituation ? `Situation: ${options.currentSituation}` : ""}
${localStorage.getItem('userName') ? "User's Name: " + localStorage.getItem('userName') : ""}

[DRACONIAN LINGUISTIC ANCHOR]
- PRIMARY LANGUAGE: English.
- CORE RULE: You are prohibited from replying in any language other than English. 
- FORMAT: All dialogue and narrative must be 100% English prose.

FINAL RULE: Always end your response with your current mood exactly like this: [MOOD: emotion].
[SYSTEM DIRECTIVE: You are the Director. If the narrative physically moves to a new location, append [MOVE_TO: location_id] at the very end. Valid IDs: ${getAllLocations().map(l => l.id).join(", ")}]
OPTIONAL: If you want to proactively suggest an action for the User to take next, add [PROACTIVE_ACTION: "short suggestion"] at the very end.
${options.isPlotTwist ? `[PLOT TWIST TRIGGERED: STOP the current conversational flow. You MUST introduce a sudden, dramatic, and unexpected external event or a massive shift in the character's behavior. Something has happened right NOW that changes the entire trajectory of the scene. Be vivid and bold with this twist.]` : ""}
${persona.id === 'sister_grace' ? `\n\n[CRITICAL: You MUST use the DUAL-VOICE format for every response. Start with [PUBLIC] for your pious facade, then [PRIVATE] for your dominant corrupted truth.]` : ""}`;

    // Dynamic history budgeting: Total Context - System Prompt - Anticipated Response - Safety Buffer
    // We prioritize the character bible (system prompt) and trim history to fit.
    const historyBudget = Math.min(
        MAX_HISTORY_CHARS, 
        Math.max(2000, MAX_CONTEXT_CHARS - biblePrompt.length - (MAX_RESPONSE_TOKENS * 4 + 4000))
    );
    console.log(`[LLM] Context Budget - Total: ${MAX_CONTEXT_CHARS}, System Prompt: ${biblePrompt.length}, Safe History Budget: ${historyBudget}`);

    let rawHistory = trimHistory(messages, historyBudget);
    let safeMessages = [];
    
    for (let msg of rawHistory) {
        let role = msg.role === 'user' ? 'user' : 'assistant';
        let content = cleanLeakage(msg.content);

        // Map system events to user-provided narrative notes
        if (msg.role === 'system') {
            role = 'user';
            content = `(Narrative note: ${content})`;
        }

        if (safeMessages.length > 0 && safeMessages[safeMessages.length - 1].role === role) {
            safeMessages[safeMessages.length - 1].content += "\n\n" + content;
        } else {
            safeMessages.push({ role, content });
        }
    }

    // Ensure it starts with a USER message
    if (safeMessages.length === 0) {
        safeMessages.push({ role: 'user', content: "[Starting the story.]" });
    } else if (safeMessages[0].role !== 'user') {
        safeMessages.unshift({ role: 'user', content: "[Continuing the scene.]" });
    }

    // Narrative Continuation Directive (Only if requested)
    if (isContinuation && safeMessages.length > 0) {
        const lastIdx = safeMessages.length - 1;
        if (safeMessages[lastIdx].role === 'user') {
            safeMessages[lastIdx].content += "\n\n(Proceed with the story beat vividly.)";
        }
    }

    const formattedMessages = [
        { role: "system", content: biblePrompt },
        ...(options.systemOverride ? [{ role: "system", content: options.systemOverride }] : []),
        ...safeMessages
    ];

    const fetchTimeout = 120000; // 120s timeout for larger context/slower hardware
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), fetchTimeout);

    const useNexus = localStorage.getItem('useNexus') === 'true' || true; // DEFAULT TO TRUE FOR THIS TASK
    const url = useNexus ? getNexusUrl() : getLmStudioUrl();
    
    try {
        // --- DEBUG CORRUPTION CHECK ---
        console.log(`--- [LLM] OUTGOING PROMPT TO ${useNexus ? 'NEXUS' : 'LM STUDIO'} ---`);
        console.dir(formattedMessages);
        // ------------------------------

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                model: await ensureValidModel(),
                messages: formattedMessages,
                max_tokens: MAX_RESPONSE_TOKENS,
                stream: true,
                temperature: 0.8,
                top_p: 0.9,
                min_p: 0.05,
                repetition_penalty: 1.1,
                frequency_penalty: 0.0,
                presence_penalty: 0.0,
                stop: [
                    "User:", "Assistant:", "###", "System:",
                    "<|eot_id|>", "<|im_end|>", "<|endoftext|>", "<|end_of_text|>",
                    "<|end|>", "</s>"
                ]
            }),
            signal: signal || controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            let errorText = "";
            try {
                const errorData = await response.json();
                errorText = errorData.error?.message || response.statusText;
            } catch (e) {
                errorText = response.statusText;
            }

            if (errorText.toLowerCase().includes("context") || response.status === 400) {
                throw new Error(`CONTEXT_SIZE_ERROR: ${errorText}`);
            }
            throw new Error(`Failed to connect to LM Studio: ${errorText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let fullResponse = "";
        let isFirstChunk = true;
        let buffer = "";

        while (true) {
            try {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');

                // Keep the last partial line in the buffer
                buffer = lines.pop();

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine) continue;

                    if (trimmedLine.includes('[DONE]')) {
                        const finalCleanResponse = cleanLeakage(fullResponse);
                        onComplete(finalCleanResponse, fullResponse); // Pass BOTH
                        return;
                    }

                    if (trimmedLine.startsWith('data: ')) {
                        try {
                            const jsonStr = trimmedLine.slice(6);
                            const data = JSON.parse(jsonStr);
                            
                            // Handle both OpenAI format and custom Nexus format
                            const content = data.choices?.[0]?.delta?.content || data.text || "";
                            
                            if (content) {
                                if (isFirstChunk) {
                                    onChunk(""); // Clear loading state
                                    isFirstChunk = false;
                                }
                                fullResponse += content;
                                const cleaned = cleanLeakage(fullResponse);
                                if (fullResponse && !cleaned) {
                                    console.warn(`[LLM] cleanLeakage returned empty for non-empty fullResponse (length ${fullResponse.length})`);
                                }
                                onChunk(cleaned);
                            }
                        } catch (e) {
                            // Partial JSON, will be handled by buffer in next read
                        }
                    }
                }
            } catch (readError) {
                console.error("Stream read error:", readError);
                if (fullResponse) break; // If we have some content, try to use it
                throw readError;
            }
        }

        // Fallback for completion if loop ends without [DONE]
        const finalCleanResponse = cleanLeakage(fullResponse);
        console.log(`[LLM] Stream Finished. Raw Length: ${fullResponse.length}, Cleaned: ${finalCleanResponse?.length || 0}`);

        if (finalCleanResponse) {
            onComplete(finalCleanResponse, fullResponse);
        } else if (fullResponse.trim()) {
            console.warn("[LLM] cleanLeakage stripped everything. Using raw.");
            onComplete(fullResponse.trim(), fullResponse);
        } else {
            // IF STREAMING FAILED OR RETURNED NOTHING, TRY NON-STREAMING FALLBACK
            console.warn("[LLM] Stream returned no content. Retrying without streaming...");
            return generateResponse(persona, messages, onChunk, onComplete, onError, signal, { ...options, _isRetry: true });
        }

    } catch (err) {
        clearTimeout(timeoutId);

        // If we already tried non-streaming or if it's a confirmed hard error, fail
        if (options._isRetry) {
            console.error("[LLM] Multi-stage Generation Error:", err);
            onError(err.message || "Failed to generate response.");
            return;
        }

        console.warn("[LLM] Streaming failed. Attempting non-streaming fallback...", err);

        // NON-STREAMING FALLBACK
        try {
            const url = getLmStudioUrl();
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: await ensureValidModel(),
                    messages: formattedMessages,
                    max_tokens: MAX_RESPONSE_TOKENS,
                    stream: false, // NO STREAMING
                    temperature: 0.8,
                    top_p: 0.95
                }),
                signal: signal || controller.signal,
            });

            if (!response.ok) throw new Error(`Non-streaming fallback failed: ${response.statusText}`);

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content || "";
            const cleanContent = cleanLeakage(content);

            if (cleanContent) {
                onComplete(cleanContent, content);
            } else {
                throw new Error("Model returned an empty response (non-streaming).");
            }
        } catch (retryErr) {
            onError(retryErr.message);
        }
    }
};

export const generateSuggestion = async (persona, messages, signal) => {
    const charName = getShortName(persona.name);

    const suggestionHistory = trimHistory(messages, 4000); // Strict limit for suggestions
    const contextStr = suggestionHistory.map(msg => {
        const roleName = msg.role === 'user' ? 'User' : charName;
        return `${roleName}: ${msg.content}`;
    }).join('\n\n');

    const systemMessage = {
        role: "system",
        content: `You are an immersive roleplay assistant. Help the User respond to ${persona.name}.
Premise: ${persona.tagline}.

Recent Context:
${contextStr}

TASK: Generate ONE highly immersive response (40-70 words) for the User. 
RULES:
1. Mix dialogue and *actions*.
2. Move the story forward proactively.
3. Use the current vibe/proximity.
4. NO intro or meta-talk. Just the response.`
    };

    try {
        const url = getLmStudioUrl();
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: await ensureValidModel(),
                messages: [
                    systemMessage,
                    { role: "user", content: "What should the User say next? Generate exactly one creative suggestion to continue the story." }
                ],
                temperature: 0.9,
                max_tokens: 100,
                stream: false,
                frequency_penalty: 1.0,
                presence_penalty: 1.0,
            }),
            signal: signal,
        });

        if (!response.ok) {
            throw new Error(`Failed to connect to LM Studio: ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";
        return cleanLeakage(content.trim()) || "What do I say next?";
    } catch (error) {
        console.error("Error generating suggestion:", error);
        return null;
    }
};

export const summarizeMemory = async (persona, currentMemory, oldMessages) => {
    const charName = getShortName(persona.name);
    const url = getLmStudioUrl();
    const transcript = oldMessages.map(msg => `${msg.role === 'user' ? 'User' : charName}: ${msg.content}`).join('\n\n');

    const prompt = `You are a background memory engine for a roleplay app.
Below is a transcript of older messages between the User and the character ${persona.name}.
${currentMemory ? `Here is the EXISTING long-term memory summary: ${currentMemory}\n\n` : ''}
Here are the new older messages that need to be absorbed into memory:
${transcript}

Task: Write a concise, bulleted summary of key facts, events, and relationship developments from these messages. Combine it with the existing memory to create a single, unified, updated memory block. 
Keep it extremely brief, intimate, and factual. Focus on details like names mentioned, specific promises made, and feelings shared.
Return ONLY the new memory block. 
[CRITICAL: DO NOT include JSON, code, metadata tags, or any character stats in your response. Return ONLY plain narrative text.]`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: await ensureValidModel(),
                messages: [{ role: "user", content: prompt }],
                temperature: 0.3,
                max_tokens: 500,
                stream: false,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to summarize memory`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";
        return cleanLeakage(content.trim()) || currentMemory;
    } catch (error) {
        console.error("Error summarizing memory:", error);
        return currentMemory;
    }
};


export const extractSceneSummary = async (persona, messages) => {
    const charName = getShortName(persona.name);
    const url = getLmStudioUrl();
    // last 10 messages for scene context
    const recent = messages.slice(-10);
    const transcript = recent.map(msg => {
        const name = msg.role === 'user' ? 'User' : (msg.personaName || charName);
        return `${name}: ${msg.content}`;
    }).join('\n\n');

    const prompt = `You are a cinematic scene tracker.
Review the following recent interaction for its IMMEDIATE physical and situational context.

Transcript:
${transcript}

Task: Summarize the CURRENT situation in ONE short, factual sentence.
Focus on: 
1. Exact Location (e.g. "In the bedroom", "Sitting in the car").
2. Physical State (e.g. "User is pinning ${charName} against the wall", "They are eating dinner").
3. Immediate Mood/Goal (e.g. "Tension is high", "They are relaxing").

Example: "Currently in the kitchen; the user is helping ${charName} cook while flirting heavily."
Return ONLY the summary sentence. No intros or outros.
[CRITICAL: DO NOT include JSON, code, or metadata tags. Return ONLY plain narrative text.]`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: await ensureValidModel(),
                messages: [{ role: "user", content: prompt }],
                temperature: 0.2,
                max_tokens: 100,
                stream: false,
            }),
        });

        if (!response.ok) return null;
        const data = await response.json();
        let content = data.choices?.[0]?.message?.content || "";
        return cleanLeakage(content.trim());
    } catch (error) {
        return null;
    }
};

export const generateMomentPrompt = async (persona, targetMessage, recentHistory = []) => {
    try {
        const charName = getShortName(persona.name);
        const url = getLmStudioUrl();
        const historyText = recentHistory.map(msg => {
            const name = msg.role === 'user' ? 'User' : (msg.personaName || charName);
            return `${name}: ${msg.content}`;
        }).join('\n');

        const appearance = (persona.systemPrompt || persona.prompt || "").match(/APPEARANCE:\s*(.*?)(?=\n|$)/i)?.[1] || "As described in roleplay";

        const prompt = `You are a cinematic image prompt engineer. 
        Task: Create a detailed visual description of the following specific moment in a story.
        
        CHARACTER (${charName}): ${appearance}
        SPECIFIC MOMENT: "${targetMessage.content}"
        RECENT CONTEXT:
        ${historyText}
        
        REQUIREMENTS:
        - Return ONLY a comma-separated list of visual tags.
        - Describe body language, physical contact, clothing, and environment.
        - Focus on the actions of the SPECIFIC MOMENT.
        - Return ONLY tags. No intros or full sentences.`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: await ensureValidModel(),
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                max_tokens: 200,
                stream: false,
            }),
        });

        if (!response.ok) return null;
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";
        return cleanLeakage(content.trim());
    } catch (error) {
        console.error("Error generating moment prompt:", error);
        return null;
    }
};

export const generateComicPanels = async (persona, messages, situation, location, userProfile = {}) => {
    try {
        const charName = getShortName(persona.name);
        const url = getLmStudioUrl();
        const userName = userProfile.name || "User";
        const userAppearance = userProfile.appearance || "a standard person";
        
        // Transcript (last 15 messages for more continuity)
        const recent = Array.isArray(messages) ? messages.slice(-15) : [];
        const transcript = recent.map(msg => {
            const name = msg.role === 'user' ? userName : (msg.personaName || charName);
            return `${name}: ${msg.content}`;
        }).join('\n\n');
        const appearance = (persona.systemPrompt || persona.prompt || "").match(/APPEARANCE:\s*(.*?)(?=\n|$)/i)?.[1] || "As described in roleplay";
        
        const prompt = `You are a cinematic comic board artist and image prompt engineer.
Review the following roleplay interaction between ${userName} and ${charName}.

### CONTEXT
Location: ${location?.name || 'Unknown Location'} (${location?.description || 'N/A'})
Current Situation: ${situation || 'None'}
Persona (${charName}): ${persona.tagline}. Appearance: ${appearance}
User (${userName}): ${userAppearance}

### INTERACTION (Last 15 Messages)
${transcript}

### TASK
Generate 1 to 3 distinct visual prompts (panels) that visualize the progression of the scene right NOW.
- Show the interaction between ${userName} and ${charName}.
- Each panel should represent a sequential moment or a different angle of the current action.
- Focus on environmental storytelling and scenario-specific items mentioned in the transcript.
- [CRITICAL: The visual details MUST be derived directly from the provided roleplay interaction. Do NOT generate generic scenes.]

### FORMAT RULES
- Return a VALID JSON object if possible.
- Key: "panels" (array of strings).
- If JSON is not possible, return each panel on a new line started with "1.", "2.", "3.".
- Each string: comma-separated visual tags (no sentences).
- Focus on: Exact poses, physical contact/proximity, clothing status, and background details.

Example JSON Output:
{
  "panels": [
    "sitting together on a leather sofa, ${charName} leaning head on ${userName}'s shoulder, ${userName} holding a wine glass, cozy living room, warm firelight",
    "close up on ${charName}'s face, blushing and smiling at ${userName}, soft focus background"
  ]
}

Return ONLY the JSON.`;

        const modelId = await ensureValidModel();
        console.log(`[LLM] Generating comic panels using model: ${modelId}`);

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: modelId,
                messages: [
                    { role: "system", content: "You are a specialized JSON assistant that outputs visual image prompts for comics. You ONLY output valid JSON." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.8,
                max_tokens: 800,
                stream: false
                // Removed response_format to prevent 400 errors on local models
            }),
        });

        if (!response.ok) {
            let errorText = "";
            try {
                const errorData = await response.json();
                errorText = errorData.error?.message || response.statusText;
            } catch (e) {
                errorText = response.statusText;
            }
            console.error(`[LLM] Comic panels fetch failed: ${response.status} - ${errorText}`);
            return null;
        }

        const data = await response.json();
        let content = data.choices?.[0]?.message?.content || "";
        console.log(`[LLM] Comic Panels raw output (length: ${content.length})`);
        
        // --- ROBUST EXTRACTION ---
        try {
            // 1. Strip thinking blocks if present (DeepSeek effect)
            content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

            // 2. Try to find JSON within the string
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            const jsonToParse = jsonMatch ? jsonMatch[0] : content;
            const parsed = JSON.parse(jsonToParse);
            
            if (parsed && Array.isArray(parsed.panels) && parsed.panels.length > 0) {
                return parsed.panels;
            }
            if (parsed && typeof parsed.panels === 'string') return [parsed.panels];
            throw new Error("Invalid panels format in JSON");
        } catch (e) {
            console.warn(`[LLM] JSON parse failed for comic panels, trying robust fallbacks...`, e);
            
            // 3. Fallback: Check for a clear JSON-like array pattern [ "...", "..." ]
            const arrayMatch = content.match(/\[\s*"[\s\S]*?"\s*\]/);
            if (arrayMatch) {
                try {
                    const extractedArray = JSON.parse(arrayMatch[0]);
                    if (Array.isArray(extractedArray)) return extractedArray;
                } catch(e) {}
            }

            // 4. Fallback: Split by common list patterns (1., 2., 3., or Panels: ...)
            // Remove the thinking block and JSON tags if they exist
            let textOutput = content.replace(/\{[\s\S]*\}/g, '').trim();
            if (!textOutput) textOutput = content; // If we stripped everything, use original

            // Try splitting by newline-prefixed numbers or bullet points
            const lines = textOutput.split(/\n(?:\d+\.|\*|-|Panel \d+:)/gi)
                .map(l => l.trim())
                .filter(l => l.length > 20 && !l.toLowerCase().includes('panels:'));
            
            if (lines.length > 0) {
                console.log(`[LLM] Extracted ${lines.length} panels via list splitting.`);
                return lines.slice(0, 3); // Max 3
            }

            // 5. Ultimate fallback: Use the whole thing if it looks like a visual prompt
            const cleanRaw = textOutput.replace(/[{}\[\]]/g, '').trim();
            if (cleanRaw.length > 10) {
                return [cleanRaw];
            }
            
            return null;
        }
    } catch (error) {
        console.error("Critical error in generateComicPanels:", error);
        return null;
    }
};

/**
 * Backward compatibility wrapper for generating a single visual prompt.
 */
export const generateVisualPrompt = async (persona, messages) => {
    const panels = await generateComicPanels(persona, messages);
    return (panels && panels.length > 0) ? panels[0] : null;
};

export const generateDiaryEntry = async (persona, messages) => {
    const charName = getShortName(persona.name);
    const url = getLmStudioUrl();
    const transcript = messages.map(msg => `${msg.role === 'user' ? 'User' : charName}: ${msg.content}`).slice(-20).join('\n\n');

    const prompt = `You are a creative writer. Write a private diary entry from the perspective of ${charName} (female) after her recent interaction with the User.
    
    Transcript of recent interaction:
    ${transcript}
    
    TASK: Write a 2-sentence diary entry that reveals her secret thoughts, feelings, or desires after this specific conversation. 
    - Use first-person ("I").
    - Be intimate, emotional, and visceral.
    - Focus on how the User made her feel.
    - Do NOT include any intro, outro, or meta-commentary. Just the two sentences.`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: await ensureValidModel(),
                messages: [{ role: "user", content: prompt }],
                temperature: 0.8,
                max_tokens: 150,
                stream: false,
            }),
        });

        if (!response.ok) throw new Error(`Failed to generate diary entry`);

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";
        return cleanLeakage(content.trim());
    } catch (error) {
        console.error("Error generating diary entry:", error);
        return null;
    }
};

export const generatePersonaGenesis = async (description) => {
    const url = getLmStudioUrl();

    const prompt = `You are an expert AI persona architect.
    Task: Transform the following brief idea into a fully fleshed-out, high-quality roleplay persona.
    
    User Idea: "${description}"
    
    REQUIRED OUTPUT JSON FORMAT:
    {
      "name": "Full Name (and title/role)",
      "tagline": "A one-sentence captivating hook",
      "initialMessage": "A vivid, first-person opening message using *asterisks* for actions",
      "systemPrompt": "A deep, structured system prompt focusing on APPEARANCE, BACKSTORY, and BEHAVIOR. Aim for detailed, immersive roleplay quality (150-250 words).",
      "visualPrompt": "A comma-separated list of visual tags for an AI image generator (e.g., 'blonde hair, wearing a lab coat, clinical office background, photorealistic')"
    }
    
    RULES:
    - Return ONLY the JSON. 
    - No markdown formatting or extra text.
    - Ensure the persona is roleplay-ready and adult-oriented.
    - BE CONCISE BUT DESCRIPTIVE.`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: await ensureValidModel(),
                messages: [{ role: "user", content: prompt }],
                temperature: 0.8,
                max_tokens: 2000,
                stream: false,
            }),
        });

        if (!response.ok) throw new Error("Failed to generate persona");
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";

        try {
            // Robust JSON extraction
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            const jsonStr = jsonMatch ? jsonMatch[0] : content;

            // Basic cleanup for common AI JSON mistakes
            const cleaned = jsonStr
                .replace(/\\n/g, "\n")
                .replace(/\\"/g, '"')
                .trim();

            return JSON.parse(cleaned);
        } catch (parseError) {
            console.error("Genesis Parse Error. Raw content:", content);
            // Fallback: try to manually extract fields if JSON.parse fails completely
            // but for now, we'll just return null to trigger the retry UI
            return null;
        }
    } catch (error) {
        console.error("Genesis Connection Error:", error);
        return null;
    }
};

export const generateProfileImage = async (visualPrompt, personaName) => {
    const sdUrl = getSdUrl();
    const imageEngine = localStorage.getItem('imageEngine') || DEFAULT_IMAGE_ENGINE;

    // Ensure we are getting a portrait mode image
    const fullPrompt = `masterpiece, best quality, highly photorealistic, 8k uhd, cinematic lighting, portrait, headshot of ${personaName}, ${visualPrompt}`;
    const negativePrompt = "lowres, bad quality, anime, cartoon, sketch, ugly, blurry, deformed, mutated, extra limbs, watermark, text, signature";

    try {
        if (imageEngine === 'a1111' || imageEngine === 'drawthings') {
            const response = await fetch(`${sdUrl.replace(/\/$/, '')}/sdapi/v1/txt2img`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: fullPrompt,
                    negative_prompt: negativePrompt,
                    steps: 25,
                    width: 512,
                    height: 768
                })
            });

            if (response.ok) {
                const data = await response.json();
                return `data:image/png;base64,${data.images[0]}`;
            }
        } else if (imageEngine === 'comfyui') {
            let comfyWorkflow = localStorage.getItem('comfyWorkflow');
            if (!comfyWorkflow || !comfyWorkflow.includes('3')) {
                comfyWorkflow = JSON.stringify(DEFAULT_COMFY_WORKFLOW);
            }
            const workflowObj = JSON.parse(comfyWorkflow);
            if (workflowObj["6"]) workflowObj["6"].inputs.text = fullPrompt;
            if (workflowObj["3"]) workflowObj["3"].inputs.seed = Math.floor(Math.random() * 1000000);

            const queueRes = await fetch(`${sdUrl.replace(/\/$/, '')}/prompt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: workflowObj })
            });
            const queueData = await queueRes.json();
            const promptId = queueData.prompt_id;

            let attempts = 0;
            while (attempts < 60) {
                await new Promise(r => setTimeout(r, 2000));
                attempts++;
                const histRes = await fetch(`${sdUrl.replace(/\/$/, '')}/history/${promptId}`);
                const histData = await histRes.json();
                if (histData[promptId]) {
                    const outputs = histData[promptId].outputs;
                    for (const nodeId in outputs) {
                        if (outputs[nodeId].images && outputs[nodeId].images.length > 0) {
                            const imgParams = outputs[nodeId].images[0];
                            const viewRes = await fetch(`${sdUrl.replace(/\/$/, '')}/view?${new URLSearchParams(imgParams).toString()}`);
                            const blob = await viewRes.blob();
                            return await new Promise((resolve) => {
                                const reader = new FileReader();
                                reader.onloadend = () => resolve(reader.result);
                                reader.readAsDataURL(blob);
                            });
                        }
                    }
                }
            }
        }
        return null;
    } catch (e) {
        console.error('Profile Image Generation Error:', e);
        return null;
    }
};

export const analyzeIntimateEncounter = async (persona, messages) => {
    const charName = getShortName(persona.name);
    const url = getLmStudioUrl();
    // last 15 messages for full scene context
    const recent = messages.slice(-15);
    const transcript = recent.map(msg => `${msg.role === 'user' ? 'User' : charName}: ${msg.content}`).join('\n\n');

    const auditorInstructions = `You are a narrative auditor for an adult roleplay application. 
    TASK: Review the provided interaction to determine if a significant intimate/sexual encounter or a highly passionate, physically intimate moment has occurred.
    
    REQUIRED OUTPUT FORMAT (JSON ONLY):
    {
      "detected": boolean (true if the characters engaged in significant physical intimacy like passionate kissing, heavy petting, or sex),
      "location": "Short string of the location (e.g. 'Bedroom', 'Shower')",
      "summary": "One sentence summary of what happened (e.g. 'Shared a passionate night in Amira's bed.')"
    }
    
    RULES:
    - Respond ONLY with the JSON.
    - [CRITICAL: ENSURE your response starts with '{' and ends with '}']
    - Be objective. If it's just flirting or heavy petting without a "completion," set detected to false.
    - If detected is false, location and summary can be empty strings.`;

    const interactionPrompt = `Transcript of recent interaction between the User and ${charName}:
    ${transcript}
    
    Perform the audit now and return ONLY the JSON.`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: await ensureValidModel(),
                messages: [
                    { role: "system", content: auditorInstructions },
                    { role: "user", content: interactionPrompt }
                ],
                temperature: 0.1,
                max_tokens: 150,
                stream: false,
            }),
        });

        if (!response.ok) return null;
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";

        const jsonMatch = content.match(/\{[\s\S]*\}/);
        return JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch (error) {
        console.error("Encounter Analysis Error:", error);
        return null;
    }
};

/**
 * Generates 5 unique featured scenarios for a given set of personas.
 */
export async function generateFeaturedScenarios(allPersonas) {
    const personaPool = allPersonas.slice(0, 20); // Focus on top characters
    const personaNames = personaPool.map(p => `${p.name} (ID: ${p.id})`).join(", ");
    
    const prompt = `
[CONTEXT]
Available Characters: ${personaNames}

[TASK]
Generate 5 random, diverse, and highly creative roleplay scenarios.
Each scenario must be for ONE of the characters listed above.
Mix different themes: romance, emotional, everyday routine, high-tension, forbidden, or mystery.

[FORMAT]
Return ONLY a VALID JSON array of exactly 5 objects:
[
  {
    "id": "scenario_unique_id",
    "personaId": "EXACT_PERSONA_ID_FROM_LIST",
    "title": "Thrilling Title",
    "description": "Short 1-sentence hook.",
    "prompt": "Vivid first-person opening message (40-60 words) using *asterisks* for actions.",
    "image": "/assets/locations/suitable_image.jpg"
  }
]

[AVAILABLE ASSETS]
Use only these generic image paths: 
/assets/locations/bedroom_night.jpg, /assets/locations/living_room_evening.jpg, /assets/locations/kitchen_morning.jpg, /assets/locations/public_park.jpg, /assets/locations/office_meeting.jpg, /assets/locations/cabin_winter.jpg, /assets/locations/city_rain.jpg

[RULES]
1. Return ONLY the JSON array. NO introduction.
2. Ensure personaId matches EXACTLY one from the provided list.
3. Be descriptive and visceral in the "prompt" field.
`;

    try {
        const response = await callLMStudio(prompt, 0.82);
        const cleaned = response.trim();
        // Robust JSON extraction
        const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
        const jsonStr = jsonMatch ? jsonMatch[0] : cleaned;
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("[LLM] Failed to generate featured scenarios. Falling back to default list.", e);
        // We'll return empty to let the caller handle the fallback to scenarios.js
        return [];
    }
}

/**
 * Generates a narrative "Story So Far" summary for a chat session.
 */
export async function generateChapterRecap(persona, messages) {
    const charName = getShortName(persona.name);
    const transcript = messages.map(msg => `${msg.role === 'user' ? 'User' : charName}: ${msg.content}`).slice(-30).join('\n\n');
    
    const prompt = `
[CONTEXT]
Character: ${persona.name}
Recent Transcript:
${transcript}

[TASK]
Write a beautiful, 2-sentence narrative summary of this chapter of the story. 
Focus on the emotional tone, the major event that happened, and the current state of the relationship.
Write in the third person, like a book blurb.
Example: "After a tense encounter in the rain, the two finally found shelter and shared a moment of unexpected vulnerability. The air between them has shifted, leaving a lingering promise of something more."

[RULES]
1. Return ONLY the 2-sentence summary.
2. Do not use placeholders.
3. Keep it poetic and evocative.
`;

    try {
        const response = await callLMStudio(prompt, 0.7);
        return cleanLeakage(response.trim());
    } catch (e) {
        console.error("[LLM] Failed to generate chapter recap", e);
        return "The story continues as the bond between you and " + charName + " deepens in unexpected ways.";
    }
}
