const fs = require('fs');
const path = require('path');

const galleryDir = path.join(__dirname, '../public/gallery-assets');
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
        if (!file.match(/\.(png|jpg|jpeg|webp|gif|mp4|webm)$/i)) return;

        let personaId = "";
        
        if (file.includes('_shower.png')) {
            personaId = file.replace('_shower.png', '');
        } else if (file.includes('_clip.')) {
            personaId = file.split('_clip.')[0];
        } else {
            const parts = file.split('_');
            const lastPart = parts[parts.length - 1].split('.')[0];
            if (!isNaN(lastPart)) {
                if (parts.length > 2 && parts[parts.length - 2] === 'gallery') {
                    personaId = parts.slice(0, parts.length - 2).join('_');
                } else {
                    personaId = parts.slice(0, parts.length - 1).join('_');
                }
            } else {
                personaId = file.split('.')[0];
            }
        }

        if (personaId) {
            if (!manifest[personaId]) manifest[personaId] = [];
            manifest[personaId].push(`/gallery-assets/${file}`);
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
