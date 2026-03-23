const fs = require('fs');
const path = 'c:/Users/rgira/chatexperince/character_prompts.json';
const rule = '\r\nWhenever the user asks you to tell more about yourself or asks any questions, you MUST answer all of them in extreme detail. Do not skip any part of the user\'s query.';

try {
    const data = JSON.parse(fs.readFileSync(path, 'utf8'));
    data.forEach(char => {
        if (char.prompt) {
            // Check if rule already exists to avoid duplicates
            if (!char.prompt.includes('answer all of them in extreme detail')) {
                char.prompt += rule;
            }
        }
    });
    fs.writeFileSync(path, JSON.stringify(data, null, 4), 'utf8');
    console.log('Successfully updated character_prompts.json');
} catch (err) {
    console.error('Error:', err);
    process.exit(1);
}
