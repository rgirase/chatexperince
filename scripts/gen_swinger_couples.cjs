const fs = require('fs');
const path = require('path');

const COMFY_URL = 'http://127.0.0.1:8000';
const CKPT = "bigLust_v16.safetensors";
const OUTPUT_DIR_PROFILES = path.join(__dirname, '../src/assets/profiles'); // App assets
const OUTPUT_DIR_GALLERY = path.join(__dirname, '../public/gallery'); // Public gallery

const PONY_PREFIX = "score_9, score_8_up, score_7_up, score_6_up, score_5_up, score_4_up, rating_explicit, ";

const characters = [
    {
        id: 'swinger_couple_ayesha',
        prefix: 'ayesha',
        base: "stunningly beautiful 30yo Indian woman, voluptuous hourglass figure (36D-24-40), tan glowing skin, long dark wavy hair, intense burning eyes, uninhibited desire, ",
        prompts: [
            "wearing a modern revealing designer saree with a backless blouse, standing in a luxurious penthouse bedroom at night with amber lighting, highly detailed portrait", // Profile
            "wearing a revealing bodycon party dress, standing in a high-end club lounge, sultry expression", // 1
            "wearing a transparent designer floral saree, no blouse underneath, highly provocative, luxury living room", // 2
            "wearing black swinger club latex outfit, strappy and open, standing in a dimly lit playroom", // 3
            "wearing an extreme red lace lingerie set, transparent, standing in front of a mirror", // 4
            "standing in a public swinger event, wearing only a small sheer wrap, being admired by onlookers, full body reveal" // 5
        ]
    },
    {
        id: 'swinger_couple_tiffany',
        prefix: 'tiffany',
        base: "breathtaking 28yo American woman, long blonde hair, bright blue eyes, athletic and voluptuous bombshell figure (34DD-24-38), sultry expression, ",
        prompts: [
            "wearing a low-cut cocktail dress, standing in a high-end swinger's club lounge, highly detailed portrait", // Profile
            "wearing a low-cut black cocktail dress, holding a martini glass, flirtatious gaze", // 1
            "wearing a tiny pink string bikini, standing by a private swimming pool, wet skin", // 2
            "wearing a club-themed black lace outfit, sheer and provocative, standing on a dance floor", // 3
            "wearing a transparent white lace bodysuit, standing in a sunlit bedroom", // 4
            "standing in a shared swinger suite, wearing a very sheer robe open at the front, provocative pose, full gallery shoot" // 5
        ]
    }
];

async function generateAll() {
    console.log(`🚀 Starting BigLust Generation for Swinger Couples...`);
    
    for (const char of characters) {
        console.log(`\n--- Character: ${char.id} ---`);
        
        for (let i = 0; i < char.prompts.length; i++) {
            const isProfile = i === 0;
            const filename = isProfile ? `${char.id}_profile.png` : `${char.prefix}_${i}.png`;
            const targetDir = isProfile ? OUTPUT_DIR_PROFILES : OUTPUT_DIR_GALLERY;
            const fullPrompt = PONY_PREFIX + char.base + char.prompts[i];
            
            console.log(`Generating [${i}/${char.prompts.length-1}]: ${filename}...`);
            
            try {
                const response = await fetch(`${COMFY_URL}/prompt`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        "prompt": {
                            "3": { "class_type": "KSampler", "inputs": { "seed": Math.floor(Math.random() * 1000000), "steps": 35, "cfg": 7, "sampler_name": "dpmpp_2m_sde", "scheduler": "karras", "denoise": 1, "model": ["4", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["5", 0] } },
                            "4": { "class_type": "CheckpointLoaderSimple", "inputs": { "ckpt_name": CKPT } },
                            "5": { "class_type": "EmptyLatentImage", "inputs": { "width": 832, "height": 1216, "batch_size": 1 } },
                            "6": { "class_type": "CLIPTextEncode", "inputs": { "text": fullPrompt, "clip": ["4", 1] } },
                            "7": { "class_type": "CLIPTextEncode", "inputs": { "text": "bad eyes, bad hands, low quality, blurry, deformed, cartoon, anime, 3d, rendering, (worst quality:1.2), (low quality:1.2)", "clip": ["4", 1] } },
                            "8": { "class_type": "VAEDecode", "inputs": { "samples": ["3", 0], "vae": ["4", 2] } },
                            "9": { "class_type": "SaveImage", "inputs": { "filename_prefix": `gen_`, "images": ["8", 0] } }
                        }
                    })
                });

                const data = await response.json();
                const promptId = data.prompt_id;

                let completed = false;
                while (!completed) {
                    await new Promise(r => setTimeout(r, 3000));
                    const statusRes = await fetch(`${COMFY_URL}/history/${promptId}`);
                    const history = await statusRes.json();
                    if (history[promptId]) {
                        completed = true;
                        const genFilename = history[promptId].outputs[9].images[0].filename;
                        
                        const imgRes = await fetch(`${COMFY_URL}/view?filename=${genFilename}`);
                        const arrayBuffer = await imgRes.arrayBuffer();
                        const buffer = Buffer.from(arrayBuffer);
                        
                        const finalPath = path.join(targetDir, filename);
                        if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
                        fs.writeFileSync(finalPath, buffer);
                        console.log(`  ✅ Saved: ${filename}`);
                    }
                }
            } catch (err) {
                console.error(`  ❌ Error:`, err.message);
            }
        }
    }
    console.log(`\n⭐ All assets generated successfully!`);
}

generateAll();
