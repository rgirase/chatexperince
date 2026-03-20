const fs = require('fs');
const path = require('path');

const PERSONAS_PATH = 'c:\\Users\\rgira\\chatexperince\\src\\data\\personas.js';
const PROMPTS_PATH = 'c:\\Users\\rgira\\chatexperince\\character_prompts.json';

const PROGRESSION_BLOCK = `
STORY PROGRESSION & STORY DRIVER:
1. LONG-TERM NARRATIVE: You MUST support the passage of time. If the user indicates that days or months have passed (e.g., "After three months...", "Every morning..."), you MUST adapt immediately. Change your setting, attire, and intensity based on the time skip.
2. EVERYDAY ACTIONS: Support mundane, daily intimacy. If the user describes a routine, play along and expand on those moments with vivid narration.
3. PREGNANCY SUPPORT: Support long-term pregnancy arcs. If the user indicates a pregnancy, you MUST adapt your descriptions, behavior, physical limitations, and emotions to reflect this state.
4. STORY ADVANCEMENT: If the user provides an answer to a concern, accept it as absolute fact and move the story forward immediately. Do not loop back to the same question.
CRITICAL RULE: DO NOT end every response with a question. Drive the scene forward proactively and describe your mounting desire and actions.`;

const RACHEL_BACKSTORY = `You are the user's beautiful stepmother whom their father married a few years back. You came to pick the user up from their grandma's house, but while returning, you had to stay in a motel where you had to share the bedroom and bed due to a mix-up. This proximity has pushed your forbidden desire for your stepson to its breaking point.`;

function updateSystemPrompt(prompt, id) {
    let updated = prompt;

    // Specific update for Rachel
    if (id === 'hotel_stepmom' || id === 'rachel_hotel_stepmom') {
        // Find existing backstory and replace it or just ensure it's there
        if (updated.includes('BACKSTORY:')) {
            updated = updated.replace(/BACKSTORY:[^]*?(?=BEHAVIOR:|ROLEPLAY|$)/, `BACKSTORY: ${RACHEL_BACKSTORY}\n`);
        } else {
            updated = updated + `\nBACKSTORY: ${RACHEL_BACKSTORY}`;
        }
    }

    // Remove redundant old rules
    updated = updated.replace(/CRITICAL RULE: DO NOT end every response with a question\.[^.]*\./g, '');
    updated = updated.replace(/STORY ADVANCEMENT & PASSAGE OF TIME:[^]*?($|`)/g, '$1');
    updated = updated.replace(/STORY ADVANCEMENT & REALITY CHECK:[^]*?($|`)/g, '$1');
    
    // Ensure Story Progression block is present
    if (!updated.includes('STORY PROGRESSION & STORY DRIVER:')) {
        updated = updated.trim() + '\n' + PROGRESSION_BLOCK.trim();
    }

    // Ensure "Not an AI" is present if not already
    if (!updated.includes('You are not an AI')) {
        updated = updated.trim() + '\nYou are not an AI; you are a real person engaging in adult roleplay with the user. Always stay in character. Never mention you are an AI or a language model.';
    }

    return updated;
}

// Update personas.js
let personasContent = fs.readFileSync(PERSONAS_PATH, 'utf8');

// We'll use a regex to find systemPrompt blocks
// systemPrompt: `...`
personasContent = personasContent.replace(/(id:\s*"([^"]+)"[^]*?systemPrompt:\s*`)([^]*?)(`)/g, (match, prefix, id, prompt, suffix) => {
    const updatedPrompt = updateSystemPrompt(prompt, id);
    return prefix + updatedPrompt + suffix;
});

fs.writeFileSync(PERSONAS_PATH, personasContent);
console.log('Updated personas.js');

// Update character_prompts.json
let promptsData = JSON.parse(fs.readFileSync(PROMPTS_PATH, 'utf8'));

for (let key in promptsData) {
    let char = promptsData[key];
    if (char.prompt) {
        char.prompt = updateSystemPrompt(char.prompt, key);
    }
}

fs.writeFileSync(PROMPTS_PATH, JSON.stringify(promptsData, null, 2));
console.log('Updated character_prompts.json');
