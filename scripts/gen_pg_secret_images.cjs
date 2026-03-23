const fs = require('fs');
const path = require('path');
const http = require('http');

const COMFY_URL = 'http://127.0.0.1:8000';
const OUTPUT_DIR = 'c:/Users/rgira/chatexperince/public/gallery';
const PROFILE_DIR = 'c:/Users/rgira/chatexperince/public/assets/profiles';
const WORKFLOW_FILE = 'C:/Users/rgira/.gemini/antigravity/brain/8604d1fc-cb0d-4397-a9ec-09a14e5bc98d/comfy_workflow_sdxl.json';

async function generateImage(prompt, index, targetPath) {
    console.log(` [${index}] Generating image...`);
    const workflow = JSON.parse(fs.readFileSync(WORKFLOW_FILE, 'utf8'));
    workflow['6'].inputs.text = prompt;
    workflow['3'].inputs.seed = Date.now() + index;
    
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
                const responseData = JSON.parse(data);
                if (responseData.prompt_id) {
                    resolve(responseData.prompt_id);
                } else {
                    console.error(`❌ Unexpected response: ${data}`);
                    reject(new Error(`No prompt_id in response: ${data}`));
                }
            });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });

    console.log(` ⏳ Waiting for generation (${promptId})...`);
    
    let completed = false;
    while (!completed) {
        await new Promise(r => setTimeout(r, 5000));
        const history = await new Promise((resolve) => {
            http.get(`${COMFY_URL}/history/${promptId}`, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => resolve(JSON.parse(data)));
            });
        });

        if (history[promptId] && history[promptId].outputs) {
            const outputs = history[promptId].outputs;
            const nodeId = Object.keys(outputs).find(id => outputs[id].images);
            if (nodeId) {
                completed = true;
                const img = outputs[nodeId].images[0];
                const viewUrl = `${COMFY_URL}/view?filename=${img.filename}&subfolder=${img.subfolder}&type=${img.type}`;
                console.log(` 📥 Downloading result...`);
                
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
            }
        }
    }
}

async function run() {
    try {
        const appearance = "A pair of two stunning Indian women: Simran (38yo, sophisticated PG owner, highly detailed face, seductive, mature) and Neha (19yo, fresh college student, highly detailed face, curious, adventurous). Both are visible in frame. They are wearing highly seductive, transparent party wear sarees without blouses.";
        const extraModifiers = "two women in same frame, (extremely sexy:1.2), (seductive poses:1.2), masterpiece, photorealistic, 8k uhd, cinematic lighting, sharp focus, highly detailed skin texture, detailed faces, beautiful faces, evocative, luxurious PG apartment setting, (transparent saree:1.2), (no blouse:1.2)";

        const tasks = [
            { target: `${PROFILE_DIR}/pg_secret_profile.png`, prompt: `A pair of two stunning Indian women, Simran and Neha, standing together, inviting look, ${appearance}, ${extraModifiers}` },
            { target: `${OUTPUT_DIR}/pg_secret_1.png`, prompt: `Simran and Neha in a modern bedroom, Simran mentoring Neha, transparent sarees, ${appearance}, ${extraModifiers}` },
            { target: `${OUTPUT_DIR}/pg_secret_2.png`, prompt: `Simran and Neha in the kitchen at night, soft moonlight, transparent sarees, ${appearance}, ${extraModifiers}` },
            { target: `${OUTPUT_DIR}/pg_secret_3.png`, prompt: `Simran and Neha in a dimly lit study area, high tension, sheer sarees, ${appearance}, ${extraModifiers}` },
            { target: `${OUTPUT_DIR}/pg_secret_4.png`, prompt: `Simran and Neha, seductive posture, unpinned transparent sarees, close proximity, ${appearance}, ${extraModifiers}` },
            { target: `${OUTPUT_DIR}/pg_secret_5.png`, prompt: `Simran and Neha in a private balcony, night view, extreme devotion, transparent sarees, ${appearance}, ${extraModifiers}` }
        ];

        for (let i = 0; i < tasks.length; i++) {
            await generateImage(tasks[i].prompt, i + 1, tasks[i].target);
        }

        console.log("⭐ Images generated for Simran & Neha!");
    } catch (e) {
        console.error(`❌ Error: ${e.message}`);
    }
}

run();
