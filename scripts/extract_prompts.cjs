const fs = require('fs');
const path = require('path');

const files = [
    'nora_stepsister_funeral.js',
    'grace_stepmom_storm.js',
    'maya_stepsister_gym.js',
    'serena_aunt_yoga.js',
    'lily_cousin_beach.js',
    'diana_stepmom_morning.js',
    'sophie_stepsister_laundry.js',
    'elena_moms_friend_massage.js',
    'rachel_stepmom_moving.js',
    'sophia_sister_returned.js',
    'eleanor_step_grandma.js',
    'olivia_sister_in_law.js',
    'mrs_ross_landlady.js',
    'victoria_boss_wife.js',
    'claudia_family_friend.js',
    'skylar_step_cousin.js',
    'matron_vance.js',
    'coach_kira_trainer.js',
    'piper_stepsister_stuck.js',
    'aunt_jenna_neighbor.js'
];

const results = {};

files.forEach(file => {
    const filePath = path.join('c:/Users/rgira/chatexperince/src/data/characters', file);
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        const appearanceMatch = content.match(/APPEARANCE:\s*(.*?)(?=\n|BACKSTORY:|$)/is);
        const appearance = appearanceMatch ? appearanceMatch[1].trim() : '';
        
        const nameMatch = content.match(/name:\s*['"](.*?)['"]/);
        const name = nameMatch ? nameMatch[1] : file.replace('.js', '');

        const idMatch = content.match(/id:\s*['"](.*?)['"]/);
        const id = idMatch ? idMatch[1] : file.replace('.js', '');

        // Extract wardrobe names
        const wardrobeNames = [];
        const wardrobeRegex = /name:\s*['"](.*?)['"]/g;
        let match;
        // Skip the first name match (character name)
        wardrobeRegex.exec(content); 
        while ((match = wardrobeRegex.exec(content)) !== null) {
            wardrobeNames.push(match[1]);
        }

        results[id] = {
            name,
            appearance,
            wardrobe: wardrobeNames.slice(0, 5) // Take 5 gallery items
        };
    }
});

fs.writeFileSync('c:/Users/rgira/chatexperince/character_prompts.json', JSON.stringify(results, null, 2));
console.log('Extracted prompts for ' + Object.keys(results).length + ' characters.');
