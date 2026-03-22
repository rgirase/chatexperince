const fs = require('fs');
const path = require('path');
const http = require('http');

const COMFY_URL = 'http://127.0.0.1:8000';
const OUTPUT_DIR = 'c:/Users/rgira/chatexperince/public/gallery';
const PROFILE_DIR = 'c:/Users/rgira/chatexperince/public/assets/profiles';
const WORKFLOW_FILE = 'C:/Users/rgira/.gemini/antigravity/brain/8604d1fc-cb0d-4397-a9ec-09a14e5bc98d/comfy_workflow_sdxl.json';

const REF_IMAGE_NAME = 'ref.png';
const REF_IMAGE_PATH = path.join(PROFILE_DIR, REF_IMAGE_NAME);

async function uploadImage(imagePath, filename) {
    console.log(`📤 Uploading ${filename} for character consistency...`);
    const fileData = fs.readFileSync(imagePath);
    const boundary = `----WebKitFormBoundary${Math.random().toString(36).substring(2)}`;
    
    const postData = Buffer.concat([
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="${filename}"\r\nContent-Type: image/png\r\n\r\n`),
        fileData,
        Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);

    const url = new URL(`${COMFY_URL}/upload/image`);
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': postData.length
            }
        }, (res) => {
            if (res.statusCode === 200) {
                console.log('✅ Upload successful.');
                resolve();
            } else {
                reject(new Error(`Upload failed with status ${res.statusCode}`));
            }
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

async function generateImage(prompt, index, targetPath) {
    console.log(` [${index}] Generating image...`);
    const workflow = JSON.parse(fs.readFileSync(WORKFLOW_FILE, 'utf8'));
    workflow['6'].inputs.text = prompt;
    workflow['3'].inputs.seed = 1774209096269 + index; // Use a fixed seed based on profile timestamp for consistency
    
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
            res.on('end', () => resolve(JSON.parse(data).prompt_id));
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

        if (history[promptId] && history[promptId].status && history[promptId].status.status_str === 'error') {
            console.error(` ❌ Generation error: ${JSON.stringify(history[promptId].status.execution_error)}`);
            throw new Error("ComfyUI Execution Error");
        }

        if (history[promptId] && history[promptId].outputs) {
            const outputs = history[promptId].outputs;
            const nodeId = Object.keys(outputs).find(id => outputs[id].images);
            if (nodeId) {
                completed = true;
                const img = outputs[nodeId].images[0];
                const viewUrl = `${COMFY_URL}/view?filename=${img.filename}&subfolder=${img.subfolder}&type=${img.type}`;
                console.log(` 📥 Downloading result from ${viewUrl}`);
                
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
}

async function run() {
    try {
        // await uploadImage(REF_IMAGE_PATH, REF_IMAGE_NAME);
        
        const charName = "Ritu (The Bold Bhabhi)";
        const appearance = "stunning 28-year-old Indian woman, perfect hourglass figure (36D-26-38), long dark hair, thin gold mangalsutra, biting lower lip, deep-neck blouses";
        const extraModifiers = "masterpiece, photorealistic, 8k uhd, cinematic lighting, sharp focus, highly detailed skin texture, provocative";

        const tasks = [
            { target: `${OUTPUT_DIR}/ritu_bold_bhabhi_1.png`, prompt: `${charName}, ${appearance}, sitting in a traditional living room, sky-blue chiffon saree, biting lower lip, ${extraModifiers}` },
            { target: `${OUTPUT_DIR}/ritu_bold_bhabhi_2.png`, prompt: `${charName}, ${appearance}, standing in a corridor, emerald green silk saree, deep-neck blouse, bold expression, ${extraModifiers}` },
            { target: `${OUTPUT_DIR}/ritu_bold_bhabhi_3.png`, prompt: `${charName}, ${appearance}, bedroom setting, sheer white silk saree, messy hair, sweaty skin, ${extraModifiers}` },
            { target: `${OUTPUT_DIR}/ritu_bold_bhabhi_4.png`, prompt: `${charName}, ${appearance}, modern fusion saree, very tight-fitting, leaning against wall, biting lower lip, ${extraModifiers}` },
            { target: `${OUTPUT_DIR}/ritu_bold_bhabhi_5.png`, prompt: `${charName}, ${appearance}, midnight setting, daring uninhibited outfit, unzipped saree, assertive expression, ${extraModifiers}` }
        ];

        for (let i = 0; i < tasks.length; i++) {
            await generateImage(tasks[i].prompt, i + 1, tasks[i].target);
        }

        console.log("⭐ Character-consistent generation for Ritu complete!");
    } catch (e) {
        console.error(`❌ Error: ${e.message}`);
    }
}

run();
