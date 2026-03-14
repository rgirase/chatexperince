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

Memory Context:
${memory ? "Summary: " + memory : ""}
${milestones.length > 0 ? "Key Events: " + milestones.join(" | ") : ""}

Current Partner:
${localStorage.getItem('userName') ? "Name: " + localStorage.getItem('userName') : ""}
${localStorage.getItem('userAppearance') ? "Appearance: " + localStorage.getItem('userAppearance') : ""}

Confirm you are ready to begin the roleplay as ${persona.name}.`;

    const formattedMessages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: primingContext },
        { role: "assistant", content: `I am ${persona.name}. I understand the context and I am ready to begin. I will remain in character, drive the story forward, and avoid banned terms while being visceral and creative.` },
        ...messages.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
        }))
    ];

    // Ensure the first message after priming is from the user
    if (formattedMessages.length > 3 && formattedMessages[3].role === 'assistant') {
        formattedMessages.splice(3, 0, { role: 'user', content: '*Approaches you*' });
    }

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
                temperature: 0.7, // Lowered for stability
                max_tokens: -1,
                stream: true,
                frequency_penalty: 1.1,
                presence_penalty: 1.1,
            }),
            signal: signal,
        });




        if (!response.ok) {
            throw new Error(`Failed to connect to LM Studio: ${response.statusText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let fullResponse = "";
        let isFirstChunk = true;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
                if (line.includes('[DONE]')) {
                    const finalCleanResponse = cleanLeakage(fullResponse);
                    onComplete(finalCleanResponse);
                    return;
                }

                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        const content = data.choices[0]?.delta?.content || "";
                        if (content) {
                            if (isFirstChunk) {
                                onChunk(""); // Clear initial loading state
                                isFirstChunk = false;
                            }

                            fullResponse += content;
                            const cleanedResponse = cleanLeakage(fullResponse);
                            onChunk(cleanedResponse);
                        }
                    } catch (e) {
                        console.error("Error parsing stream data", e);
                    }
                }
            }
        }
    } catch (err) {
        if (err.name === 'AbortError') return;
        console.error("LLM Generation Error:", err);
        onError(err.message);
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



