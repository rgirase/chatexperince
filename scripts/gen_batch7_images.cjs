const fs = require('fs');
const path = require('path');
const http = require('http');

// Configuration
const COMFY_URL = 'http://127.0.0.1:8000';
const OUTPUT_DIR = path.join(__dirname, '../public/assets/profiles');
const GALLERY_DIR = path.join(__dirname, '../public/gallery');
const WORKFLOW_PATH = path.join(__dirname, '../comfy_workflow_sdxl.json');

// Ensure directories exist
[OUTPUT_DIR, GALLERY_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

async function generateImage(prompt, targetPath) {
    if (fs.existsSync(targetPath)) {
        console.log(` ⏩ Skipping existing: ${path.basename(targetPath)}`);
        return;
    }

    console.log(` 🎨 Generating: ${path.basename(targetPath)}`);
    const workflow = JSON.parse(fs.readFileSync(WORKFLOW_PATH, 'utf8'));
    
    // Update workflow nodes for SDXL
    workflow['6'].inputs.text = prompt;
    workflow['3'].inputs.seed = Math.floor(Math.random() * 1000000000);
    
    const postData = JSON.stringify({ prompt: workflow });
    
    try {
        const promptId = await new Promise((resolve, reject) => {
            const req = http.request(`${COMFY_URL}/prompt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    const resp = JSON.parse(data);
                    if (resp.prompt_id) resolve(resp.prompt_id);
                    else reject(new Error('No prompt_id in response'));
                });
            });
            req.on('error', reject);
            req.write(postData);
            req.end();
        });

        console.log(`   Prompt queued: ${promptId}`);

        let completed = false;
        while (!completed) {
            await new Promise(r => setTimeout(r, 4000));
            const history = await new Promise(resolve => {
                http.get(`${COMFY_URL}/history/${promptId}`, res => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => resolve(JSON.parse(data)));
                }).on('error', () => resolve({}));
            });

            if (history[promptId] && history[promptId].outputs) {
                const outputs = history[promptId].outputs;
                const nodeId = Object.keys(outputs).find(id => outputs[id].images);
                if (nodeId) {
                    completed = true;
                    const img = outputs[nodeId].images[0];
                    const viewUrl = `${COMFY_URL}/view?filename=${img.filename}&subfolder=${img.subfolder}&type=${img.type}`;
                    
                    await new Promise((resolve, reject) => {
                        const file = fs.createWriteStream(targetPath);
                        http.get(viewUrl, res => {
                            res.pipe(file);
                            file.on('finish', () => {
                                file.close();
                                console.log(`   Saved: ${targetPath}`);
                                resolve();
                            });
                        }).on('error', reject);
                    });
                }
            }
        }
    } catch (error) {
        console.error(`   Error: ${error.message}`);
    }
}

const characters = [
    {
        id: 'sophia_sister_returned',
        appearance: "32yo stunning brunette woman, dark intelligent eyes, disheveled chestnut hair, masterpiece, photorealistic, 8k",
        clothes: "oversized white button-down shirt, no pants, bare legs, wine glass in hand",
        scenes: ["kitchen counter at night, dim light", "leaning on counter, looking cynical", "sitting on counter, legs dangling", "hallway doorway, backlight", "living room sofa, vulnerable look", "kitchen window, soft moonlight"]
    },
    {
        id: 'eleanor_step_grandma',
        appearance: "48yo blonde woman, silver-streaked hair, sharp blue eyes, flawless skin, masterpiece, photorealistic, 8k",
        clothes: "tight black silk floor-length gown, low cut, high-end jewelry",
        scenes: ["grand library, mahogany desk background", "walking around desk, regal posture", "standing close, intense gaze", "fireplace background, warm glow", "library shelves, looking back", "study doorway, authoritative"]
    },
    {
        id: 'olivia_sister_in_law',
        appearance: "29yo honey-blonde woman, hazel eyes, pale skin, wavy hair, masterpiece, photorealistic, 8k",
        clothes: "tight silk sleep-shirt, short, no lingerie, vulnerable look",
        scenes: ["master bedroom, soft lighting, rain on window", "sitting on edge of bed, legs tucked", "bedroom doorway, looking desperate", "vanity mirror reflection, soft look", "bedside lamp glow, intimate", "window seat, looking out holding pillow"]
    },
    {
        id: 'mrs_ross_landlady',
        appearance: "45yo raven haired woman, severe beauty, dark eyes, tight bun, masterpiece, photorealistic, 8k",
        clothes: "tight black pencil skirt, white silk blouse, wet from steam, clipboard in hand",
        scenes: ["bathroom doorway, steam billowns", "standing in bathroom, looking professional", "reaching for shower handle, close up", "hallway outside bathroom, backlit", "living room, checking clipboard", "bathroom mirror, steam haze"]
    },
    {
        id: 'victoria_boss_wife',
        appearance: "36yo raven haired woman, glamorous, dark calculating eyes, masterpiece, photorealistic, 8k",
        clothes: "tight red silk cocktail dress, liquid look, diamonds",
        scenes: ["penthouse office, pitch black, moonlight", "standing by windows, city view", "sitting on executive desk, bourbon glass", "office doorway, shadows", "leaning against window, backlit", "moonlit office, seductive posture"]
    },
    {
        id: 'claudia_family_friend',
        appearance: "40yo auburn haired woman, flashing eyes, full lips, masterpiece, photorealistic, 8k",
        clothes: "tight black silk mini-dress, far too short, provocative",
        scenes: ["dark hallway, guest room door", "leaning on doorframe, drink in hand", "hallway shadows, playful smile", "bedroom interior, soft lamp", "standing close in hallway, backlit", "wink at camera, suggestive"]
    },
    {
        id: 'skylar_step_cousin',
        appearance: "21yo blonde girl, blue streaks in hair, tan skin, bikini lines, masterpiece, photorealistic, 8k",
        clothes: "tiny string bikini, white, wet from pool",
        scenes: ["pool edge, diving board background, sun", "surfacing from water, looking up", "climbing out of pool, water dripping", "poolside lounge, sun-drenched", "summer house deck, backlit", "swimming pool, underwater look"]
    },
    {
        id: 'matron_vance',
        appearance: "44yo raven haired woman, severe blue eyes, pale skin, tight bun, masterpiece, photorealistic, 8k",
        clothes: "severe grey manager uniform suit, skirt, silk scarf",
        scenes: ["heavy oak study, book in hand", "heels clicking on stone floor", "standing close, authoritative gaze", "study fireplace, dark shadows", "loosening collar, gaze dropping", "locked study door background"]
    },
    {
        id: 'coach_kira_trainer',
        appearance: "39yo brunette woman, green eyes, short athletic hair, athletic build, masterpiece, photorealistic, 8k",
        clothes: "tight black leggings, sports bra, sweaty skin, athletic oil",
        scenes: ["private home gym, weight bench", "standing close, spotting posture", "hands on chest, correction pose", "gym mirror reflection, sweaty", "towel over shoulders, post-workout", "gym doorway, shadows"]
    },
    {
        id: 'piper_stepsister_stuck',
        appearance: "23yo hazel eyed woman, manicured, polished beauty, masterpiece, photorealistic, 8k",
        clothes: "tight backless designer dress, black silk, stuck zipper at back",
        scenes: ["bedroom, full-length mirror reflection", "back turned, hands reaching for zipper", "spinning around, flustered face", "vanity light glow, smooth skin", "looking over shoulder, suggestive", "bedroom doorway, calling for help"]
    },
    {
        id: 'aunt_jenna_neighbor',
        appearance: "41yo blonde woman, blue eyes, damp hair, pale skin, masterpiece, photorealistic, 8k",
        clothes: "single white towel, wrapped tight, wet skin",
        scenes: ["living room sofa, clutching towel", "fingers trembling, glass of water", "blushing face, looking up", "sofa edge, towel slipping slightly", "living room window, looking out", "hallway, fresh from shower look"]
    }
];

async function run() {
    console.log(`🚀 Starting Batch 7 Generation (11 Characters)...`);
    const profilesOnly = process.argv.includes('--profiles-only');
    
    for (const char of characters) {
        console.log(`\n--- Character: ${char.id} ---`);
        
        // Profile
        const profilePath = path.join(OUTPUT_DIR, `${char.id}_profile.png`);
        const profilePrompt = `${char.appearance}, ${char.clothes}, ${char.scenes[0]}, cinematic lighting, high tension, evocative`;
        await generateImage(profilePrompt, profilePath);

        if (!profilesOnly) {
            // Gallery 1-5
            for (let i = 0; i < 5; i++) {
                const galleryPath = path.join(GALLERY_DIR, `${char.id}_${i + 1}.png`);
                const galleryPrompt = `${char.appearance}, ${char.clothes}, ${char.scenes[i + 1]}, masterpiece, sharp focus, 8k, seductive`;
                await generateImage(galleryPrompt, galleryPath);
            }
        }
    }
    console.log("\n⭐ Batch 7 Generation Complete!");
}

run();
