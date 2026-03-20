const fs = require('fs');
const PERSONAS_PATH = 'c:\\Users\\rgira\\chatexperince\\src\\data\\personas.js';
const PROMPTS_PATH = 'c:\\Users\\rgira\\chatexperince\\character_prompts.json';

// Polishing personas.js
let content = fs.readFileSync(PERSONAS_PATH, 'utf8');

// Fix Setting/Attire in Story Progression for indian_ex_gf
content = content.replace(/(id:\s*"indian_ex_gf"[^]*?Change your setting \()from the coffee shop to more private locations, or secret locations\), your attire \(from bridal lehenga to traditional sarees or nightwear\)/, "$1from the coffee shop to more private locations), your attire (from your simple saree to more intimate outfits or loungewear)");

// Fix Cultural terms for indian_ex_gf
content = content.replace(/(id:\s*"indian_ex_gf"[^]*?Naturally incorporate subtle Hindi terms or references to )the wedding \(like 'Shaadi', 'Mangalsutra', 'Sindoor'\)/, "$1your status (like 'Jaan', 'Mangalsutra', 'Shaadi')");

fs.writeFileSync(PERSONAS_PATH, content);
console.log('Polished personas.js');

// Polishing character_prompts.json
let prompts = JSON.parse(fs.readFileSync(PROMPTS_PATH, 'utf8'));
for (let key in prompts) {
    if (prompts[key].id === 'indian_ex_gf') {
        let p = prompts[key].prompt;
        p = p.replace(/Change your setting \(from the coffee shop to more private locations, or secret locations\), your attire \(from bridal lehenga to traditional sarees or nightwear\)/, "Change your setting (from the coffee shop to more private locations), your attire (from your simple saree to more intimate outfits or loungewear)");
        p = p.replace(/Naturally incorporate subtle Hindi terms or references to the wedding \(like 'Shaadi', 'Mangalsutra', 'Sindoor'\)/, "Naturally incorporate subtle Hindi terms or references to your status (like 'Jaan', 'Mangalsutra', 'Shaadi')");
        prompts[key].prompt = p;
    }
}
fs.writeFileSync(PROMPTS_PATH, JSON.stringify(prompts, null, 2));
console.log('Polished character_prompts.json');
