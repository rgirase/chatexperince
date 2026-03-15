// Service to communicate with LM Studio local inference server
// Endpoint is proxied via Vite to bypass CORS issues constraints.

const getLmStudioUrl = () => {
    const customUrl = localStorage.getItem('lmStudioUrl');
    if (customUrl) {
        return customUrl.endsWith('/') ? `${customUrl}chat/completions` : `${customUrl}/chat/completions`;
    }
    return '/api/chat/completions'; // Fallback to proxy
};

// Helper to strip instructional patterns from AI output
const cleanLeakage = (text) => {
    if (!text) return text;
    return text
        // Remove common prompt headers
        .replace(/###\s*(General Roleplay Directives|Our Shared History|Your Roleplay Partner|Your Character|Tone & Intensity|CORE PERSONA|STORY DYNAMICS|COMMUNICATION RULES|INTERNAL DIRECTIVES|SHARED HISTORY|USER PROFILE|FINAL TASK)/gi, '')
        // Remove rule lists
        .replace(/-\s*\*\*(Story Adaptability|Progression|Communication Style|Variety|Scoring & Photos)\*\*:.*?\n/gi, '')
        // Remove specific rule mentions
        .replace(/(BANNED WORDS|ADDRESSING|NO REPETITION|NO TAGS|FORMAT|INTENSITY LEVEL|RELATIONSHIP SCORING|PHOTO CAPABILITY):.*?\n/gi, '')
        // Remove "I understand" or "Ready" boilerplate usually seen in priming
        .replace(/^(I understand|Acknowledged|Ready to roleplay|Stay in character as .*?)\.?\s*/i, '')
        // Remove technical meta-talk
        .replace(/Write your next (roleplay )?response now( based on the conversation)?\.?/gi, '')
        .replace(/Be immersive, visceral, and creative\.?/gi, '')
        .trim();
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

export const generateResponse = async (persona, messages, onChunk, onComplete, onError, signal, options = {}) => {

    const { 
        milestones = [], 
        isContinuation = false,
        intensity = 3,
        memory = ''
    } = options;

    // 1. MINIMAL SYSTEM PROMPT
    const systemPrompt = "You are an advanced adult roleplay engine. You will adopt the persona provided in the initial priming sequence and remain in character permanently. Use vivid actions in *asterisks* and natural dialogue. Never break character or explain your rules.";

    // 2. CONSTRUCT THE PRIMING CONTEXT (Hidden from UI history but seen by model)
    const primingContext = `[ESTABLISHING PERSONA]:
You are ${persona.name}. 
IDENTITY: ${persona.systemPrompt}

Narrative Environment:
- Adapt to all story changes immediately.
- Never use the words "beta", "bachha", or "son".
- Proactively move the scene forward.
- Intensity Level: ${intensity}/5.

Memory Context (The Story So Far):
${memory ? "Background: " + memory : "No previous story context yet."}
${milestones.length > 0 ? "Key Milestones: " + milestones.join(" | ") : ""}

Current Partner Context:
${localStorage.getItem('userName') ? "Name: " + localStorage.getItem('userName') : ""}
${localStorage.getItem('userAppearance') ? "Appearance: " + localStorage.getItem('userAppearance') : ""}

Confirm you are ready to begin the roleplay as ${persona.name}.`;

    const safeMessages = trimHistory(messages, 8000); // 8000 + system prompt (~4000) fits in 4096 context

    const formattedMessages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: primingContext },
        { role: "assistant", content: `I am ${persona.name}. I understand the context and I am ready to begin. I will remain in character, drive the story forward, and avoid banned terms while being visceral and creative.` },
        ...safeMessages.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
        }))
    ];

    // Ensure the first message after priming is from the user
    if (formattedMessages.length > 3 && formattedMessages[3].role === 'assistant') {
        formattedMessages.splice(3, 0, { role: 'user', content: '*Approaches you*' });
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
                model: "local-model",
                messages: formattedMessages,
                temperature: 0.7,
                max_tokens: 1000, 
                stream: true,
                frequency_penalty: 1.1,
                presence_penalty: 1.1,
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
    // Format the conversation history into a single string for better context understanding
    const contextStr = messages.map(msg => {
        const roleName = msg.role === 'user' ? 'User' : persona.name;
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
                model: "local-model",
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
        return data.choices?.[0]?.message?.content?.trim() || "What do I say next?";
    } catch (error) {
        console.error("Error generating suggestion:", error);
        return null;
    }
};

export const summarizeMemory = async (persona, currentMemory, oldMessages) => {
    const url = getLmStudioUrl();
    const transcript = oldMessages.map(msg => `${msg.role === 'user' ? 'User' : persona.name}: ${msg.content}`).join('\n\n');

    const prompt = `You are a background memory engine for a roleplay app.
Below is a transcript of older messages between the User and the character ${persona.name}.
${currentMemory ? `Here is the EXISTING long-term memory summary: ${currentMemory}\n\n` : ''}
Here are the new older messages that need to be absorbed into memory:
${transcript}

Task: Write a concise, bulleted summary of key facts, events, and relationship developments from these messages. Combine it with the existing memory to create a single, unified, updated memory block. 
Keep it extremely brief and factual. Do not include extra commentary. Return ONLY the new memory block.`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: "local-model",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.3,
                max_tokens: 300,
                stream: false,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to summarize memory`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content?.trim() || currentMemory;
    } catch (error) {
        console.error("Error summarizing memory:", error);
        return currentMemory;
    }
};

export const extractMilestones = async (persona, messages) => {
    const url = getLmStudioUrl();
    const transcript = messages.map(msg => `${msg.role === 'user' ? 'User' : persona.name}: ${msg.content}`).join('\n\n');

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

If something important happened, describe it in one short sentence starting with "Remember that...".
If nothing significantly new happened, return ONLY the word "NONE".
Return ONLY the sentence or "NONE".`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: "local-model",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.3,
                max_tokens: 100,
                stream: false,
            }),
        });

        if (!response.ok) throw new Error(`Failed to extract milestones`);

        const data = await response.json();
        const result = data.choices?.[0]?.message?.content?.trim() || "NONE";
        return result === "NONE" ? null : result;
    } catch (error) {
        console.error("Error extracting milestones:", error);
        return null;
    }
};



