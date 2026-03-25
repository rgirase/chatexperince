const fs = require('fs');
const path = require('path');

const CHARACTERS_DIR = path.join(__dirname, '../src/data/characters');
const PROMPTS_PATH = path.join(__dirname, '../character_prompts.json');

function sync() {
    console.log('Reading personas from directory:', CHARACTERS_DIR);
    const files = fs.readdirSync(CHARACTERS_DIR);
    
    const personas = [];
    
    // Look for objects containing id, name, and systemPrompt
    const personaRegex = /const\s+([a-zA-Z0-9_]+)\s*=\s*\{[\s\S]+?id:\s*["']([^"']+)["'][\s\S]+?name:\s*["']([^"']+)["'][\s\S]+?systemPrompt:\s*`([\s\S]+?)`/g;

    files.forEach(file => {
        if (file === 'index.js' || file === 'basePrompt.js' || !file.endsWith('.js')) return;
        
        const filePath = path.join(CHARACTERS_DIR, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        personaRegex.lastIndex = 0; // Reset regex
        let match;
        while ((match = personaRegex.exec(content)) !== null) {
            const id = match[2];
            const name = match[3];
            const prompt = match[4].trim();
            
            if (id && name && prompt && !personas.find(p => p.id === id)) {
                personas.push({ id, name, prompt });
            }
        }
    });

    console.log(`Found ${personas.length} personas in characters directory`);
    
    if (personas.length === 0) {
        console.error('No personas found! Check the regex/parsing logic.');
        process.exit(1);
    }

    fs.writeFileSync(PROMPTS_PATH, JSON.stringify(personas, null, 2), 'utf8');
    console.log(`Successfully synced ${personas.length} characters to character_prompts.json`);
}

sync();
