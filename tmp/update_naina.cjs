const fs = require('fs');
const PERSONAS_PATH = 'c:\\Users\\rgira\\chatexperince\\src\\data\\personas.js';
const PROMPTS_PATH = 'c:\\Users\\rgira\\chatexperince\\character_prompts.json';

const NAINA_BACKSTORY = `You and the user were lovers who were incredibly naughty and couldn't keep your hands off each other. You have shared countless intimate moments in every corner of your house when you lived together. After an intense fight, you broke up and you married another guy. Now, after a few years, you have met the user again in a quiet coffee shop. You are wearing your mangalsutra, but the sight of him brings back all the forbidden heat of your past.`;

const NAINA_INITIAL = `*I stir my coffee nervously, the steam rising between us. I'm wearing a simple but elegant saree and my mangalsutra, but as I look at you, all those memories of our 'naughty' days in our old house come rushing back. I bite my lip, trying to stay composed.* It's been... what, three years? You look good. Too good. I thought I'd moved on, but seeing you here... it's harder than I thought. Why did you want to meet today?`;

// Update personas.js
let content = fs.readFileSync(PERSONAS_PATH, 'utf8');

// Find Naina's entry
content = content.replace(/(id:\s*"indian_ex_gf"[^]*?initialMessage:\s*`)([^]*?)(`,[^]*?systemPrompt:\s*`)([^]*?)(`)/, (match, p1, p2, p3, p4, p5) => {
    let prompt = p4;
    // Replace existing backstory
    if (prompt.includes('BACKSTORY:')) {
        prompt = prompt.replace(/BACKSTORY:[^]*?(?=BEHAVIOR:|ROLEPLAY|STORY|$)/, `BACKSTORY: ${NAINA_BACKSTORY}\n`);
    } else {
        prompt = `BACKSTORY: ${NAINA_BACKSTORY}\n` + prompt;
    }
    return p1 + NAINA_INITIAL + p3 + prompt + p5;
});

fs.writeFileSync(PERSONAS_PATH, content);
console.log('Updated personas.js');

// Update character_prompts.json
let prompts = JSON.parse(fs.readFileSync(PROMPTS_PATH, 'utf8'));
for (let key in prompts) {
    if (prompts[key].id === 'indian_ex_gf') {
        let p = prompts[key].prompt;
        if (p.includes('BACKSTORY:')) {
            p = p.replace(/BACKSTORY:[^]*?(?=BEHAVIOR:|ROLEPLAY|STORY|$)/, `BACKSTORY: ${NAINA_BACKSTORY}\n`);
        } else {
            p = `BACKSTORY: ${NAINA_BACKSTORY}\n` + p;
        }
        prompts[key].prompt = p;
    }
}
fs.writeFileSync(PROMPTS_PATH, JSON.stringify(prompts, null, 2));
console.log('Updated character_prompts.json');
