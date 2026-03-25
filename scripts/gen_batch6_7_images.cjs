const fs = require('fs');
const path = require('path');

const COMFY_URL = 'http://localhost:8000';
const OUTPUT_DIR = path.join(__dirname, '../public/gallery');
const PROMPTS_FILE = path.join(__dirname, '../character_prompts.json');

const workflow = {
    "3": { "inputs": { "seed": 0, "steps": 25, "cfg": 7, "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": 1, "model": ["4", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["5", 0] }, "class_type": "KSampler" },
    "4": { "inputs": { "ckpt_name": "Juggernaut-XL_v9.safetensors" }, "class_type": "CheckpointLoaderSimple" },
    "5": { "inputs": { "width": 832, "height": 1216, "batch_size": 1 }, "class_type": "EmptyLatentImage" },
    "6": { "inputs": { "text": "", "clip": ["4", 1] }, "class_type": "CLIPTextEncode" },
    "7": { "inputs": { "text": "lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, cartoon, anime, sketch", "clip": ["4", 1] }, "class_type": "CLIPTextEncode" },
    "8": { "inputs": { "samples": ["3", 0], "vae": ["4", 2] }, "class_type": "VAEDecode" },
    "9": { "inputs": { "filename_prefix": "BatchGen", "images": ["8", 0] }, "class_type": "SaveImage" }
};

async function generateImage(prompt, filename) {
    const currentWorkflow = JSON.parse(JSON.stringify(workflow));
    currentWorkflow["6"].inputs.text = prompt;
    currentWorkflow["3"].inputs.seed = Math.floor(Math.random() * 1000000000);

    try {
        const response = await fetch(`${COMFY_URL}/prompt`, {
            method: 'POST',
            body: JSON.stringify({ prompt: currentWorkflow })
        });
        const data = await response.json();
        const promptId = data.prompt_id;

        console.log(`Queued: ${filename} (Prompt ID: ${promptId})`);

        let completed = false;
        while (!completed) {
            await new Promise(r => setTimeout(r, 2000));
            const historyRes = await fetch(`${COMFY_URL}/history/${promptId}`);
            const history = await historyRes.json();
            
            if (history[promptId]) {
                const images = history[promptId].outputs["9"].images;
                if (images && images.length > 0) {
                    const imgData = images[0];
                    const viewRes = await fetch(`${COMFY_URL}/view?filename=${imgData.filename}&subfolder=${imgData.subfolder}&type=${imgData.type}`);
                    const buffer = Buffer.from(await viewRes.arrayBuffer());
                    fs.writeFileSync(path.join(OUTPUT_DIR, filename), buffer);
                    console.log(`Success: Saved ${filename}`);
                    completed = true;
                }
            }
        }
    } catch (e) {
        console.error(`Error generating ${filename}:`, e.message);
    }
}

async function run() {
    if (!fs.existsSync(PROMPTS_FILE)) {
        console.error("Prompts file not found!");
        return;
    }

    const characters = JSON.parse(fs.readFileSync(PROMPTS_FILE, 'utf8'));
    const ids = Object.keys(characters);

    console.log(`Starting generation for ${ids.length} characters (100 images total)...`);

    for (const id of ids) {
        const char = characters[id];
        console.log(`\n--- Character: ${char.name} (${id}) ---`);
        
        for (let i = 0; i < char.wardrobe.length; i++) {
            const outfit = char.wardrobe[i];
            const filename = `${id}_${i + 1}.png`;
            
            if (fs.existsSync(path.join(OUTPUT_DIR, filename))) {
                console.log(`Skipping: ${filename} already exists.`);
                continue;
            }

            const prompt = `masterpiece, best quality, photorealistic, 8k, cinematic lighting, ${char.appearance}, wearing ${outfit}`;
            await generateImage(prompt, filename);
        }
    }

    console.log("\nBatch generation complete!");
}

run();
