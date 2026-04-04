const fs = require('fs');
const path = require('path');

const COMFY_URL = 'http://127.0.0.1:8000';
const CKPT = "bigLust_v16.safetensors";
const OUTPUT_DIR_PROFILES = path.join(__dirname, '../src/assets/profiles');
const OUTPUT_DIR_GALLERY = path.join(__dirname, '../src/assets/gallery');

const PONY_PREFIX = "score_9, score_8_up, score_7_up, score_6_up, score_5_up, score_4_up, rating_explicit, ";

const characters = [
    {
        id: 'girlfriend_and_daughter_rivalry',
        prefix: 'elena_maya',
        base: "highly detailed photorealistic portrait of Elena (36yo mature elegant woman, 36D, dark hair) and Maya (18yo slim athletic blonde girl, 34C). They are wearing highly transparent, extremely seductive loungewear WITHOUT LINGERIE. Provocative and competitive expressions, ",
        prompts: [
            "standing together in a modern luxury bedroom, soft amber lighting, both looking at the camera with intense desire, 8k resolution, masterpiece", // Profile
            "Elena and Maya wearing matching sheer silk nightgowns, leaning against each other on a plush bed, both looking up with wide submissive eyes", // 1
            "Elena and Maya wearing tiny, tight yoga sets in a home gym, sweat glistening on their skin, provocative stretching poses, intense physical rivalry", // 2
            "Maya (18yo) kneeling at the user's feet while Elena (36yo) watches with a mix of pride and jealousy, both wearing sheer white lace WITHOUT LINGERIE", // 3
            "Elena and Maya in a shared shower, wet hair and skin, wearing only thin transparent wraps that cling to their curves, looking at you with complete submission", // 4
            "Full body shot of Elena and Maya in a penthouse at night, wearing extreme revealing designer silks, acting as a coordinated duo to please the user, full reveal" // 5
        ]
    }
];

async function generateAll() {
    console.log(`🚀 Starting BigLust Generation for Elena & Maya...`);
    
    for (const char of characters) {
        console.log(`\n--- Character: ${char.id} ---`);
        
        for (let i = 0; i < char.prompts.length; i++) {
            const isProfile = i === 0;
            const filename = isProfile ? `${char.id}_profile_new.png` : `${char.prefix}_new_${i}.png`; // Using 'new' to avoid conflicts
            const targetDir = isProfile ? OUTPUT_DIR_PROFILES : OUTPUT_DIR_GALLERY;
            const fullPrompt = PONY_PREFIX + char.base + char.prompts[i];
            
            console.log(`Generating [${i}/${char.prompts.length-1}]: ${filename}...`);
            
            try {
                const response = await fetch(`${COMFY_URL}/prompt`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        "prompt": {
                            "3": { "class_type": "KSampler", "inputs": { "seed": Math.floor(Math.random() * 1000000), "steps": 50, "cfg": 7, "sampler_name": "dpmpp_2m_sde", "scheduler": "karras", "denoise": 1, "model": ["4", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["5", 0] } },
                            "4": { "class_type": "CheckpointLoaderSimple", "inputs": { "ckpt_name": CKPT } },
                            "5": { "class_type": "EmptyLatentImage", "inputs": { "width": 832, "height": 1216, "batch_size": 1 } },
                            "6": { "class_type": "CLIPTextEncode", "inputs": { "text": fullPrompt, "clip": ["4", 1] } },
                            "7": { "class_type": "CLIPTextEncode", "inputs": { "text": "bad eyes, bad hands, low quality, blurry, deformed, cartoon, anime, 3d, rendering, (worst quality:1.2), (low quality:1.2), (text:1.2), watermark", "clip": ["4", 1] } },
                            "8": { "class_type": "VAEDecode", "inputs": { "samples": ["3", 0], "vae": ["4", 2] } },
                            "9": { "class_type": "SaveImage", "inputs": { "filename_prefix": `gen_em_`, "images": ["8", 0] } }
                        }
                    })
                });

                const data = await response.json();
                const promptId = data.prompt_id;

                if (!promptId) {
                    console.error(`  ❌ Failed to get prompt_id. Response: ${JSON.stringify(data)}`);
                    continue;
                }

                let completed = false;
                while (!completed) {
                    await new Promise(r => setTimeout(r, 4000));
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
    console.log(`\n⭐ All Elena & Maya assets generated!`);
}

generateAll();
