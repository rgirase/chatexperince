const fs = require('fs');
const path = require('path');
const http = require('http');

const COMFY_URL = 'http://127.0.0.1:8000';
const OUTPUT_DIR = 'C:/Users/rgira/chatexperince/public/gallery/wardrobe';
const PROFILE_DIR = 'C:/Users/rgira/chatexperince/public/assets/profiles';
const WORKFLOW_FILE = 'C:/Users/rgira/chatexperince/scripts/comfy_workflow_hq.json';

async function generateImage(prompt, targetPath) {
    console.log(`🎨 Generating: ${path.basename(targetPath)}`);
    console.log(`📜 Prompt: ${prompt}`);
    
    if (!fs.existsSync(WORKFLOW_FILE)) {
        throw new Error(`Workflow file not found: ${WORKFLOW_FILE}`);
    }

    const workflow = JSON.parse(fs.readFileSync(WORKFLOW_FILE, 'utf8'));
    
    // Injected prompts for Sister Grace
    // Node 6 is usually the CLIP Text Encode according to ritu script
    workflow['6'].inputs.text = `high-fidelity, photorealistic, 8k uhd, cinematic lighting, sharp focus, detailed skin texture, ${prompt}`;
    workflow['3'].inputs.seed = Math.floor(Math.random() * 1000000000000);
    
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
                    if (parsed.error) reject(new Error(parsed.error.message));
                    resolve(parsed.prompt_id);
                } catch (e) {
                    reject(new Error(`Failed to parse prompt response: ${data}`));
                }
            });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });

    console.log(`⏳ Generation ID: ${promptId}. Waiting...`);
    
    let completed = false;
    let attempts = 0;
    while (!completed && attempts < 60) { // 5 minute timeout
        await new Promise(r => setTimeout(r, 5000));
        attempts++;
        
        const history = await new Promise((resolve) => {
            http.get(`${COMFY_URL}/history/${promptId}`, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        resolve({}); // Retry
                    }
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
                
                await new Promise((resolve, reject) => {
                    const dir = path.dirname(targetPath);
                    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                    
                    const file = fs.createWriteStream(targetPath);
                    http.get(viewUrl, (res) => {
                        if (res.statusCode !== 200) reject(new Error(`Download failed: ${res.statusCode}`));
                        res.pipe(file);
                        file.on('finish', () => {
                            file.close();
                            console.log(`✅ Success: ${targetPath}`);
                            resolve();
                        });
                    });
                });
            }
        }
    }
    if (!completed) throw new Error("Timed out waiting for ComfyUI");
}

async function run() {
    try {
        const appearance = "stunning 35-year-old blonde woman, statuesque pear-shaped figure (38DD-24-40), piercing green eyes, calm pious expression, predatory intensity";
        const charBase = "Sister Grace, Pastor's Wife, church rectory setting";

        const tasks = [
            // Profile
            { 
                target: `${PROFILE_DIR}/sister_grace_profile.png`, 
                prompt: `${charBase}, ${appearance}, sitting at a mahogany desk, modest high-collar floral dress, dim lighting, stained glass window background` 
            },
            // Wardrobes
            { 
                target: `${OUTPUT_DIR}/sister_grace_1.png`, 
                prompt: `${charBase}, ${appearance}, standing in church aisle, Sunday floral dress, sunlight through windows` 
            },
            { 
                target: `${OUTPUT_DIR}/sister_grace_2.png`, 
                prompt: `${charBase}, ${appearance}, choir rehearsal, white choir robes, glowing skin, looking down at hymnal` 
            },
            { 
                target: `${OUTPUT_DIR}/sister_grace_3.png`, 
                prompt: `${charBase}, ${appearance}, private rectory office at night, black silk robe, low lighting, secretive atmosphere` 
            },
            { 
                target: `${OUTPUT_DIR}/sister_grace_4.png`, 
                prompt: `${charBase}, ${appearance}, kneeling in a prayer room, ornate lace lingerie partially visible under a shawl, intense emotional eyes` 
            }
        ];

        console.log("🚀 Starting ComfyUI generation for Sister Grace...");
        for (const task of tasks) {
            await generateImage(task.prompt, task.target);
        }
        console.log("🎉 All assets generated successfully!");

    } catch (e) {
        console.error(`❌ Fatal Error: ${e.message}`);
    }
}

run();
