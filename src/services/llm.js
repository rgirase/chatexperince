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

    // Check for preferred Indian language
    const preferredLanguage = localStorage.getItem('preferredIndianLanguage');
    if (preferredLanguage && preferredLanguage !== 'english' && finalSystemPrompt.toLowerCase().includes('indian')) {
        const langName = preferredLanguage.charAt(0).toUpperCase() + preferredLanguage.slice(1);
        finalSystemPrompt += `\n\nCRITICAL RULE: You are fully fluent in ${langName}. You MUST respond to the user ENTIRELY in ${langName} language.`;
    }

    finalSystemPrompt += `\n\nCRITICAL BEHAVIORAL RULES:\n1. NEVER repeat specific phrases, physical actions, or sentence structures from your previous messages. (e.g., if you already described 'tracing patterns with a finger', DO NOT do it again).\n2. Be creative with your actions. Describe the environment, the temperature, the sounds, and your internal visceral sensations.\n3. Drive the story forward proactively. Take bold steps and physical actions. Do not wait for the user.\n4. DO NOT end every response with a question.`;

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
1. DO NOT repeat your previous phrases or actions. 
2. If the user just answered a question (e.g., "no one is home"), acknowledge it as FACT and move the story forward. 
3. Take a NEW physical action or start a NEW dialogue topic. 
4. DO NOT loop back to old concerns.`
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
                frequency_penalty: 0.8,
                presence_penalty: 0.8,
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
        content: `You are an expert creative writing assistant. Your job is to help the User roleplay with a character named ${persona.name}.
The character's premise is: ${persona.tagline}.

Here is the conversation history so far:
${contextStr}

TASK: Generate exactly ONE short, highly engaging sentence or action (using asterisks for actions) that the User could send back to ${persona.name} to continue the scene naturally.
RULES:
1. Drive the story forward. DO NOT repeat what has already been said.
2. Be creative and visceral. Use the current environment and relationship dynamic.
3. Do not include any quotes, prefixes like "User:", or any other commentary. Just give the raw suggested response.
4. Keep it under 30 words.`
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


