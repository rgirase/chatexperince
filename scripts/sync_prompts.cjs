const fs = require('fs');
const path = require('path');

const PERSONAS_PATH = path.join(__dirname, '../src/data/personas.js');
const PROMPTS_PATH = path.join(__dirname, '../character_prompts.json');

function sync() {
    console.log('Reading personas from:', PERSONAS_PATH);
    const content = fs.readFileSync(PERSONAS_PATH, 'utf8');
    
    const personas = [];
    
    // Look for objects containing id, name, and systemPrompt
    // This regex looks for the start of an object and captures relevant fields until the next possible object start
    const personaRegex = /id:\s*["']([^"']+)["'][\s\S]+?name:\s*["']([^"']+)["'][\s\S]+?systemPrompt:\s*`([\s\S]+?)`/g;
    
    let match;
    while ((match = personaRegex.exec(content)) !== null) {
        // Only add if it's not a sub-object (like wardrobe items which also have IDs but not names/systemPrompts)
        const id = match[1];
        const name = match[2];
        const prompt = match[3].trim();
        
        // Basic check to avoid duplicates or sub-objects
        if (id && name && prompt && !personas.find(p => p.id === id)) {
            personas.push({ id, name, prompt });
        }
    }

    console.log(`Found ${personas.length} personas in personas.js`);
    
    if (personas.length === 0) {
        console.error('No personas found! Check the regex/parsing logic.');
        process.exit(1);
    }

    fs.writeFileSync(PROMPTS_PATH, JSON.stringify(personas, null, 2), 'utf8');
    console.log(`Successfully synced ${personas.length} characters to character_prompts.json`);
}

sync();
