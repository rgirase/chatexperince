const fs = require('fs');
const path = require('path');
const http = require('http');

// Configuration
const COMFY_URL = 'http://127.0.0.1:8000';
const GALLERY_DIR = path.join(__dirname, '../public/gallery');
const WORKFLOW_PATH = path.join(__dirname, '../comfy_workflow_sdxl.json');

// Ensure directories exist
if (!fs.existsSync(GALLERY_DIR)) fs.mkdirSync(GALLERY_DIR, { recursive: true });

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
    // Batch 6 Original
    { id: 'melanie_stepmom_cabin', appearance: "36yo stunning woman, long blonde hair, piercing blue eyes, masterpiece, photorealistic, 8k", clothes: "highly transparent white silk nightie, no lingerie, wet skin", scenes: ["cabin bedroom, single lantern, shadows", "under heavy blankets, looking scared", "hallway in lightning flash", "bedside, clinging to sheets", "sitting on rug by fireplace, backlit"] },
    { id: 'jade_stepsister_dorm', appearance: "20yo brunette girl, messy hair, glasses, masterpieces, photorealistic, 8k", clothes: "oversized hoodie, highly transparent micro-shorts, looking flustered", scenes: ["dorm room bunk bed, close quarters", "shared desk, studying at 2am", "dorm hallway, backlit", "closet doorway, looking back", "dorm room window, moonlight"] },
    { id: 'victoria_aunt_estate', appearance: "40yo elegant woman, dark eyes, dark ponytail, masterpieces, photorealistic, 8k", clothes: "highly transparent silk floor-length gown, low cut", scenes: ["grand library, mahogany, shadows", "standing by fireplace, warm glow", "estate balcony, rain background", "doorway of master bedroom", "library ladder, looking down"] },
    { id: 'chloe_cousin_roadtrip', appearance: "21yo blonde girl, messy hair, bright eyes, masterpieces, photorealistic, 8k", clothes: "tiny denim shorts, highly transparent white tank top", scenes: ["dim motel room, single lamp", "motel bed, looking up", "car backseat, backlit", "motel window, neon sign glow", "standing by motel door, shadows"] },
    { id: 'isabella_stepmom_office', appearance: "34yo raven haired woman, glamorous, dark eyes, masterpieces, photorealistic, 8k", clothes: "tight red pencil skirt, highly transparent silk blouse", scenes: ["dimly lit office, city lights background", "sitting on desk, low angle", "office elevator lobby, shadows", "conference room, night view", "office window, backlit silhouette"] },
    { id: 'vanessa_step_aunt_wedding', appearance: "38yo chestnut hair, elegant updo, masterpieces, photorealistic, 8k", clothes: "highly transparent lace wedding guest dress, low cut", scenes: ["wedding reception tent, strings of lights", "hidden garden corner, shadows", "hotel hallway, tipsy look", "dressing room, mirror reflection", "tent doorway, backlit"] },
    { id: id => id, appearance: "22yo blonde girl, freckles, messy hair, masterpieces, photorealistic, 8k", clothes: "highly transparent tank top, micro denim shorts", scenes: ["dusty attic, boxes around", "trapped in corner, looking flustered", "attic window, single light beam", "leaning on crates, heaving chest", "attic doorway, shadows"] }, // Error in id: 'madison_cousin_attic'
    { id: 'sarah_aunt_divorce', appearance: "35yo brunette, emerald eyes, masterpieces, photorealistic, 8k", clothes: "highly transparent black lace negligee", scenes: ["guest bedroom, night, soft light", "sitting on bed edge, looking sad", "bedroom window, moonlight", "standing by door, hesitant look", "dressing room, soft glow"] },
    { id: 'claire_stepmom_study', appearance: "34yo raven hair, glasses, masters, photorealistic, 8k", clothes: "highly transparent white button-down shirt, no pants", scenes: ["home study, books background", "leaning on desk, looking up", "study library ladder, shadows", "study window, night view", "doorway of study, backlit"] },
    { id: 'isabel_moms_friend', appearance: "40yo blonde woman, warm eyes, masters, photorealistic, 8k", clothes: "highly transparent silk slip-dress", scenes: ["kitchen at midnight, dim lights", "leaning on fridge, holding wine", "kitchen island, looking playful", "hallway outside guest room", "living room sofa, shadows"] },
    { id: 'evelyn_stepmom_swim', appearance: "33yo brunette, tanned skin, masters, photorealistic, 8k", clothes: "highly transparent white string bikini when wet", scenes: ["swimming pool at night, blue glow", "climbing out of pool, water dripping", "poolside lounger, moonlight", "patio doorway, wet hair", "pool edge, backlit"] },
    { id: 'nora_stepsister_funeral', appearance: "23yo dark haired girl, pale skin, masters, photorealistic, 8k", clothes: "highly transparent black lace dress", scenes: ["living room, dim funeral gathering", "clinging to user in shadows", "dark hallway, looking up", "funeral home guest room", "window overlooking garden, night"] },
    
    // Batch 7
    { id: 'sophia_sister_returned', appearance: "32yo stunning brunette woman, dark intelligent eyes, masters, photorealistic, 8k", clothes: "oversized white button-down shirt, no pants", scenes: ["kitchen counter at night, dim light", "leaning on counter, looking cynical", "sitting on counter, legs dangling", "hallway doorway, backlight", "living room sofa, vulnerable look"] },
    { id: 'eleanor_step_grandma', appearance: "48yo blonde woman, silver-streaked hair, masters, photorealistic, 8k", clothes: "tight black silk floor-length gown, low cut", scenes: ["grand library, mahogany desk", "walking around desk, regal posture", "standing close, intense gaze", "fireplace background, warm glow", "library shelves, looking back"] },
    { id: 'olivia_sister_in_law', appearance: "29yo honey-blonde woman, masters, photorealistic, 8k", clothes: "tight silk sleep-shirt, short, no lingerie", scenes: ["master bedroom, rain on window", "sitting on edge of bed, legs tucked", "bedroom doorway, looking desperate", "vanity mirror reflection", "bedside lamp glow"] },
    { id: 'mrs_ross_landlady', appearance: "45yo raven haired woman, severe beauty, masters, photorealistic, 8k", clothes: "tight black pencil skirt, white silk blouse, wet from steam", scenes: ["bathroom doorway, steam", "standing in bathroom, professional look", "reaching for shower handle, close up", "hallway outside bathroom, backlit", "living room, checking clipboard"] },
    { id: 'victoria_boss_wife', appearance: "36yo raven haired woman, glamorous, masters, photorealistic, 8k", clothes: "tight red silk cocktail dress", scenes: ["penthouse office, pitch black, moonlight", "standing by windows, city view", "sitting on executive desk, bourbon", "office doorway, shadows", "leaning against window, backlit"] },
    { id: 'claudia_family_friend', appearance: "40yo auburn haired woman, flashing eyes, masters, photorealistic, 8k", clothes: "tight black silk mini-dress", scenes: ["dark hallway, guest room door", "leaning on doorframe, drink in hand", "hallway shadows, playful smile", "bedroom interior, soft lamp", "standing close in hallway, backlit"] },
    { id: 'skylar_step_cousin', appearance: "21yo blonde girl, blue streaks, tan skin, masters, photorealistic, 8k", clothes: "tiny string bikini, white, wet from pool", scenes: ["pool edge, diving board background", "surfacing from water, looking up", "climbing out of pool, dripping", "poolside lounge, sun-drenched", "summer house deck, backlit"] },
    { id: 'matron_vance', appearance: "44yo raven haired woman, severe blue eyes, masters, photorealistic, 8k", clothes: "severe grey manager uniform skirt suit", scenes: ["heavy oak study, book in hand", "heels clicking on stone floor", "standing close, authoritative gaze", "study fireplace, dark shadows", "loosening collar, gaze dropping"] },
    { id: 'coach_kira_trainer', appearance: "39yo brunette woman, masters, photorealistic, 8k", clothes: "tight black leggings, sports bra, sweaty", scenes: ["private home gym, weight bench", "standing close, spotting posture", "hands on chest, correction pose", "gym mirror reflection, sweaty", "towel over shoulders"] },
    { id: 'piper_stepsister_stuck', appearance: "23yo hazel eyes, polished beauty, masters, photorealistic, 8k", clothes: "tight backless designer dress, black silk", scenes: ["bedroom, full-length mirror", "back turned, hands reaching zipper", "spinning around, flustered face", "vanity light glow, smooth skin", "looking over shoulder"] },
    { id: 'aunt_jenna_neighbor', appearance: "41yo blonde woman, blue eyes, masters, photorealistic, 8k", clothes: "single white towel, wrapped tight", scenes: ["living room sofa, clutching towel", "fingers trembling, glass of water", "blushing face, looking up", "sofa edge, towel slipping", "living room window, looking out"] }
];

async function run() {
    console.log(`🚀 Starting Full Gallery Generation for 31 Characters (155 Assets)...`);
    
    for (const char of characters) {
        // Fix for Madison
        if (typeof char.id !== 'string') char.id = 'madison_cousin_attic';
        
        console.log(`\n--- Character: ${char.id} ---`);
        for (let i = 0; i < 5; i++) {
            const galleryPath = path.join(GALLERY_DIR, `${char.id}_${i + 1}.png`);
            const galleryPrompt = `${char.appearance}, ${char.clothes}, ${char.scenes[i]}, masterpiece, sharp focus, seductive, revealing transparency, 8k`;
            await generateImage(galleryPrompt, galleryPath);
        }
    }
    console.log("\n⭐ All Gallery Generations Complete!");
}

run();
