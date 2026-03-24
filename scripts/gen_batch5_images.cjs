const fs = require('fs');
const path = require('path');
const http = require('http');

const COMFY_URL = 'http://127.0.0.1:8000';
const OUTPUT_DIR = 'c:/Users/rgira/chatexperince/public/gallery';
const PROFILE_DIR = 'c:/Users/rgira/chatexperince/public/assets/profiles';
const WORKFLOW_FILE = 'C:/Users/rgira/.gemini/antigravity/brain/8604d1fc-cb0d-4397-a9ec-09a14e5bc98d/comfy_workflow_sdxl.json';

async function generateImage(prompt, targetPath) {
    console.log(` 🎨 Generating: ${path.basename(targetPath)}`);
    const workflow = JSON.parse(fs.readFileSync(WORKFLOW_FILE, 'utf8'));
    workflow['6'].inputs.text = prompt;
    workflow['3'].inputs.seed = Math.floor(Math.random() * 1000000);
    
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
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const responseData = JSON.parse(data);
                    if (responseData.prompt_id) {
                        resolve(responseData.prompt_id);
                    } else {
                        reject(new Error(`No prompt_id in response: ${data}`));
                    }
                } catch (e) {
                    reject(new Error(`JSON Parse Error: ${data}`));
                }
            });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });

    let completed = false;
    while (!completed) {
        await new Promise(r => setTimeout(r, 3000));
        const history = await new Promise((resolve) => {
            http.get(`${COMFY_URL}/history/${promptId}`, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try { resolve(JSON.parse(data)); } catch (e) { resolve({}); }
                });
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
                console.log(` ✅ Done: ${path.basename(targetPath)}`);
            }
        }
    }
}

const charactersToGen = [
    {
        id: "miss_vane_rehabilitation",
        appearance: "41yo British woman, blonde hair in a severe bun, clinical expression, grey eyes, masterpiece, photorealistic, 8k",
        clothes: "transparent pearl-grey silk blouse, no lingerie, clinical grey pencil skirt",
        scenes: ["high-end home clinic, standing near window", "medical exam room, sitting at desk", "clinical corridor, holding tablet", "diagnostic room, low angle", "rehabilitation suite, soft lighting", "private treatment room, authoritative posture"]
    },
    {
        id: "aunt_genevieve_inheritance",
        appearance: "44yo French aristocrat, statuesque blonde, haughty expression, masterpiece, photorealistic, 8k",
        clothes: "floor-length black lace gown, completely transparent, no lingerie",
        scenes: ["dim grand salon, velvet armchair, fireplace", "grand staircase, holding wine glass", "estates library, backlit", "private study, reclining", "estate gardens at night, moonlight", "heritage wing, authoritative presence"]
    },
    {
        id: "mrs_harrington_stepmom",
        appearance: "43yo American woman, statuesque blonde, strict commanding expression, masterpiece, photorealistic, 8k",
        clothes: "white silk nightgown, completely transparent, no lingerie",
        scenes: ["luxurious master bedroom, standing in doorway", "bedroom vanity, adjusting hair", "bedside, leaning forward", "bedroom balcony, night sky", "private lounge, holding glass", "midnight hallway, silhouetted"]
    },
    {
        id: "frau_schmidt_disciplinarian",
        appearance: "45yo German woman, blonde bun, severe authoritative look, masterpiece, photorealistic, 8k",
        clothes: "grey high-collared housekeeper uniform, transparent silk fabric, no lingerie",
        scenes: ["master quarters, hands behind back", "estate kitchen, inspecting", "grand hallway, walking", "private quarters, sitting", "linen room, backlit", "household office, desk work"]
    },
    {
        id: "ceo_beatrice_corporate",
        appearance: "42yo blonde woman, statuesque, commanding executive look, masterpiece, photorealistic, 8k",
        clothes: "white designer power-suit, transparent fabric, no lingerie",
        scenes: ["penthouse office, skyscraper view behind", "boardroom table, sitting", "office lounge, holding gin glass", "executive elevator, reflection", "penthouse balcony, city lights", "office entrance, silhouette"]
    },
    {
        id: "aunt_evelyn_society",
        appearance: "46yo American blonde society matriarch, haughty look, masterpiece, photorealistic, 8k",
        clothes: "transparent silk evening gown, pearl necklace, no lingerie",
        scenes: ["private library, chaise lounge", "galley hallway, portraits", "conservatory, plants background", "private suite, mirror reflection", "ballroom edge, backlit", "society function, champagne glass"]
    },
    {
        id: "miranda_wicked_stepmom",
        appearance: "42yo American blonde, cold and calculating look, masterpiece, photorealistic, 8k",
        clothes: "transparent silk nightgown, expensive silk robe open, no lingerie",
        scenes: ["wicked stepmom suite, mirror reflection", "bedroom doorway, silhouetted", "bedside, looking down", "suite balcony, night city", "luxury lounge, sitting regally", "bedroom fire place, warm glow"]
    },
    {
        id: "clara_elise_twins",
        appearance: "A pair of twin 22yo French sisters, identical blonde, beautiful, masterpiece, photorealistic, 8k",
        clothes: "identical transparent silk robes, no lingerie, visible together",
        scenes: ["parlor, velvet sofa, entwined", "bedroom, sitting on bed together", "grand hallway, walking together", "private wing, backlit together", "conservatory, leaning on each other", "twin suite, mirror reflection"]
    },
    {
        id: "warden_graves_prison",
        appearance: "44yo blonde woman, brutal and absolute warden look, masterpiece, photorealistic, 8k",
        clothes: "grey warden uniform, transparent fabric, no lingerie, holding leather crop",
        scenes: ["steel door office, standing tall", "prison corridor, walking", "interrogation room, sitting", "observation deck, looking down", "private cell wing, backlit", "warden suite, authoritative posture"]
    },
    {
        id: "brenda_step_aunt_authority",
        appearance: "45yo American blonde, warm but commanding, masterpiece, photorealistic, 8k",
        clothes: "transparent silk loungewear, no lingerie",
        scenes: ["candlelit bedroom, sitting on bed", "private suite, holding wine", "bedroom window, evening light", "closet doorway, adjusting robe", "suite lounge, leaning back", "bedroom entrance, silhouetted"]
    },
    {
        id: "lady_alistair_victorian",
        appearance: "47yo British blonde, haughty Victorian matriarch, masterpiece, photorealistic, 8k",
        clothes: "floor-length black lace Victorian gown, transparent, no lingerie",
        scenes: ["high-backed velvet chair, library", "ancestral wing, stone walls", "portrait gallery, heavy frames", "private chapel wing, backlit", "estate garden, evening shadow", "grand dining room, head of table"]
    },
    {
        id: "katarina_russian_military",
        appearance: "45yo Russian blonde, brutal military commander look, masterpiece, photorealistic, 8k",
        clothes: "grey military uniform, transparent fabric, no lingerie, holding leather belt",
        scenes: ["commander office, standing by desk", "military barracks, inspecting", "training yard view, window", "private unit quarters, sitting", "bunker entrance, backlit", "command center, authoritative"]
    }
];

const GEN_PROFILES_ONLY = true; // Set to true to verify appearances first

async function run() {
    console.log(`🚀 Starting Batch 5 Image Generation (Profiles Only: ${GEN_PROFILES_ONLY})...`);
    for (const char of charactersToGen) {
        console.log(`\n--- Character: ${char.id} ---`);
        
        // Generate Profile
        const profilePath = `${PROFILE_DIR}/${char.id}_profile.png`;
        const profilePrompt = `${char.appearance}, ${char.clothes}, ${char.scenes[0]}, highly detailed skin, evocative lighting`;
        await generateImage(profilePrompt, profilePath);

        if (!GEN_PROFILES_ONLY) {
            // Generate Gallery 1-5
            for (let i = 0; i < 5; i++) {
                const galleryPrompt = `${char.appearance}, ${char.clothes}, ${char.scenes[i+1]}, cinematic lighting, sharp focus, masterpiece`;
                await generateImage(galleryPrompt, `${OUTPUT_DIR}/${char.id}_${i+1}.png`);
            }
        }
    }
    console.log("\n⭐ Batch 5 Generation Complete!");
}

run();
