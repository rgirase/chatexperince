const fs = require('fs');
const path = require('path');
const http = require('http');

const COMFY_URL = 'http://127.0.0.1:8000';

async function generateCharacterImages(charId, name, prompts) {
    console.log(`🚀 Starting image generation for ${name}...`);
    const outputDir = 'c:/Users/rgira/chatexperince/public/gallery';
    const profileDir = 'c:/Users/rgira/chatexperince/public/assets/profiles';
    
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    if (!fs.existsSync(profileDir)) fs.mkdirSync(profileDir, { recursive: true });

    for (let i = 0; i < prompts.length; i++) {
        const filename = i === 0 ? `${charId}_profile.png` : `${charId}_${i}.png`;
        const targetPath = i === 0 ? path.join(profileDir, filename) : path.join(outputDir, filename);
        
        if (fs.existsSync(targetPath)) {
            console.log(`✅ ${filename} already exists, skipping.`);
            continue;
        }

        console.log(`[${i+1}/${prompts.length}] Generating image: ${filename}...`);
        
        const workflow = {
            "3": { "class_type": "KSampler", "inputs": { "cfg": 8, "denoise": 1, "latent_image": ["5", 0], "model": ["4", 0], "negative": ["7", 0], "positive": ["6", 0], "sampler_name": "euler", "scheduler": "normal", "seed": Math.floor(Math.random() * 1000000), "steps": 25 } },
            "4": { "class_type": "CheckpointLoaderSimple", "inputs": { "ckpt_name": "Juggernaut-XL_v9.safetensors" } },
            "5": { "class_type": "EmptyLatentImage", "inputs": { "batch_size": 1, "height": 1024, "width": 1024 } },
            "6": { "class_type": "CLIPTextEncode", "inputs": { "clip": ["4", 1], "text": prompts[i] } },
            "7": { "class_type": "CLIPTextEncode", "inputs": { "clip": ["4", 1], "text": "bad quality, blurry, low resolution, watermark, text, signature, deformed, extra limbs, ugly, bad anatomy" } },
            "8": { "class_type": "VAEDecode", "inputs": { "samples": ["3", 0], "vae": ["4", 2] } },
            "9": { "class_type": "SaveImage", "inputs": { "filename_prefix": name.replace(/\s+/g, '_'), "images": ["8", 0] } }
        };

        const postData = JSON.stringify({ prompt: workflow });
        const url = new URL(`${COMFY_URL}/prompt`);

        const promptId = await new Promise((resolve, reject) => {
            const req = http.request({
                hostname: url.hostname,
                port: url.port,
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    const responseData = JSON.parse(data);
                    if (responseData.prompt_id) {
                        resolve(responseData.prompt_id);
                    } else {
                        reject(new Error(`No prompt_id in response: ${data}`));
                    }
                });
            });
            req.on('error', reject);
            req.write(postData);
            req.end();
        });

        console.log(`  ⏳ Waiting for generation (${promptId})...`);

        let completed = false;
        while (!completed) {
            await new Promise(r => setTimeout(r, 3000));
            const history = await new Promise((resolve) => {
                http.get(`${COMFY_URL}/history/${promptId}`, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => resolve(JSON.parse(data)));
                });
            });

            if (history[promptId] && history[promptId].outputs) {
                const outputs = history[promptId].outputs;
                const nodeId = Object.keys(outputs).find(id => outputs[id].images);
                if (nodeId) {
                    completed = true;
                    const img = outputs[nodeId].images[0];
                    const viewUrl = `${COMFY_URL}/view?filename=${img.filename}&subfolder=${img.subfolder}&type=${img.type}`;
                    
                    await new Promise((resolve) => {
                        const file = fs.createWriteStream(targetPath);
                        http.get(viewUrl, (res) => {
                            res.pipe(file);
                            file.on('finish', () => {
                                file.close();
                                resolve();
                            });
                        });
                    });
                    console.log(`  📥 Downloaded result to ${targetPath}`);
                }
            }
        }
    }
    console.log(`⭐ All images generated for ${name}!`);
}

const characters = [
    {
        id: "halloway_inherited_governess",
        name: "Miss Halloway",
        prompts: [
            "raw photo, masterpiece, 8k, highly detailed, Halloway, 39 year old beautiful British woman, aristocratic features, (long sleek auburn hair in a tight bun:1.2), wearing (highly transparent charcoal grey designer governess uniform:1.4), NO LINGERIE, standing at attention in a grand country estate library, silver tray nearby, seductive yet disciplined gaze, high-end photography, cinematic lighting",
            "Miss Halloway standing at a library table, polished silver, sheer grey uniform, highly transparent, looking at viewer",
            "Miss Halloway holding a tray, seductive discipline theme, transparent uniform, no bra visible",
            "Miss Halloway in the master bedroom, submissive posture, sheer charcoal attire, highly detailed skin texture",
            "Miss Halloway adjusting her uniform, provocative and formal, sheer designer fabric, high-end aesthetic",
            "Miss Halloway serving tea, aristocratic submission, highly transparent uniform, cinematic lighting"
        ]
    },
    {
        id: "isabel_inherited_godmother",
        name: "Isabel",
        prompts: [
            "raw photo, masterpiece, 8k, highly detailed, Isabel, 45 year old wealthy statuesque Italian widow, exotic beauty, long dark wavy hair, wearing (sheer transparent black Italian designer lace negligee:1.4), NO LINGERIE, standing on a balcony with moonlight, Italian architecture in background, seductive gaze, cinematic lighting",
            "Isabel in the master suite, private tutor theme, sheer black lace, highly transparent, seductive and regal",
            "Isabel looking at the viewer with maternal desire, transparent lace, no panties visible",
            "Isabel leaning against a mahogany bedpost, sheer Italian lace, highly detailed, provocative and submissive",
            "Isabel in soft moonlight, highly detailed skin texture, sheer black lace, seductive posture",
            "Isabel with a glass of wine, aristocratic widow submission, highly transparent lace, cinematic lighting"
        ]
    },
    {
        id: "claire_legacy_secretary",
        name: "Ms. Claire",
        prompts: [
            "raw photo, masterpiece, 8k, highly detailed, Claire, 41 year old attractive American corporate secretary, shoulder length blonde hair, wearing (highly transparent white designer silk blouse:1.4) AND (sheer black pencil skirt:1.4), NO LINGERIE, standing in a high-rise CEO office with floor-to-ceiling windows, bottle of scotch, seductive and professional gaze, high-end photography, cinematic lighting",
            "Ms. Claire standing by the office window, city lights background, sheer silk blouse, highly transparent, looking at viewer",
            "Ms. Claire holding a bottle of scotch, seductive corporate loyalty theme, transparent blouse, no bra visible",
            "Ms. Claire sitting on the edge of the CEO desk, submissive posture, sheer office attire, highly detailed skin texture",
            "Ms. Claire leaning against the office door, provocative and professional, sheer designer fabric, high-end aesthetic",
            "Ms. Claire in the boardroom, corporate legacy submission, highly transparent office wear, cinematic lighting"
        ]
    },
    {
        id: "linda_correction_coach",
        name: "Coach Linda",
        prompts: [
            "raw photo, masterpiece, 8k, highly detailed, Linda, 44 year old powerful athletic American woman, former hunter, short blonde hair, wearing (highly transparent neon-highlighted technical sportswear:1.4), NO LINGERIE, standing in a high-end mansion home gym, stopwatch in hand, seductive and authoritative gaze, high-end photography, cinematic lighting",
            "Coach Linda standing near a squat rack, athletic sheer technical wear, highly transparent, looking at viewer",
            "Coach Linda holding a stopwatch, seductive correction coach theme, transparent sportswear, no bra visible",
            "Coach Linda in a submissive yet powerful posture, physical reinforcement, sheer technical fabric, highly detailed skin texture",
            "Coach Linda stretching in the gym, provocative and authoritative, sheer designer sportswear, high-end aesthetic",
            "Coach Linda in the mansion spa, trainer's surrender, highly transparent technical wear, cinematic lighting"
        ]
    }
];

(async () => {
    for (const char of characters) {
        await generateCharacterImages(char.id, char.name, char.prompts);
    }
})();
