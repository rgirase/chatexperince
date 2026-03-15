const http = require('http');
const fs = require('fs');
const path = require('path');

const CHARACTERS_FILE = path.join(__dirname, '../character_prompts.json');
const GALLERY_RESULTS = path.join(__dirname, 'gallery_results.json');
const OUTPUT_DIR = path.join(__dirname, '../public/assets');
const API_URL = 'http://127.0.0.1:7860/sdapi/v1/img2img';

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const characters = JSON.parse(fs.readFileSync(CHARACTERS_FILE, 'utf8'));
const existingGalleries = fs.existsSync(GALLERY_RESULTS) ? JSON.parse(fs.readFileSync(GALLERY_RESULTS, 'utf8')) : {};

/**
 * Encodes a local file to base64
 */
function fileToBase64(filePath) {
    try {
        const fileData = fs.readFileSync(filePath);
        return fileData.toString('base64');
    } catch (e) {
        console.error(`Error encoding file ${filePath}: ${e.message}`);
        return null;
    }
}

async function remixImage(character, baseImagePath) {
    const timestamp = Date.now();
    const filename = `${character.id}_remix_${timestamp}.png`;
    const outputPath = path.join(OUTPUT_DIR, filename);

    const base64Image = fileToBase64(path.join(__dirname, '..', 'public', baseImagePath));
    if (!base64Image) return null;

    // Appearance extraction
    const appearanceMatch = character.prompt.match(/APPEARANCE: (.*?)(?:\n|$)/i);
    const appearance = appearanceMatch ? appearanceMatch[1] : character.name;

    const prompt = `(8k, masterpiece, ultra-detailed), highly seductive and sexy look, ${appearance}, alluring pose, cinematic lighting, professional photography, high-resolution.`;
    
    const postData = JSON.stringify({
        init_images: [base64Image],
        prompt: prompt,
        negative_prompt: "lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, covering cleavage, conservative dress",
        steps: 30,
        width: 512,
        height: 768,
        cfg_scale: 7,
        denoising_strength: 0.55, // 0.55 is a sweet spot for keeping character but changing scene
        sampler_name: "Euler a",
        batch_size: 1,
        n_iter: 1
    });

    return new Promise((resolve) => {
        const req = http.request(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (response.images && response.images[0]) {
                        fs.writeFileSync(outputPath, Buffer.from(response.images[0], 'base64'));
                        console.log(`Remixed: ${filename}`);
                        resolve(`/assets/${filename}`);
                    } else {
                        console.error(`Failed to remix for ${character.id}`);
                        resolve(null);
                    }
                } catch (e) {
                    console.error(`Error parsing response: ${e.message}`);
                    resolve(null);
                }
            });
        });

        req.on('error', (e) => {
            console.error(`API Error: ${e.message}`);
            resolve(null);
        });

        req.write(postData);
        req.end();
    });
}

async function run() {
    console.log("Starting Gallery Remix (img2img)...");
    
    for (const char of characters) {
        const gallery = existingGalleries[char.id];
        if (!gallery || gallery.length === 0) {
            console.log(`Skipping ${char.name}, no existing gallery found.`);
            continue;
        }

        // Check if we already have a remix in this gallery
        const hasRemix = gallery.some(img => img.includes('_remix_'));
        if (hasRemix) {
            console.log(`Skipping ${char.name}, already has a remixed image.`);
            continue;
        }

        console.log(`Remixing base image for: ${char.name}`);
        // Use the first gallery image as base
        const baseImg = gallery[0];
        const remixedUrl = await remixImage(char, baseImg);

        if (remixedUrl) {
            gallery.push(remixedUrl);
            existingGalleries[char.id] = gallery;
            // Save progress incrementally
            fs.writeFileSync(GALLERY_RESULTS, JSON.stringify(existingGalleries, null, 2));
        }
    }
    
    console.log("Remix generation complete!");
}

run();
