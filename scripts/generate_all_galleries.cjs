const http = require('http');
const fs = require('fs');
const path = require('path');

const CHARACTERS_FILE = path.join(__dirname, '../character_prompts.json');
const OUTPUT_DIR = path.join(__dirname, '../public/assets');
const RESULTS_FILE = path.join(__dirname, 'gallery_results.json');
const API_URL = 'http://127.0.0.1:7860/sdapi/v1/txt2img';

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const characters = JSON.parse(fs.readFileSync(CHARACTERS_FILE, 'utf8'));

async function generateImage(character, index) {
    const timestamp = Date.now();
    const filename = `${character.id}_gallery_${index + 1}_${timestamp}.png`;
    const filePath = path.join(OUTPUT_DIR, filename);

    // Extract appearance from prompt if possible, or use a default seductive prompt
    const appearanceMatch = character.prompt.match(/APPEARANCE: (.*?)(?:\n|$)/i);
    const appearance = appearanceMatch ? appearanceMatch[1] : character.name;

    const basePrompt = `(8k, masterpiece, ultra-detailed), highly seductive and sexy look, ${appearance}, deep cleavage clearly visible, alluring pose, cinematic lighting, professional photography, high-resolution.`;
    
    // Slight variation per index
    const variations = [
        "standing in a dimly lit room",
        "leaning against a wall",
        "sitting on a plush sofa",
        "looking over shoulder provocatively",
        "intense eye contact, close up"
    ];

    const fullPrompt = `${basePrompt}, ${variations[index] || ""}`;

    const postData = JSON.stringify({
        prompt: fullPrompt,
        negative_prompt: "lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, covering cleavage, conservative dress",
        steps: 25,
        width: 512,
        height: 768,
        cfg_scale: 7,
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
                        fs.writeFileSync(filePath, Buffer.from(response.images[0], 'base64'));
                        console.log(`Generated: ${filename}`);
                        resolve(`/assets/${filename}`);
                    } else {
                        console.error(`Failed to generate for ${character.id}`);
                        resolve(null);
                    }
                } catch (e) {
                    console.error(`Error parsing response for ${character.id}: ${e.message}`);
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
    const allResults = {};
    
    // Loading existing results to resume if needed
    if (fs.existsSync(RESULTS_FILE)) {
        Object.assign(allResults, JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8')));
    }

    for (const char of characters) {
        if (allResults[char.id] && allResults[char.id].length >= 5) {
            console.log(`Skipping ${char.id}, already has 5 images.`);
            continue;
        }

        console.log(`Processing character: ${char.name} (${char.id})`);
        const urls = allResults[char.id] || [];
        
        for (let i = urls.length; i < 5; i++) {
            const url = await generateImage(char, i);
            if (url) {
                urls.push(url);
                allResults[char.id] = urls;
                // Save progress incrementally
                fs.writeFileSync(RESULTS_FILE, JSON.stringify(allResults, null, 2));
            }
        }
    }
    
    console.log("Batch generation complete!");
}

run();
