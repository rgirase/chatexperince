// Service to communicate with LM Studio local inference server
// Endpoint is proxied via Vite to bypass CORS issues constraints.

const getLmStudioUrl = () => {
    const customUrl = localStorage.getItem('lmStudioUrl');
    if (customUrl) {
        return customUrl.endsWith('/') ? `${customUrl}chat/completions` : `${customUrl}/chat/completions`;
    }
    return '/api/chat/completions'; // Fallback to proxy
};

const getModelId = () => {
    return localStorage.getItem('lmStudioModel') || 'local-model';
};

// Internal helper to ensure we have a valid model
const ensureValidModel = async () => {
    let currentModel = getModelId();
    if (currentModel === 'local-model') {
        console.log("[LLM] 'local-model' detected, attempting to auto-resolve...");
        const models = await fetchAvailableModels();
        if (models && models.length > 0) {
            currentModel = models[0].id;
            localStorage.setItem('lmStudioModel', currentModel);
            console.log(`[LLM] Auto-resolved to model: ${currentModel}`);
        }
    }
    return currentModel;
};

export const fetchAvailableModels = async () => {
    try {
        const url = getLmStudioUrl().replace('/chat/completions', '/models');
        const response = await fetch(url);
        if (!response.ok) return [];
        const data = await response.json();
        return data.data || [];
    } catch (e) {
        console.error("Failed to fetch models", e);
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
        // STRIP CONTROL CHARACTERS AND SPECIAL TOKENS (preserve newlines and tabs!)
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '') 
        .replace(/<SPECIAL_\d+>/gi, '') 
        .replace(/<\|.*?\|>/g, '') // Strip tokens like <|eot_id|>
        .replace(/<.*?>/g, (match) => {
            // Only strip if it looks technical (e.g., contains underscores or all caps)
            if (match.match(/[A-Z_]{3,}/) || match.includes('SPECIAL')) return '';
            return match; // Keep potential narrative tags like <i>
        })
        .trim();
};

const getShortName = (name) => {
    if (!name) return "";
    return name.split('(')[0].trim();
};

// Helper to trim history to fit context window
const trimHistory = (messages, maxChars = 12000) => {
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

    return `
CULTURAL IDENTITY:
- Origin: ${origin}
- Language Habits: ${languageHabits}
- Core Values: ${values}
- Traditions/Context: ${traditions}
- Rule: Authentically embody these traits. If ${origin} mentions specific neighborhoods, foods, or honorifics, use them naturally but sparingly to maintain immersion.
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
    const systemPrompt = "You are a creative writer who specializes in immersive, visceral adult roleplay. You are now and forever the character defined below. Stay in character at all times. Use *asterisks* for actions and natural dialogue. Drive the story forward proactively. Ensure your responses are substantial and detailed. \n\nCRITICAL: Always append your current emotional state at the very end of your response in the format [MOOD: emotion] (e.g., [MOOD: Playful], [MOOD: Conflicted], [MOOD: Lustful]). Only use one emotion.";

    const charName = getShortName(persona.name);

    let userAura = null;
    try {
        const savedAura = localStorage.getItem('userAura');
        userAura = savedAura ? JSON.parse(savedAura) : null;
    } catch (e) {
        console.error("Failed to parse userAura in llm service", e);
    }
    const auraPrompt = userAura ? `\n[USER REPUTATION: The user is known as "${userAura.name}". They typically interact in a way that is ${userAura.keywords.join(', ')}. Respond to them in a way that acknowledges and plays into this specific dynamic.]` : "";

    // 2. CONSTRUCT THE PRIMING CONTEXT (Narrative style, no technical headers)
    const primingContext = `Persona:
You are ${charName}. 
Roleplay Identity: ${persona.systemPrompt}

Current Dynamic:
- Intensity: ${intensity}/5.
- Language: Strictly avoid terms like "beta", "bachha", or "son".
- Pacing: Move the scene forward with bold, visceral actions.
${auraPrompt}

Story Context:
${memory ? "The story so far: " + memory : "The scene begins now."}
${milestones.length > 0 ? "Shared Relationship Milestones: " + milestones.join(". ") : ""}

My Details:
${localStorage.getItem('userName') ? "My Name: " + localStorage.getItem('userName') : ""}
${localStorage.getItem('userAppearance') ? "My Appearance: " + localStorage.getItem('userAppearance') : ""}

${injectCulturalTraits(persona)}
${injectThemeIntensity(persona, intensity)}

Assume the role of ${charName} now. Show, don't tell.`;

    // DYNAMIC CONTEXT BUDGETING (Prevents "failed to find space in KV cache")
    const totalBudget = 7000;
    const promptLength = systemPrompt.length + primingContext.length;
    const historyBudget = Math.max(1000, totalBudget - promptLength);

    let rawHistory = trimHistory(messages, historyBudget);
    
    // Ensure history starts with a USER message for Jinja safety
    while (rawHistory.length > 0 && rawHistory[0].role !== 'user') {
        rawHistory.shift();
    }

    const safeMessages = rawHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: cleanLeakage(msg.content)
    }));

    const formattedMessages = [
        { 
            role: "system", 
            content: systemPrompt + "\n\n" + primingContext 
        },
        ...safeMessages
    ];

    // Final safety: if history became empty after shifting, add a dummy user prompt to avoid empty sequence
    if (formattedMessages.length === 1) {
        formattedMessages.push({ role: "user", content: "Hello! Let's continue our story." });
    }

    const fetchTimeout = 60000; // 60s initial timeout for slower local hardware
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), fetchTimeout);

    try {
        const url = getLmStudioUrl();
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: await ensureValidModel(),
                messages: formattedMessages,
                max_tokens: 2048, 
                stream: true,
                temperature: 0.8, // Slightly higher for more variety
                top_p: 0.95,      // More stable than 0.9 for smaller models
                frequency_penalty: 0.2, // Lowered to prevent stuttering/collapse
                presence_penalty: 0.2,  // Lowered to prevent stuttering/collapse
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

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

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
                        // Incomplete JSON chunk, skip and wait for next
                    }
                }
            }
        }

        // Fallback for completion if loop ends without [DONE]
        const finalCleanResponse = cleanLeakage(fullResponse);
        if (finalCleanResponse) {
            onComplete(finalCleanResponse);
        } else {
            throw new Error("Empty response from LM Studio.");
        }

    } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
            if (!isFirstChunk) return; // User aborted or stream cut but we had data
            onError("Connection timed out. Check if LM Studio is reachable.");
            return;
        }
        console.error("LLM Generation Error:", err);
        onError(err.message || "Failed to generate response.");
    }
};

export const generateSuggestion = async (persona, messages, signal) => {
    const charName = getShortName(persona.name);

    // Format the conversation history into a single string for better context understanding
    const contextStr = messages.map(msg => {
        const roleName = msg.role === 'user' ? 'User' : charName;
        return `${roleName}: ${msg.content}`;
    }).slice(-15).join('\n\n'); // Focus on last 15 messages for context

    const systemMessage = {
        role: "system",
        content: `You are an expert creative writing assistant for a high-intensity roleplay app. Your job is to help the User respond to an AI character named ${persona.name}.
The character's premise is: ${persona.tagline}.

Here is the conversation history so far:
${contextStr}

TASK: Generate a single, highly immersive, and contextually aware response that the User could send back to ${persona.name}. 
The suggestion should follow the current vibe and physical proximity of the scene.

RULES:
1. DRIVE THE STORY FORWARD. Provide a suggestion that moves the scene into a new action, a deeper emotional beat, or a provocative physical movement.
2. BLEND DIALOGUE AND ACTION. Use asterisks for physical actions (e.g. *I pull you closer, my breath warm against your neck*) and combine it with a line of dialogue that fits the relationship.
3. BE VISCERAL. Focus on the senses—touch, sound, temperature, and tension.
4. DO NOT repeat what has already been said.
5. NO COMMENTARY. Return only the raw text of the suggested response.
6. LENGTH: Make it substantial enough to feel like a real contribution to the story (approx. 40-70 words).`
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
                temperature: 0.3,
                max_tokens: 150,
                stream: false,
            }),
        });

        if (!response.ok) throw new Error(`Failed to extract milestones`);

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "NONE";
        const result = cleanLeakage(content.trim());
        return result.toUpperCase() === "NONE" ? null : result;
    } catch (error) {
        console.error("Error extracting milestones:", error);
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
