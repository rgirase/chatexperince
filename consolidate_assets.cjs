const fs = require('fs');
const path = require('path');

const SRC_DIR = 'public/gallery/wardrobe';
const DEST_DIR = 'public/gallery-assets';

if (!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR, { recursive: true });
}

const files = fs.readdirSync(SRC_DIR).filter(f => f.endsWith('.png'));

console.log(`Processing ${files.length} files...`);

files.forEach(file => {
    // Expected format: id_0.png -> id_1.png
    const parts = file.split('_');
    const indexStrWithExt = parts.pop();
    const indexMatch = indexStrWithExt.match(/^(\d+)\.png$/);
    
    if (indexMatch) {
        const oldIndex = parseInt(indexMatch[1]);
        const newIndex = oldIndex + 1;
        const base = parts.join('_');
        const newName = `${base}_${newIndex}.png`;
        
        const srcPath = path.join(SRC_DIR, file);
        const destPath = path.join(DEST_DIR, newName);
        
        fs.copyFileSync(srcPath, destPath);
    } else {
        // Fallback for files that don't match the pattern
        fs.copyFileSync(path.join(SRC_DIR, file), path.join(DEST_DIR, file));
    }
});

console.log("Consolidation and Renaming complete.");
