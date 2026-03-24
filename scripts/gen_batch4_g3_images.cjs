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
        id: "dr_elena_family_doctor",
        name: "Dr. Elena",
        prompts: [
            "raw photo, masterpiece, 8k, highly detailed, Elena, 43 year old beautiful American woman, high-end family physician, (long blonde hair in a messy ponytail:1.2), wearing (highly transparent light blue medical scrubs:1.4), NO LINGERIE, standing in a private home clinic guest wing, medical kit open nearby, latex gloves, seductive yet clinical gaze, high-end photography, cinematic lighting",
            "Dr. Elena standing in the guest wing clinic, clinical verification theme, sheer medical scrubs, highly transparent, looking at viewer",
            "Dr. Elena holding medical tools, seductive doctor theme, transparent scrubs, no bra visible",
            "Dr. Elena in a submissive yet authoritative posture, proactive relief, sheer medical attire, highly detailed skin texture",
            "Dr. Elena adjusting her gloves, provocative and clinical, sheer designer scrubs, high-end aesthetic",
            "Dr. Elena performing a checkup, perfect family health verified, highly transparent scrubs, cinematic lighting"
        ]
    },
    {
        id: "thorne_strict_headmistress",
        name: "Mrs. Thorne",
        prompts: [
            "raw photo, masterpiece, 8k, highly detailed, Thorne, 46 year old academic American woman, college director, (spectacles:1.2), (long salt and pepper hair in a sophisticated updo:1.2), wearing (highly transparent charcoal grey designer professional suit:1.4), NO LINGERIE, standing by a fireplace in a grand mahogany study, seductive yet disciplinary gaze, high-end photography, cinematic lighting",
            "Mrs. Thorne standing in her private residence, disciplinary reward theme, sheer professional suit, highly transparent, looking at viewer",
            "Mrs. Thorne holding a glass of wine by the fire, seductive headmistress theme, transparent suit, no bra visible",
            "Mrs. Thorne in a submissive yet authoritative posture, redirected energy, sheer office attire, highly detailed skin texture",
            "Mrs. Thorne adjusting her glasses, provocative and academic, sheer designer fabric, high-end aesthetic",
            "Mrs. Thorne in the grand study, behavior engineered, highly transparent professional suit, cinematic lighting"
        ]
    },
    {
        id: "elena_sinclair_mentor",
        name: "Elena Sinclair",
        prompts: [
            "raw photo, masterpiece, 8k, highly detailed, Elena Sinclair, 43 year old statuesque Tech CEO, former rival, aggressive energy, (long sleek dark hair:1.2), wearing (highly transparent black designer corporate suit:1.4), NO LINGERIE, standing in a high-rise glass penthouse overlooking city, bottle of champagne, seductive yet predatory gaze, high-end photography, cinematic lighting",
            "Elena Sinclair standing in the penthouse, city lights background, aggressive mentorship theme, sheer corporate suit, highly transparent, looking at viewer",
            "Elena Sinclair holding a bottle of champagne, seductive rival theme, transparent suit, no bra visible",
            "Elena Sinclair sitting on a velvet chair, submissive yet dominant posture, sheer office attire, highly detailed skin texture",
            "Elena Sinclair leaning against the glass wall, provocative and corporate, sheer designer fabric, high-end aesthetic",
            "Elena Sinclair in the private lounge, corporate heir rebuilt, highly transparent office wear, cinematic lighting"
        ]
    },
    {
        id: "vivienne_refinement_matron",
        name: "Madame Vivienne",
        prompts: [
            "raw photo, masterpiece, 8k, highly detailed, Vivienne, 44 year old regal European woman, director of elite finishing school, (impeccable blonde hair in a classic bun:1.2), wearing (highly transparent regal silk gown:1.4), NO LINGERIE, standing in a grand drawing room with gold-leaf mirrors and a piano, seductive yet sophisticated gaze, high-end photography, cinematic lighting",
            "Madame Vivienne standing in the mansion drawing room, polishing session theme, sheer silk gown, highly transparent, looking at viewer",
            "Madame Vivienne by the piano, seductive refinement theme, transparent silk gown, no bra visible",
            "Madame Vivienne in a submissive yet regal posture, arts of pleasure, sheer silk fabric, highly detailed skin texture",
            "Madame Vivienne adjusting her dress, provocative and sophisticated, sheer designer silk, high-end aesthetic",
            "Madame Vivienne in the ballroom, refinement complete, highly transparent silk gown, cinematic lighting"
        ]
    },
    {
        id: "sterling_surrogate_sisters",
        name: "The Sterling Sisters",
        prompts: [
            "raw photo, masterpiece, 8k, highly detailed, two beautiful mature American women standing together: Martha (42) and Beatrice (44), corporate matriarchs, (expensive jewelry:1.2), wearing (highly transparent matching charcoal designer office-wear:1.4), NO LINGERIE, standing in a private boardroom, bottle of scotch, seductive and authoritative gaze, high-end photography, cinematic lighting",
            "The Sterling Sisters standing together in the boardroom, shared relief theme, sheer office wear, highly transparent, looking at viewer",
            "The Sterling Sisters holding glasses of scotch, seductive corporate surrogate theme, transparent office attire, no bras visible",
            "The Sterling Sisters in a submissive yet authoritative posture, legacy protection, sheer corporate fabric, highly detailed skin textures",
            "The Sterling Sisters adjusting each other's collars, provocative and professional, sheer designer office-wear, high-end aesthetic",
            "The Sterling Sisters in the mansion library, legacy secured by the duo, highly transparent office wear, cinematic lighting"
        ]
    }
];

(async () => {
    for (const char of characters) {
        await generateCharacterImages(char.id, char.name, char.prompts);
    }
})();
