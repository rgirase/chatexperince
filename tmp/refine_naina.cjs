const fs = require('fs');
const PERSONAS_PATH = 'c:\\Users\\rgira\\chatexperince\\src\\data\\personas.js';
const PROMPTS_PATH = 'c:\\Users\\rgira\\chatexperince\\character_prompts.json';

const NAINA_APPEARANCE = `APPEARANCE: You are exceptionally beautiful with a soft, feminine figure (34C-26-38). Today, you are wearing a simple but elegant silk saree that accentuates your curves, and you've recently put on your mangalsutra, marking your status as a married woman.`;

const NAINA_BEHAVIOR = `BEHAVIOR: You are sitting across from the user in a quiet coffee shop, your hands trembling as you stir your cup. You are torn between your duty as a wife and the overwhelming, intense physical desire for the user, fueled by your 'naughty' shared history. You act proactively by leaning in, touching his hand across the table, and describing the mounting tension as the forbidden memories overwhelm you.`;

const NAINA_CULT = `    culturalTraits: {
      languageHabits: "Emotional, uses 'Shaadi', 'Mangalsutra'",
      values: "Duty vs. Desire, family pressure",
      traditions: "Indian family dynamics, marriage expectations"
    },`;

// Update personas.js
let content = fs.readFileSync(PERSONAS_PATH, 'utf8');

content = content.replace(/(id:\s*"indian_ex_gf"[^]*?culturalTraits:\s*\{[^]*?\})(,[^]*?APPEARANCE:\s*)([^]*?)(?=\nBACKSTORY:)/, (match, p1, p2, p3) => {
    return p1 + p2 + NAINA_APPEARANCE;
});

content = content.replace(/(id:\s*"indian_ex_gf"[^]*?BEHAVIOR:\s*)([^]*?)(?=\nYou are not an AI)/, (match, p1, p2) => {
    return p1 + NAINA_BEHAVIOR + '\n';
});

// Remove wedding traditions
content = content.replace(/(id:\s*"indian_ex_gf"[^]*?culturalTraits:\s*\{[^]*?traditions:\s*")[^"]*(")/, (match, p1, p2) => {
    return p1 + "Indian family dynamics, marriage expectations" + p2;
});

// Update prompt tags
content = content.replace(/(id:\s*"indian_ex_gf"[^]*?STORY PROGRESSION & STORY DRIVER:[^]*?Change your setting \()from the wedding hall to your new marital home/, "$1from the coffee shop to more private locations");

fs.writeFileSync(PERSONAS_PATH, content);
console.log('Updated personas.js');

// Update character_prompts.json
let prompts = JSON.parse(fs.readFileSync(PROMPTS_PATH, 'utf8'));
for (let key in prompts) {
    if (prompts[key].id === 'indian_ex_gf') {
        let p = prompts[key].prompt;
        p = p.replace(/APPEARANCE:[^]*?(?=BACKSTORY:)/, NAINA_APPEARANCE + '\n');
        p = p.replace(/BEHAVIOR:[^]*?(?=You are not an AI)/, NAINA_BEHAVIOR + '\n');
        p = p.replace(/Change your setting \(from the wedding hall to your new marital home/, "Change your setting (from the coffee shop to more private locations");
        prompts[key].prompt = p;
    }
}
fs.writeFileSync(PROMPTS_PATH, JSON.stringify(prompts, null, 2));
console.log('Updated character_prompts.json');
