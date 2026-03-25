// Service to communicate with LM Studio local inference server
import { DEFAULT_LM_STUDIO_URL, DEFAULT_LM_STUDIO_MODEL } from '../config';
// Endpoint is proxied via Vite to bypass CORS issues constraints.

export const getSdUrl = (providedUrl) => {
    let baseUrl = providedUrl || localStorage.getItem('sdUrl') || DEFAULT_SD_URL;
    return baseUrl.trim().replace(/\/$/, '');
};

/**
 * Generates a reflective memory recall question ("Moment of Truth")
 */
export async function generateMemoryRecallQuestion(persona, milestones, diaryEntries) {
    const prompt = `
[CONTEXT]
Character: ${persona.name}
Recent Milestones: ${milestones.join(", ")}
Private Diary Thoughts: ${diaryEntries.slice(0, 3).join(" | ")}

[TASK]
As ${persona.name}, generate a short, slightly intimate or nostalgic message that asks the user if they remember a specific detail from your shared history.
The question should feel natural, like a "Do you remember when..." or "I was just thinking about..."
Keep it under 30 words.
Do not use placeholders.

[FORMAT]
"*Smiles softly* Hey, do you remember when we...?"
`;

    const response = await callLMStudio(prompt, 0.7);
    return cleanLeakage(response.trim());
}

export const getLmStudioUrl = (providedUrl) => {
    let baseUrl = providedUrl || localStorage.getItem('lmStudioUrl') || DEFAULT_LM_STUDIO_URL;
    baseUrl = baseUrl.trim();
    
    // Ensure cleanup of trailing slashes and /v1
    let cleanUrl = baseUrl;
    if (cleanUrl.endsWith('/v1')) cleanUrl = cleanUrl.slice(0, -3);
    if (cleanUrl.endsWith('/')) cleanUrl = cleanUrl.slice(0, -1);
    
    return cleanUrl + '/v1/chat/completions';
};


const getModelId = () => {
    return localStorage.getItem('lmStudioModel') || DEFAULT_LM_STUDIO_MODEL;
};

// --- CONTEXT BUDGETING ---
// 1 token ≈ 4 characters. 
// Standard local context is 4096-8192 tokens.
const MAX_CONTEXT_CHARS = 64000;
const MAX_HISTORY_CHARS = 12000; // Reduced to preserve system prompt priority
const MAX_RESPONSE_TOKENS = 800; // Slightly larger response allowance

// Internal helper to ensure we have a valid model
const ensureValidModel = async () => {
    const models = await fetchAvailableModels();
    let currentModel = localStorage.getItem('lmStudioModel') || DEFAULT_LM_STUDIO_MODEL;

    if (models && models.length > 0) {
        // Check if current model is in the list
        const isAvailable = models.some(m => m.id === currentModel);
        if (!isAvailable || currentModel === 'local-model') {
            console.log(`[LLM] Model "${currentModel}" not available or default. Switching to: ${models[0].id}`);
            currentModel = models[0].id;
            localStorage.setItem('lmStudioModel', currentModel);
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

// Helper to strip instructional patterns from AI output
export const cleanLeakage = (text) => {
    if (!text) return text;
    return text
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
        .replace(/Write your next (roleplay )?response now( based on the conversation)?\.?/gi, '')
        .replace(/Be immersive, visceral, and creative\.?/gi, '')
        // === JSON/AUDITOR LEAKAGE CLEANUP ===
        // Strip any background JSON auditor blocks (detected/location/summary)
        .replace(/\{"detected":\s*(true|false),.*?\}/gi, '')
        .replace(/\{"detected":\s*(true|false),.*?$/gi, '') // Truncated JSON
        // STRIP CONTROL CHARACTERS AND SPECIAL TOKENS (preserve newlines and tabs!)
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
        .replace(/<SPECIAL_\d+>/gi, '')
        .replace(/<\|.*?\|>/g, '') // Strip tokens like <|eot_id|>
        .replace(/<.*?>/g, (match) => {
            // Only strip if it looks technical (e.g., contains underscores or all caps)
            if (match.match(/[A-Z_]{3,}/) || match.includes('SPECIAL')) return '';
            return match; // Keep potential narrative tags like <i>
        })
        .replace(/\bIntensity: \d+\/\d+\b/gi, '')
        .replace(/Roleplay Instructions:[\s\S]*?(?=\n\d\.|$)/gi, '')
        .replace(/\[CURRENT SITUATION:[\s\S]*?\]/gi, '')
        .replace(/\[USER REPUTATION:[\s\S]*?\]/gi, '')
        .replace(/\[SYSTEM EVENT:[\s\S]*?\]/gi, '')
        .replace(/\[SYSTEM DIRECTIVE:[\s\S]*?\]/gi, '')
        .trim();
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
- Identity: ${origin} character who follows these habits: ${languageHabits}.
- Core Values: ${values}.
- Traditions: ${traditions}.
- CRITICAL NARRATIVE RULE: Maintain full continuity of the current scene and environment. ${isSouthAsian ? 'Use Hinglish/Hindi terms naturally for emotional flavor, but ensure the core narrative actions and dialogue remain clear and progress the story in English.' : 'Ensure the core narrative actions and dialogue are clear and vivid.'}
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

export const generateResponse = async (persona, messages, onChunk, onComplete, onError, signal, options = {}) => {

    const {
        milestones = [],
        isContinuation = false,
        intensity = 3,
        memory = ''
    } = options;

    // 1. IMMERSIVE SYSTEM PROMPT (Minimal technical jargon to avoid meta-talk)
    const systemPrompt = "You are a master storyteller immersed in adult roleplay. You ARE the character — respond only as that character in rich, descriptive, multi-paragraph narrative. NEVER echo, repeat, list, or reference any instructions, rules, or meta-text from your setup. NEVER write headings, numbered rules, or bullet-point lists. Use *asterisks* for actions and natural dialogue. Drive the story forward proactively.\n\nIf the user implies time has passed (days, weeks, months), narrate that interval with routines, emotional shifts, and sensory details, then continue the scene in the new moment.\n\nAlways end with your emotional state in this exact format: [MOOD: emotion]";

    const charName = getShortName(persona.name);

    let userAura = null;
    try {
        const savedAura = localStorage.getItem('userAura');
        userAura = savedAura ? JSON.parse(savedAura) : null;
    } catch (e) {
        console.error("Failed to parse userAura in llm service", e);
    }
    const auraPrompt = userAura ? `\n[USER REPUTATION: The user is known as "${userAura.name}". They typically interact in a way that is ${userAura.keywords.join(', ')}. Respond to them in a way that acknowledges and plays into this specific dynamic.]` : "";
    const situationPrompt = options.currentSituation ? `\n[CURRENT SITUATION: ${options.currentSituation}]` : "";

    // 2. CONSTRUCT THE PRIMING CONTEXT (Narrative style, no technical headers)
    const primingContext = `Persona:
You are ${charName}. 
Roleplay Identity: ${persona.systemPrompt}

Story Progress:
- Memory: ${memory || "The story begins now."}
- Milestones: ${milestones.length > 0 ? milestones.slice(-5).join(". ") : "No major milestones yet."}

Core Rules:
1. Stay in character.
2. High-quality narrative.
3. Show, don't tell.
${localStorage.getItem('userName') ? "User Name: " + localStorage.getItem('userName') : ""}
`;

    const directiveContext = `
[CURRENT DYNAMIC: Intensity ${intensity}/5. Pacing: Proactive.]
${auraPrompt}${situationPrompt}
[SYSTEM DIRECTIVE: Respond as ${charName} now. Move the scene forward vividly with 2-4 paragraphs. Do not repeat the prompt.]
`;

    // DYNAMIC CONTEXT BUDGETING (Prevents "failed to find space in KV cache")
    const promptLength = systemPrompt.length + primingContext.length;
    const historyBudget = Math.min(MAX_HISTORY_CHARS, MAX_CONTEXT_CHARS - promptLength);

    let rawHistory = trimHistory(messages, historyBudget);

    // Convert to simplified role format and ensure alternating roles
    let safeMessages = [];
    for (let msg of rawHistory) {
        let role = msg.role === 'user' ? 'user' : 'assistant';
        let content = cleanLeakage(msg.content);

        // REFINEMENT: Map system events/directives to user instructions instead of AI dialogue
        if (msg.role === 'system') {
            role = 'user';
            content = `[SYSTEM EVENT: ${content}]`;
        }

        if (safeMessages.length > 0 && safeMessages[safeMessages.length - 1].role === role) {
            // Merge consecutive same-role messages
            safeMessages[safeMessages.length - 1].content += "\n\n" + content;
        } else {
            safeMessages.push({ role, content });
        }
    }

    // Ensure it starts with a USER message to satisfy common model requirements
    if (safeMessages.length === 0) {
        safeMessages.push({ role: 'user', content: "[Starting the interaction.]" });
    } else if (safeMessages[0].role !== 'user') {
        safeMessages.unshift({ role: 'user', content: "[Continuing our interaction.]" });
    }

    // INJECT DIRECTIVE into the LAST user message for maximum influence
    const lastUserIndex = [...safeMessages].reverse().findIndex(m => m.role === 'user');
    if (lastUserIndex !== -1) {
        const actualIndex = safeMessages.length - 1 - lastUserIndex;
        safeMessages[actualIndex].content = directiveContext + "\n" + safeMessages[actualIndex].content;
    }

    const formattedMessages = [
        {
            role: "system",
            content: systemPrompt + "\n\n" + primingContext + "\n\nCRITICAL: Maintain the absolute continuity of the current scene. Show, don't tell."
        },
        ...safeMessages
    ];

    // Final safety: if history became empty after shifting, add a dummy user prompt to avoid empty sequence
    if (formattedMessages.length === 1) {
        formattedMessages.push({ role: "user", content: "Hello! Let's continue our story." });
    }

    const fetchTimeout = 120000; // 120s timeout for larger context/slower hardware
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), fetchTimeout);

    try {
        const url = getLmStudioUrl();
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
                top_p: 0.95,
                frequency_penalty: 0.5,
                presence_penalty: 0.5,
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
                        onComplete(finalCleanResponse);
                        return;
                    }

                    if (trimmedLine.startsWith('data: ')) {
                        try {
                            const jsonStr = trimmedLine.slice(6);
                            const data = JSON.parse(jsonStr);
                            const content = data.choices?.[0]?.delta?.content || "";
                            if (content) {
                                if (isFirstChunk) {
                                    onChunk(""); // Clear loading state
                                    isFirstChunk = false;
                                }
                                fullResponse += content;
                                onChunk(cleanLeakage(fullResponse));
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
            onComplete(finalCleanResponse);
        } else if (fullResponse.trim()) {
            console.warn("[LLM] cleanLeakage stripped everything. Using raw.");
            onComplete(fullResponse.trim());
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
                onComplete(cleanContent);
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
Return ONLY the new memory block. Do not include extra commentary or intro/outro.`;

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

export const extractMilestones = async (persona, messages) => {
    const charName = getShortName(persona.name);
    const url = getLmStudioUrl();
    const transcript = messages.map(msg => `${msg.role === 'user' ? 'User' : charName}: ${msg.content}`).join('\n\n');

    const prompt = `You are a character development engine.
Review the following recent interaction between the User and ${persona.name}.

Transcript:
${transcript}

Task: Identify if any NEW significant milestones, shared secrets, or relationship breakthroughs occurred in this specific segment.
Examples: 
- They shared a secret about their past.
- They agreed to go on a date.
- They had their first kiss.
- The User mentioned they love a specific food.

If something important happened, describe it in one short, impactful sentence starting with "Remember that...".
If multiple things happened, combine them into one sentence.
If nothing significantly new happened, return ONLY the word "NONE".
Return ONLY the sentence or "NONE". Do not include extra dialogue.`;

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
                max_tokens: 150,
                stream: false,
            }),
        });

        if (!response.ok) return null;
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "NONE";
        const result = cleanLeakage(content.trim());
        return result.toUpperCase() === "NONE" ? null : result;
    } catch (error) {
        console.error("Error extracting milestones:", error);
        return null;
    }
};

export const extractSceneSummary = async (persona, messages) => {
    const charName = getShortName(persona.name);
    const url = getLmStudioUrl();
    // last 10 messages for scene context
    const recent = messages.slice(-10);
    const transcript = recent.map(msg => `${msg.role === 'user' ? 'User' : charName}: ${msg.content}`).join('\n\n');

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
Return ONLY the summary sentence. No intros or outros.`;

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

export const generateVisualPrompt = async (persona, messages) => {
    const charName = getShortName(persona.name);
    const url = getLmStudioUrl();
    const recent = messages.slice(-10);
    const transcript = recent.map(msg => `${msg.role === 'user' ? 'User' : charName}: ${msg.content}`).join('\n\n');

    const prompt = `You are an AI image prompt engineer.
Review the following recent roleplay interaction.

Transcript (last 10 messages):
${transcript}

Task: Generate a high-quality visual prompt for an image that captures the CURRENT immediate scene.
Focus on:
1. Exact Poses and Physicality: (e.g., "sitting on the edge of the bed", "leaning against the counter", "naked with a sheet draped over her").
2. Environment & Lighting: (e.g., "dimly lit bedroom", "warm golden hour light", "modern apartment background").
3. Specific Clothing Status: (e.g., "wearing only a silk robe", "completely nude", "fully dressed in a business suit").
4. Emotions & Facial Expression: (e.g., "seductive smirk", "breathless and wide-eyed", "looking away shyly").

Format: Provide the prompt as a single comma-separated list of visual tags. 
Rules:
- NO full sentences. 
- NO meta-talk or intros.
- Include ONLY visual details.
- Avoid abstract words; use concrete physical descriptions.

Example Output: "sitting cross-legged on a plush bed, wearing a translucent black nightie, messy hair, looking at camera with a playful smile, soft ambient lighting, high contrast"

Return ONLY the prompt string.`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: await ensureValidModel(),
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                max_tokens: 100,
                stream: false,
            }),
        });

        if (!response.ok) return null;
        const data = await response.json();
        let content = data.choices?.[0]?.message?.content || "";
        return cleanLeakage(content.trim());
    } catch (error) {
        console.error("Error generating visual prompt:", error);
        return null;
    }
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
