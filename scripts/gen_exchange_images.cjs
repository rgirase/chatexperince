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
        const charName = "Sunanda & Isha (The Exchange Arrangement)";
        const appearance = "A pair of two stunning Indian women: Sunanda (mature 42yo, highly detailed face, voluptuous 40DD) and her daughter Isha (20yo, highly detailed face, slim curvy hourglass 34C). Both women are beautiful and visible together. They are wearing transparent party wear sarees without blouses.";
        const extraModifiers = "two women in frame, masterpiece, photorealistic, 8k uhd, cinematic lighting, sharp focus, highly detailed skin texture, detailed faces, beautiful faces, evocative, traditional Indian setting, (transparent saree:1.2), (no blouse:1.2)";

        const tasks = [
            { target: `${PROFILE_DIR}/exchange_arrangement_profile.png`, prompt: `A pair of two stunning Indian women, Sunanda and Isha, standing together in a driveway, home greeting, ${appearance}, ${extraModifiers}` },
            { target: `${OUTPUT_DIR}/exchange_arrangement_1.png`, prompt: `A pair of two stunning Indian women, Sunanda and Isha, in festive transparent party wear sarees, living room, ${appearance}, ${extraModifiers}` },
            { target: `${OUTPUT_DIR}/exchange_arrangement_2.png`, prompt: `A pair of two stunning Indian women, Sunanda and Isha, in transparent sarees, performing household chores together, ${appearance}, ${extraModifiers}` },
            { target: `${OUTPUT_DIR}/exchange_arrangement_3.png`, prompt: `A pair of two stunning Indian women, Sunanda and Isha, in sheer ritual silk sarees, backlit, high tension, close proximity, ${appearance}, ${extraModifiers}` },
            { target: `${OUTPUT_DIR}/exchange_arrangement_4.png`, prompt: `A pair of two stunning Indian women, Sunanda and Isha, subservient posture, unpinned transparent sarees, ${appearance}, ${extraModifiers}` },
            { target: `${OUTPUT_DIR}/exchange_arrangement_5.png`, prompt: `A pair of two stunning Indian women, Sunanda and Isha, in a private bedroom setting, extreme devotion to each other, transparent sarees, ${appearance}, ${extraModifiers}` }
        ];

        for (let i = 0; i < tasks.length; i++) {
            await generateImage(tasks[i].prompt, i + 1, tasks[i].target);
        }

        console.log("⭐ Images generated for Sunanda & Isha!");
    } catch (e) {
        console.error(`❌ Error: ${e.message}`);
    }
}

run();
