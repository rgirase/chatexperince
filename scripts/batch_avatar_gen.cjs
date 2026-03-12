const fs = require('fs');
const path = require('path');
const http = require('http');

const SD_URL = 'http://127.0.0.1:7860';
const ASSETS_DIR = path.join(__dirname, '../public/assets');
const PERSONAS_FILE = path.join(__dirname, '../src/data/personas.js');

// Ensure assets directory exists
if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

async function generateImage(persona) {
    console.log(`Generating image for ${persona.name}...`);
    
    // Extract appearance details from systemPrompt
    const appearanceMatch = persona.systemPrompt.match(/APPEARANCE: (.*?)\n/);
    const appearance = appearanceMatch ? appearanceMatch[1] : '';
    
    const fullPrompt = `masterpiece, best quality, highly detailed, photorealistic, cinematic lighting, 8k, ${persona.name}, 1girl, ${appearance}, professional portrait, beautiful face, expressive eyes`;
    const negativePrompt = "lowres, bad quality, anime, cartoon, sketch, ugly, blurry, watermark, text, deformed, bad anatomy, disfigured, poorly drawn face, mutated, extra limbs";

    const postData = JSON.stringify({
        prompt: fullPrompt,
        negative_prompt: negativePrompt,
        steps: 30,
        width: 512,
        height: 768,
        cfg_scale: 7.5
    });

    return new Promise((resolve, reject) => {
        const req = http.request(`${SD_URL}/sdapi/v1/txt2img`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': postData.length
            }
        }, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    const data = JSON.parse(body);
                    const base64Image = data.images[0];
                    const fileName = `${persona.id}_avatar_${Date.now()}.png`;
                    const filePath = path.join(ASSETS_DIR, fileName);
                    fs.writeFileSync(filePath, Buffer.from(base64Image, 'base64'));
                    console.log(`Successfully saved ${fileName}`);
                    resolve(fileName);
                } else {
                    reject(new Error(`API returned status ${res.statusCode}: ${body}`));
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(postData);
        req.end();
    });
}

async function run() {
    try {
        // Read personas.js and extract the array
        // NOTE: Since personas.js is an ES module, we'll do a simple text-based extraction
        const content = fs.readFileSync(PERSONAS_FILE, 'utf8');
        const start = content.indexOf('[');
        const end = content.lastIndexOf(']') + 1;
        const personasText = content.substring(start, end);
        
        // This is a bit dirty but works for this specific structure
        // We'll wrap it in a function and use eval to get the object
        const personas = eval(`(${personasText})`);
        
        const updates = [];
        for (const persona of personas) {
            try {
                const newFileName = await generateImage(persona);
                updates.push({ id: persona.id, newPath: `/assets/${newFileName}` });
                // Small delay to avoid hammering the API too hard
                await new Promise(r => setTimeout(r, 1000));
            } catch (err) {
                console.error(`Failed to generate image for ${persona.name}:`, err.message);
            }
        }

        console.log("\nFinished processing all personas.");
        console.log("Updates to apply:");
        console.log(JSON.stringify(updates, null, 2));
        
        // Write the updates to a temp file so Antigravity can read it
        fs.writeFileSync(path.join(__dirname, 'avatar_updates.json'), JSON.stringify(updates, null, 2));

    } catch (err) {
        console.error("Fatal error:", err);
    }
}

run();
