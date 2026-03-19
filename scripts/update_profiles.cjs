const fs = require('fs');
const path = require('path');

const PERSONAS_PATH = path.join(__dirname, '../src/data/personas.js');
const PROFILES_DIR = path.join(__dirname, '../public/assets/profiles');

function update() {
    console.log('Reading personas from:', PERSONAS_PATH);
    let content = fs.readFileSync(PERSONAS_PATH, 'utf8');
    
    // Get list of generated profiles
    const files = fs.readdirSync(PROFILES_DIR);
    const profileMap = {};
    
    files.forEach(file => {
        if (file.endsWith('_profile.png')) {
            const id = file.replace('_profile.png', '');
            profileMap[id] = `/assets/profiles/${file}`;
        }
    });

    console.log(`Found ${Object.keys(profileMap).length} new profile photos.`);

    let updatedCount = 0;
    
    // For each character in the file, find its block and update the 'image:' field
    // We'll look for the character ID block and then find the image: line within that block
    Object.keys(profileMap).forEach(id => {
        const newImagePath = profileMap[id];
        
        // Find the start of the object for this ID
        // Then find the image: field before the next '  },' which marks the end of a character object
        const regex = new RegExp(`(id:\\s*["']${id}["'][\\s\\S]*?image:\\s*["'])([^"']+)(["'])`, 'g');
        
        // We need to be careful not to overshoot into the next character.
        // We'll split by '  },' to isolate character blocks
        const blocks = content.split('\n  },');
        for (let i = 0; i < blocks.length; i++) {
            if (blocks[i].includes(`id: "${id}"`) || blocks[i].includes(`id: '${id}'`)) {
                const updatedBlock = blocks[i].replace(/(image:\s*["'])([^"']+)(["'])/, `$1${newImagePath}$3`);
                if (updatedBlock !== blocks[i]) {
                    blocks[i] = updatedBlock;
                    updatedCount++;
                }
            }
        }
        content = blocks.join('\n  },');
    });

    fs.writeFileSync(PERSONAS_PATH, content, 'utf8');
    console.log(`Successfully updated ${updatedCount} profile photo paths in personas.js`);
}

update();
