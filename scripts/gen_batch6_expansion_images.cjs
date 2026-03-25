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
            await new Promise(r => setTimeout(r, 3000));
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
        id: 'grace_stepmom_storm',
        appearance: "34yo platinum blonde woman, wide panicked grey eyes, pale skin, masterpiece, photorealistic, 8k",
        clothes: "transparent pink silk robe, no lingerie, wet skin",
        scenes: ["dark bedroom, single candle, shadows", "under bed covers, frightened look", "hallway in lightning flash", "window with rain, backlit", "bedside, clinging to sheets", "shadowy corner, suggestive posture"]
    },
    {
        id: 'maya_stepsister_gym',
        appearance: "22yo blonde woman, sweaty athletic build, flushed face, ponytail, masterpiece, photorealistic, 8k",
        clothes: "highly transparent white tank top, wet from sweat, micro denim shorts",
        scenes: ["home gym, leaning on bench", "squat rack, heaving chest", "gym floor, sitting with water bottle", "workout bench, looking up", "treadmill background, backlit", "gym mirror, adjusting hair"]
    },
    {
        id: 'serena_aunt_yoga',
        appearance: "38yo chestnut haired woman, extraordinarily flexible, calm intense eyes, masterpiece, photorealistic, 8k",
        clothes: "highly transparent purple yoga leotard, no lingerie",
        scenes: ["sunroom, yoga downward dog pose", "yoga mat, deep stretch", "standing split, sunroom window", "seated meditation pose, backlit", "low lunge, looking at camera", "yoga studio lighting, soft shadows"]
    },
    {
        id: 'lily_cousin_beach',
        appearance: "24yo blonde surfer girl, tanned skin, messy hair, bright blue eyes, masterpiece, photorealistic, 8k",
        clothes: "tiny white string bikini, highly transparent when wet, sunblock on skin",
        scenes: ["beach house deck, sun-drenched", "lounging on towel, holding oil", "outdoor shower, wet hair", "beach house railing, sea background", "hammock, looking over shoulder", "sunset deck, golden hour"]
    },
    {
        id: 'diana_stepmom_morning',
        appearance: "35yo brunette woman, smooth skin, pouty lips, wavy hair, masterpiece, photorealistic, 8k",
        clothes: "transparent pink silk robe, open, no lingerie, sleepy look",
        scenes: ["dim kitchen, 6am, indicator lights", "leaning on counter, holding cup", "espresso machine, steam around", "kitchen window, early light", "pantry doorway, looking back", "morning shadows, soft lighting"]
    },
    {
        id: 'sophie_stepsister_laundry',
        appearance: "21yo honey-blonde girl, freckles, flushed face, messy hair, masterpiece, photorealistic, 8k",
        clothes: "highly transparent white tank top, tight denim micro-shorts, looking flustered",
        scenes: ["cramped laundry room, bending over machine", "between dryer and wall, stuck", "laundry basket background, backlit", "sitting on washer, heat haze", "laundry room doorway, looking flustered", "utility room, low angle"]
    },
    {
        id: 'elena_moms_friend_massage',
        appearance: "42yo elegant woman, high cheekbones, dark eyes, dark bob haircut, masterpiece, photorealistic, 8k",
        clothes: "highly transparent black lace cocktail dress, no lingerie, shoulder exposed",
        scenes: ["guest bedroom, sitting on bed", "shoulders slumped, looking tired", "turning back to camera, neck exposed", "bedside lamp lighting, soft shadows", "vanity mirror reflection", "dressing room doorway, suggestive"]
    },
    {
        id: 'rachel_stepmom_moving',
        appearance: "33yo auburn haired woman, hazel eyes, sweaty skin, flustered look, masterpiece, photorealistic, 8k",
        clothes: "highly transparent white tank top, tight black leggings, wet from effort",
        scenes: ["empty living room with boxes, sitting on floor", "leaning on crates, heaving chest", "empty hallway, echoes", "doorway of new room, looking back", "unpacked kitchen, backlit", "cardboard box background, soft lighting"]
    }
];

async function run() {
    console.log(`🚀 Starting Batch 6 Expansion Generation (8 Characters)...`);
    const profilesOnly = process.argv.includes('--profiles-only');
    
    for (const char of characters) {
        console.log(`\n--- Character: ${char.id} ---`);
        
        // Profile
        const profilePath = path.join(OUTPUT_DIR, `${char.id}_profile.png`);
        const profilePrompt = `${char.appearance}, ${char.clothes}, ${char.scenes[0]}, cinematic lighting, highly detailed skin`;
        await generateImage(profilePrompt, profilePath);

        if (!profilesOnly) {
            // Gallery 1-5
            for (let i = 0; i < 5; i++) {
                const galleryPath = path.join(GALLERY_DIR, `${char.id}_${i + 1}.png`);
                const galleryPrompt = `${char.appearance}, ${char.clothes}, ${char.scenes[i + 1]}, evocative lighting, sharp focus, masterpiece`;
                await generateImage(galleryPrompt, galleryPath);
            }
        }
    }
    console.log("\n⭐ Batch 6 Expansion Generation Complete!");
}

run();
