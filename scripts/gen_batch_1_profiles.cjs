const fs = require('fs');
const path = require('path');
const http = require('http');

const COMFY_URL = 'http://127.0.0.1:8000';
const PROFILE_DIR = 'c:/Users/rgira/chatexperince/public/assets/profiles';
const WORKFLOW_FILE = 'c:/Users/rgira/chatexperince/comfy_workflow_sdxl.json';

if (!fs.existsSync(PROFILE_DIR)) fs.mkdirSync(PROFILE_DIR, { recursive: true });

async function generateImage(id, prompt) {
    console.log(`🚀 [${id}] Generating profile image...`);
    const workflow = JSON.parse(fs.readFileSync(WORKFLOW_FILE, 'utf8'));
    
    // Enhanced Style
    const sexyStyle = 'wearing very revealing sexy clothing, extreme deep cleavage, seductive pose, naughty look, looking at viewer, highly detailed gorgeous face, photorealistic, 8k uhd, cinematic lighting, sharp focus';
    const fullPrompt = prompt + ', ' + sexyStyle;
    
    workflow['6'].inputs.text = fullPrompt;
    workflow['3'].inputs.seed = Math.floor(Math.random() * 1000000000);
    
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
            const nodeId = '9'; // Based on comfy_workflow_sdxl.json
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
    const batch = [
        { id: 'natalie_reunion', prompt: 'Natalie (Ex-Stepsister), stunning 25-year-old woman, sophisticated city beauty, perfect hourglass figure (34D-24-36), designer clothing, provocative smirk' },
        { id: 'brooke_guardian', prompt: 'Brooke (The Guardian), breathtaking 38-year-old woman, cold beauty, powerful hourglass figure (36DD-25-38), tailored professional suit, glasses, commanding expression' },
        { id: 'skylar_quasi_sibling', prompt: 'Skylar (The Rival), stunning 22-year-old woman, toned build (32DD-23-35), alt fashion, rebellious gaze, wearing oversized white shirt' },
        { id: 'elena_rival_cousin', prompt: 'Elena (The Rival Cousin), breathtaking 24-year-old woman, tanned resort beauty (34C-24-36), long dark hair, expensive resort wear, cynical smile' },
        { id: 'vanderbilt_widow_aunt', prompt: 'Mrs. Vanderbilt (The Step-Aunt), stunning 39-year-old woman, old money elegance, mature hourglass figure (36D-26-38), black lace mourning gown, vulnerable expression' }
    ];

    for (const char of batch) {
        try {
            await generateImage(char.id, char.prompt);
        } catch (e) {
            console.error(` ❌ Error generating ${char.id}: ${e.message}`);
        }
    }
    console.log('✅ Batch 1 profiles complete!');
}

run();
