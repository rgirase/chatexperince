const fs = require('fs');
const path = require('path');
const http = require('http');

const COMFY_URL = 'http://127.0.0.1:8000';
const PROFILE_DIR = 'c:/Users/rgira/chatexperince/public/assets/profiles';
const WORKFLOW_FILE = 'c:/Users/rgira/chatexperince/comfy_workflow_sdxl.json';
const CHECKPOINT = 'realismByStableYogi_ponyV3VAE.safetensors';

if (!fs.existsSync(PROFILE_DIR)) fs.mkdirSync(PROFILE_DIR, { recursive: true });

async function generateImage(id, appearance) {
    console.log(`🚀 [${id}] Generating realistic profile image...`);
    const workflow = JSON.parse(fs.readFileSync(WORKFLOW_FILE, 'utf8'));
    
    // Pony XL Specifics
    const PONY_PREFIX = "score_9, score_8_up, score_7_up, score_6_up, score_5_up, score_4_up, rating_explicit, ";
    const style = 'photorealistic, 8k uhd, cinematic lighting, sharp focus, masterpiece, highly detailed gorgeous face, looking at viewer';
    const negative = 'score_4, score_3, score_2, score_1, (worst quality:1.2), (low quality:1.2), (normal quality:1.2), lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, jpeg artifacts, signature, watermark, username, blurry';

    const fullPrompt = `${PONY_PREFIX}${appearance}, ${style}`;
    
    // Update Workflow
    workflow['4'].inputs.ckpt_name = CHECKPOINT;
    workflow['6'].inputs.text = fullPrompt;
    workflow['7'].inputs.text = negative;
    workflow['3'].inputs.seed = Math.floor(Math.random() * 1000000000);
    workflow['9'].inputs.filename_prefix = `${id}_profile`;

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
                    const parsed = JSON.parse(data);
                    if (parsed.prompt_id) resolve(parsed.prompt_id);
                    else reject(new Error(`No prompt_id in response: ${data}`));
                } catch (e) {
                    reject(new Error(`Failed to parse response: ${data}`));
                }
            });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });

    console.log(` ⏳ Waiting for generation (${promptId})...`);
    
    const targetPath = path.join(PROFILE_DIR, `${id}_profile.png`);
    let completed = false;
    let attempts = 0;
    while (!completed && attempts < 60) {
        await new Promise(r => setTimeout(r, 5000));
        attempts++;
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
            const nodeId = '9';
            if (outputs[nodeId] && outputs[nodeId].images) {
                completed = true;
                const img = outputs[nodeId].images[0];
                const viewUrl = `${COMFY_URL}/view?filename=${img.filename}&subfolder=${img.subfolder}&type=${img.type}`;
                console.log(` 📥 Downloading result for ${id}`);
                
                await new Promise((resolve) => {
                    const file = fs.createWriteStream(targetPath);
                    http.get(viewUrl, (res) => {
                        res.pipe(file);
                        file.on('finish', () => {
                            file.close();
                            console.log(` ✅ Saved to ${targetPath}`);
                            resolve();
                        });
                    });
                });
            }
        }
    }
    if (!completed) console.error(` ❌ Timeout for ${id}`);
}

async function run() {
    const characters = [
        { 
            id: 'julia_forgotten_wife', 
            appearance: 'Julia (The Forgotten Wife), stunning 34-year-old American woman, suburban elegance (34D-24-36), long dark hair, wearing high-end black silk slip, minimalist jewelry, poised and sophisticated expression' 
        },
        { 
            id: 'millie_thorne', 
            appearance: 'Millie Thorne (The Wounded Neighbor), curvy mature 46-year-old American woman (38DD-30-42), soft features, melancholic eyes, wearing elegant but revealing lace loungewear, emotionally vulnerable expression' 
        }
    ];

    for (const char of characters) {
        try {
            await generateImage(char.id, char.appearance);
        } catch (e) {
            console.error(` ❌ Error generating ${char.id}: ${e.message}`);
        }
    }
    console.log('✅ Profile generation complete!');
}

run();
