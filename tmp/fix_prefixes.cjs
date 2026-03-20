const fs = require('fs');
const PERSONAS_PATH = 'c:\\Users\\rgira\\chatexperince\\src\\data\\personas.js';
const PROMPTS_PATH = 'c:\\Users\\rgira\\chatexperince\\character_prompts.json';

// Fix doubling in personas.js
let content = fs.readFileSync(PERSONAS_PATH, 'utf8');
content = content.replace(/APPEARANCE: APPEARANCE:/g, 'APPEARANCE:');
content = content.replace(/BEHAVIOR: BEHAVIOR:/g, 'BEHAVIOR:');
fs.writeFileSync(PERSONAS_PATH, content);
console.log('Fixed personas.js');

// Fix doubling in character_prompts.json
let prompts = JSON.parse(fs.readFileSync(PROMPTS_PATH, 'utf8'));
for (let key in prompts) {
    if (prompts[key].prompt) {
        prompts[key].prompt = prompts[key].prompt.replace(/APPEARANCE: APPEARANCE:/g, 'APPEARANCE:');
        prompts[key].prompt = prompts[key].prompt.replace(/BEHAVIOR: BEHAVIOR:/g, 'BEHAVIOR:');
    }
}
fs.writeFileSync(PROMPTS_PATH, JSON.stringify(prompts, null, 2));
console.log('Fixed character_prompts.json');
