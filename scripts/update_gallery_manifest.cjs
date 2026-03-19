const fs = require('fs');
const path = require('path');

const galleryDir = path.join(__dirname, '../public/gallery');
const outputManifest = path.join(__dirname, '../src/data/gallery_manifest.json');

function generateManifest() {
    console.log("Scanning gallery directory:", galleryDir);
    
    if (!fs.existsSync(galleryDir)) {
        console.error("Gallery directory not found!");
        return;
    }

    const files = fs.readdirSync(galleryDir);
    const manifest = {};

    files.forEach(file => {
        if (!file.match(/\.(png|jpg|jpeg|webp|gif)$/i)) return;

        // Pattern 1: id.png
        // Pattern 2: id_n.png
        // Pattern 3: id_gallery_n.png
        
        let personaId = "";
        const parts = file.split('_');
        
        // This logic is a bit tricky because persona IDs can have underscores (e.g., best_friend_mom)
        // We'll try to find the longest matching ID from the filenames.
        // But for now, let's assume the ID is everything before the last underscore if it's a number, 
        // or the whole filename if there's no underscore.
        
        const lastPart = parts[parts.length - 1].split('.')[0];
        if (!isNaN(lastPart)) {
            // It ends in a number (e.g., _1, _2)
            // Check if there's a "gallery" keyword
            if (parts.length > 2 && parts[parts.length - 2] === 'gallery') {
                 personaId = parts.slice(0, parts.length - 2).join('_');
            } else {
                 personaId = parts.slice(0, parts.length - 1).join('_');
            }
        } else {
            // No number (e.g., stepmom.png)
            personaId = file.split('.')[0];
        }

        if (personaId) {
            if (!manifest[personaId]) manifest[personaId] = [];
            manifest[personaId].push(`/gallery/${file}`);
        }
    });

    // Sort paths for consistency
    Object.keys(manifest).forEach(id => {
        manifest[id].sort();
    });

    fs.writeFileSync(outputManifest, JSON.stringify(manifest, null, 2));
    console.log(`Manifest generated successfully at ${outputManifest}`);
    console.log(`Found images for ${Object.keys(manifest).length} personas.`);
}

generateManifest();
