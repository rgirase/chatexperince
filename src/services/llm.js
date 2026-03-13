// Service to communicate with LM Studio local inference server
// Endpoint is proxied via Vite to bypass CORS issues constraints.

const getLmStudioUrl = () => {
    const customUrl = localStorage.getItem('lmStudioUrl');
    if (customUrl) {
        return customUrl.endsWith('/') ? `${customUrl}chat/completions` : `${customUrl}/chat/completions`;
    }
    return '/api/chat/completions'; // Fallback to proxy
};

export const generateResponse = async (persona, messages, onChunk, onComplete, onError, signal, options = {}) => {
    let finalSystemPrompt = persona.systemPrompt;
    // Strengthen rules if this is a continuation of a thought
    if (options.isContinuation) {
        finalSystemPrompt += `\n\nCRITICAL CONTINUATION RULES:
1. You are continuing your PREVIOUS message. DO NOT repeat the same actions, emotions, or sentences.
2. Advance the plot. Move the characters to a new position, start a new action, or change the subject.
3. ABSOLUTELY NO: "heart flutters", "drawn in", "bodies touching", or "heart races" if you just used them. Use synonyms or entirely different descriptions.`;
    }

    // Inject User Persona if defined
    const userName = localStorage.getItem('userName');
    const userAppearance = localStorage.getItem('userAppearance');
    const userBackground = localStorage.getItem('userBackground');
    
    if (userName || userAppearance || userBackground) {
        finalSystemPrompt += `\n\n[USER INFORMATION]:
The person you are roleplaying with has the following profile:
${userName ? `- Name: ${userName}` : ''}
${userAppearance ? `- Appearance: ${userAppearance}` : ''}
${userBackground ? `- Role/Background: ${userBackground}` : ''}
Please use this information to make the roleplay more personalized and realistic. Acknowledge these traits in your descriptions and dialogue where appropriate.`;
    }

    finalSystemPrompt += `\n\nCRITICAL BEHAVIORAL RULES:\n1. NEVER repeat specific phrases, physical actions, or sentence structures from your previous messages. (e.g., if you already described 'tracing patterns with a finger', DO NOT do it again).\n2. Be creative with your actions. Describe the environment, the temperature, the sounds, and your internal visceral sensations.\n3. Drive the story forward proactively. Take bold steps and physical actions. Do not wait for the user.\n4. DO NOT end every response with a question.\n5. TIME-SKIP RULE: If the user's message implies that time has passed (e.g., "as days passed", "over the next week", "after all that time"), you MUST reflect on the CUMULATIVE experience of everything that happened during that period. Describe how the relationship evolved, how habits formed, emotional changes, and specific memorable moments from that stretch of time — NOT just a single instance. Write as if summarizing a rich, ongoing chapter of the story.`;

    const systemMessage = {
        role: "system",
        content: finalSystemPrompt
    };

    let apiMessages = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
    }));

    // Fix for strict Jinja templates (e.g. Mistral) which require the first message after system to be 'user'
    if (apiMessages.length > 0 && apiMessages[0].role === 'assistant') {
        apiMessages.unshift({ role: 'user', content: '*Approaches you*' });
    }

    const formattedMessages = [
        systemMessage,
        ...apiMessages
    ];

    // INJECT LOUD DIRECTIVE: Local models follow the last instruction best.
    // We add a final "user" direction to force the model to break loops.
    formattedMessages.push({
        role: "user",
        content: `[FINAL CRITICAL DIRECTIVE]: 
1. DO NOT repeat your previous phrases, physical actions, or environmental descriptions. 
2. VARIATION RULE: Change how you start your messages. If you started the last message with a physical action (*...*), start this one with dialogue, or vice versa.
3. ADDRESSING RULE: Do NOT use the same term of endearment (like "beta", "Devar ji", or "sweety") in consecutive messages. Vary how you address the user.
4. SENSORY VARIETY: If you already mentioned "cool sheets", "shivers", or "breath hitching", you are forbidden from using those specific phrases in this response. Find new ways to describe the atmosphere.
5. If the user just answered a question, acknowledge it as FACT and move the story to a NEW physical action immediately. 
6. Do NOT include tags like [PHYSICAL ACTION:], [WHISPER], or similar labels. Write naturally.`
    });

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
                temperature: 1.1,
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
        let fullContent = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
                if (line.includes('[DONE]')) return;

                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        const delta = data.choices[0]?.delta?.content || "";
                        if (delta) {
                            fullContent += delta;
                            onChunk(fullContent);
                        }
                    } catch (e) {
                        console.error("Error parsing stream data", e);
                    }
                }
            }
        }

        if (onComplete) {
            onComplete(fullContent);
        }

    } catch (error) {
        if (error.name === 'AbortError') {
            console.log("LM Studio API request was manually aborted by the user.");
            return; // We don't trigger onError since it was intentional
        }
        console.error("Error calling LM Studio API:", error);
        if (onError) {
            onError(error.message);
        }
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


