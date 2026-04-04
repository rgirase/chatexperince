const fs = require('fs');
const path = require('path');

const characterId = 'malia_secret_reunion';
const folderDefinitionsPath = path.join(__dirname, 'group_definitions.json');
const outputDirProfiles = path.join(__dirname, '../public/assets/profiles');
const outputDirGallery = path.join(__dirname, '../public/gallery');

async function generateCharacter() {
    console.log(`🚀 Starting Generation for character Malia (Unique Redhead)...`);
    
    // Read group definitions
    const definitions = JSON.parse(fs.readFileSync(folderDefinitionsPath, 'utf8'));
    const charDef = definitions.find(d => d.id === characterId);
    
    if (!charDef) {
        console.error(`❌ Character definition for ${characterId} not found!`);
        return;
    }

    // Prepare 6 tasks: 1 Profile (based on prompt 1) + 5 Gallery
    const tasks = [
        { name: `${characterId}_profile.png`, prompt: charDef.prompts[0], target: outputDirProfiles },
        { name: `${characterId}_1.png`, prompt: charDef.prompts[0], target: outputDirGallery },
        { name: `${characterId}_2.png`, prompt: charDef.prompts[1], target: outputDirGallery },
        { name: `${characterId}_3.png`, prompt: charDef.prompts[2], target: outputDirGallery },
        { name: `${characterId}_4.png`, prompt: charDef.prompts[3], target: outputDirGallery },
        { name: `${characterId}_5.png`, prompt: charDef.prompts[4], target: outputDirGallery }
    ];

    for (const task of tasks) {
        console.log(`--- Generating: ${task.name} ---`);
        try {
            console.log(`  Queuing prompt...`);
            const response = await fetch('http://127.0.0.1:8000/prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    "prompt": {
                        "3": { "class_type": "KSampler", "inputs": { "seed": Math.floor(Math.random() * 1000000), "steps": 50, "cfg": 7, "sampler_name": "dpmpp_2m_sde", "scheduler": "karras", "denoise": 1, "model": ["4", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["5", 0] } },
                            "4": { "class_type": "CheckpointLoaderSimple", "inputs": { "ckpt_name": "bigLust_v16.safetensors" } },
                        "5": { "class_type": "EmptyLatentImage", "inputs": { "width": 832, "height": 1216, "batch_size": 1 } },
                        "6": { "class_type": "CLIPTextEncode", "inputs": { "text": `photo (medium), 8k, high quality, cinematic, from above, ${task.prompt}`, "clip": ["4", 1] } },
                        "7": { "class_type": "CLIPTextEncode", "inputs": { "text": "bad eyes, bad hands, low quality, blurry, deformed, cartoon, anime, 3d, rendering", "clip": ["4", 1] } },
                        "8": { "class_type": "VAEDecode", "inputs": { "samples": ["3", 0], "vae": ["4", 2] } },
                        "9": { "class_type": "SaveImage", "inputs": { "filename_prefix": `new_premium_`, "images": ["8", 0] } }
                    }
                })
            });

            const data = await response.json();
            const promptId = data.prompt_id;
            console.log(`  ⏳ Prompt queued (ID: ${promptId}). Waiting for completion...`);

            // Poll for completion
            let completed = false;
            while (!completed) {
                await new Promise(r => setTimeout(r, 2000));
                const statusResponse = await fetch(`http://127.0.0.1:8000/history/${promptId}`);
                const history = await statusResponse.json();
                if (history[promptId]) {
                    completed = true;
                    const filename = history[promptId].outputs[9].images[0].filename;
                    console.log(`  📥 Downloading: ${filename}...`);
                    
                    // Fetch the actual image
                    const imgResponse = await fetch(`http://127.0.0.1:8000/view?filename=${filename}`);
                    const arrayBuffer = await imgResponse.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    
                    const finalPath = path.join(task.target, task.name);
                    fs.writeFileSync(finalPath, buffer);
                    console.log(`  ✅ Successfully saved: ${task.name}`);
                }
            }
        } catch (err) {
            console.error(`❌ Error during generation for ${task.name}:`, err.message);
        }
    }

    console.log(`\n⭐ Character asset generation complete!`);
}

generateCharacter();
