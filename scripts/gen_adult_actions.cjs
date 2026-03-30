const fs = require('fs');
const path = require('path');
const http = require('http');

/**
 * Advanced Adult Action Generator (512x768)
 * 
 * Instructions for User:
 * 1. Download breast bounce/penetration LoRAs from Civitai.
 * 2. Place them in your ComfyUI/models/loras/ folder.
 * 3. Update the LORA_MAP below with the exact filenames you downloaded.
 */

const OUTPUT_DIR = path.join(__dirname, '../public/assets/videos');
const WORKFLOW_PATH = path.join(__dirname, '../comfy_workflow_adult_actions.json');
const PORTS = [8000, 8001];

const LORA_MAP = {
    bounce: "rvcgcoopcclnFT15.safetensors",
    penetration: "ossplnskFT15rs4.safetensors",
    squeeze: "phbjcrsc.safetensors",
    pussy: "mssnpvLRCHHD.safetensors",
    missionary: "mssncopFT15.safetensors",
    oral: "orlpvmltlnccFT15.safetensors",
    gangbang: "gngsrrmphFT15.safetensors",
    bondage: "breast_bondage_v2.safetensors",
    bralette_off: "bralette-off.safetensors",
    seductive: "Seductive_sister.safetensors"
};

const ACTION_PROMPTS = {
    bounce: "(breasts bounce:1.4), standing nude, (heavy breasts:1.2), (bouncing up and down:1.2), rhythmic jiggling, expressive motion, highly detailed physics, soft body dynamics, (sweat glistening on skin:1.1), (intense facial expression:1.1), (masterpiece:1.2), (photorealistic:1.3)",
    squeeze: "close up on torso, nude, hands reaching in and squeezing heavy breasts together, cleavage, fingers digging into soft skin, intense pressure",
    pussy: "legs spread wide, full frontal view, pussy showing, labia detailed, wetness, hands spreading pussy lips, looking at camera",
    penetration: "bent over, view from behind, massive cock entering pussy, rhythmic thrusting, extreme close up, wet sounds, stretching, deep penetration, intense pleasure",
    missionary: "POV view, missionary position, rhythmic grinding, eye contact, moaning with mouth open, heavy breathing, skin-to-skin contact, legs wrapped around waist, sweat on chest",
    oral: "POV view, performing oral sex, head moving up and down, hands on thighs, saliva, intense eye contact, deep throat motion",
    gangbang: "surrounded by multiple men, rough handling, multiple points of contact, chaotic yet rhythmic motion, intense facial expressions, extreme erotic atmosphere",
    bondage: "heavy breasts bound tight with rope, skin indentations, erotic bondage, struggling slightly, focused on bound chest, detailed rope texture",
    bralette_off: "reaching back and unhooking bralette, sliding straps off shoulders, breasts falling out, slow motion reveal, sensual gaze",
    seductive: "laying on bed, seductive pose, one hand behind head, arching back, beckoning to camera, alluring smile, soft lighting"
};

const ADULT_TRIGGERS = "masterpiece, 8k, photorealistic, cinematic lighting, (raw photo:1.2), high quality, uncensored, nude, naked, highly detailed skin texture, sweating, heavy breathing, erotic atmosphere";

function getCharacterAppearance(charId) {
    const charPath = path.join(__dirname, '../src/data/characters', `${charId}.js`);
    if (fs.existsSync(charPath)) {
        const content = fs.readFileSync(charPath, 'utf8');
        // Extract only the actual physical description, stopping at "CRITICAL" or line breaks
        const match = content.match(/APPEARANCE:\s*(.*?)(?=\\n|CRITICAL|BACKSTORY:|$)/is);
        if (match) return match[1].replace(/\\n/g, ' ').trim();
    }
    // Fallback if file not found or regex fails
    const fallbackMap = {
        ritu: "stunning 28-year-old Indian woman, hourglass figure, long dark hair",
        indian_ex_gf: "Naina, breathtakingly beautiful 26-year-old Indian woman, curvy figure (34C-26-38), long silky dark hair",
        indian_colleague: "Aisha, breathtakingly gorgeous 24-year-old Indian woman, athletic curvy figure (34DD-26-38), wearing sharp glasses, long dark hair",
        millie_thorne: "attractive 46-year-old American woman, short hair, mature curves",
        julia: "stunning 34-year-old sophisticated woman, long dark hair"
    };
    return fallbackMap[charId] || "beautiful woman";
}

async function getAvailablePort() {
    for (const port of PORTS) {
        try {
            return await new Promise((resolve, reject) => {
                const req = http.get(`http://127.0.0.1:${port}/history`, (res) => resolve(port));
                req.on('error', (e) => reject(e));
                req.setTimeout(1000, () => {
                    req.destroy();
                    reject(new Error('timeout'));
                });
            });
        } catch (e) {}
    }
    return 8000;
}

async function queuePrompt(port, charId, appearance, actionKey, filename) {
    const workflow = JSON.parse(fs.readFileSync(WORKFLOW_PATH, 'utf8'));
    
    // Quality Settings Update
    if (workflow["3"]) {
        workflow["3"].inputs.steps = 20;
        workflow["3"].inputs.cfg = 7.0;
        workflow["3"].inputs.sampler_name = "euler";
        workflow["3"].inputs.scheduler = "normal";
    }
    // Clean Slate Diagnostic (16 frames)
    if (workflow["5"]) workflow["5"].inputs.batch_size = 16;
    if (workflow["14"]) workflow["14"].inputs.context_length = 16; 
    if (workflow["14"]) workflow["14"].inputs.context_overlap = 4;
    if (workflow["4"]) {
        workflow["4"].inputs.ckpt_name = "v1-5-pruned-emaonly.safetensors";
    }

    const actionPrompt = ACTION_PROMPTS[actionKey] || "";
    const loraName = LORA_MAP[actionKey] || "";

    const cleanedAppearance = appearance.replace(/You wear.*?mangalsutra\./gi, "").replace(/saree/gi, "").trim();
    workflow["6"].inputs.text = `${cleanedAppearance}. ${actionPrompt}. ${ADULT_TRIGGERS}.`;
    workflow["3"].inputs.seed = Math.floor(Math.random() * 1000000);
    
    workflow["10"].inputs.lora_name = loraName || "ReaLora.safetensors"; 
    if (loraName) {
        workflow["10"].inputs.strength_model = 0.95;
        workflow["10"].inputs.strength_clip = 0.95;
    } else {
        workflow["10"].inputs.strength_model = 0;
        workflow["10"].inputs.strength_clip = 0;
    }

    workflow["13"].inputs.filename_prefix = filename;

    const postData = JSON.stringify({ prompt: workflow });

    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: '127.0.0.1',
            port: port,
            path: '/prompt',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        }, (res) => {
            let data = '';
            res.on('data', d => data += d);
            res.on('end', () => resolve(JSON.parse(data)));
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

function checkStatus(port, promptId) {
    return new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${port}/history/${promptId}`, (res) => {
            let data = '';
            res.on('data', d => data += d);
            res.on('end', () => {
                const history = JSON.parse(data);
                if (history[promptId]) {
                    resolve(history[promptId]);
                } else {
                    resolve(null);
                }
            });
        }).on('error', reject);
    });
}

async function downloadResult(port, filename, savePath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(savePath);
        http.get(`http://127.0.0.1:${port}/view?filename=${filename}&type=output`, (res) => {
            res.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', reject);
    });
}

async function generateLoop(charId, appearance, actionKey, portArg) {
    const port = portArg || await getAvailablePort();
    console.log(`\n🔥 Generating [${actionKey}] loop for ${charId} on Port ${port}...`);
    console.log(`   Model: Realistic Vision V6.0 B1`);
    console.log(`   Appearance: ${appearance}`);
    const filenamePrefix = `${charId}_${actionKey}`;
    
    try {
        const queueResponse = await queuePrompt(port, charId, appearance, actionKey, filenamePrefix);
        const promptId = queueResponse.prompt_id;
        console.log(`   Prompt ID: ${promptId}. Generating...`);

        let finished = false;
        while (!finished) {
            const history = await checkStatus(port, promptId);
            if (history) {
                // Check VHS output node (13)
                if (history.outputs && history.outputs["13"]) {
                    const videos = history.outputs["13"].videos || history.outputs["13"].gifs || history.outputs["13"].images;
                    if (videos && videos.length > 0) {
                        const videoFile = videos[0].filename;
                        const destPath = path.join(OUTPUT_DIR, videoFile);
                        await downloadResult(port, videoFile, destPath);
                        console.log(`\n   ✅ Saved to: ${destPath}`);
                        finished = true;
                    } else {
                        console.error("\n   ❌ Output found for node 13, but no file list in response.");
                        console.log("   Output details:", JSON.stringify(history.outputs["13"], null, 2));
                        break;
                    }
                } else {
                    console.error("\n   ❌ No output found for node 13 in history.");
                    console.log("   Available nodes in history:", Object.keys(history.outputs || {}));
                    console.log("   Full History Details:", JSON.stringify(history, (key, value) => {
                        // Truncate large tensor data for logging
                        if (typeof value === 'string' && value.length > 500) return value.substring(0, 100) + "...[truncated]";
                        return value;
                    }, 2));
                    if (history.status && history.status.execution_error) {
                        console.log("   Execution Error:", history.status.execution_error.exception_message);
                    }
                    break;
                }
            } else {
                process.stdout.write(".");
                await new Promise(r => setTimeout(r, 10000)); // Increase poll interval
            }
        }
    } catch (e) {
        console.error(`   ❌ Error:`, e.message);
    }
}

// CLI / Execution
const charIdArg = process.argv[2] || "ritu";
const actionArg = process.argv[3] || "bounce"; 
const portArg = parseInt(process.argv[4]) || null;

const appearance = getCharacterAppearance(charIdArg);

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function run() {
    const port = portArg || await getAvailablePort();
    await generateLoop(charIdArg, appearance, actionArg, port);
}

run();
