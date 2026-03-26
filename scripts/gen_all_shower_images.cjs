const fs = require('fs');
const path = require('path');
const http = require('http');

const CHARACTERS_DIR = path.join(__dirname, '../src/data/characters');
const OUTPUT_DIR = path.join(__dirname, '../public/gallery');
const MANIFEST_PATH = path.join(__dirname, '../src/data/gallery_manifest.json');
const WORKFLOW_PATH = path.join(__dirname, '../comfy_workflow_sdxl.json');

const COMFY_HOST = '127.0.0.1';
const COMFY_PORT = 8000;

const PROMPT_TEMPLATE = `8k resolution, highly detailed, photorealistic, cinematic lighting. {appearance}. Steamy shower room, glass walls with water droplets, man and woman, man standing behind woman holding her hips, woman's breasts pressed against the wet glass, her facial expression is moaning with pleasure, intense intimacy, steam filling the room, wet skin, erotic atmosphere, high quality digital art.`;

async function queuePrompt(workflow, promptText) {
    const currentWorkflow = JSON.parse(JSON.stringify(workflow));
    currentWorkflow["6"].inputs.text = promptText;
    currentWorkflow["3"].inputs.seed = Math.floor(Math.random() * 1000000);

    const postData = JSON.stringify({ prompt: currentWorkflow });

    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: COMFY_HOST,
            port: COMFY_PORT,
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

function checkStatus(promptId) {
    return new Promise((resolve, reject) => {
        http.get(`http://${COMFY_HOST}:${COMFY_PORT}/history/${promptId}`, (res) => {
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

async function downloadImage(filename, savePath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(savePath);
        http.get(`http://${COMFY_HOST}:${COMFY_PORT}/view?filename=${filename}`, (res) => {
            res.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(savePath, () => {});
            reject(err);
        });
    });
}

function extractInfo(content) {
    const idMatch = content.match(/id:\s*['"]([^'"]+)['"]/);
    const appearanceMatch = content.match(/APPEARANCE:\s*([\s\S]*?)(?:\n\s*BACKSTORY:|\n\s*CRITICAL|$)/);
    
    if (idMatch && appearanceMatch) {
        return {
            id: idMatch[1],
            appearance: appearanceMatch[1].trim().replace(/\n/g, ' ').replace(/"/g, "'")
        };
    }
    return null;
}

async function run() {
    const files = fs.readdirSync(CHARACTERS_DIR).filter(f => f.endsWith('.js') && f !== 'index.js' && f !== 'basePrompt.js');
    console.log(`Found ${files.length} character files.`);

    const workflow = JSON.parse(fs.readFileSync(WORKFLOW_PATH, 'utf8'));
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    
    for (const file of files) {
        const content = fs.readFileSync(path.join(CHARACTERS_DIR, file), 'utf8');
        const info = extractInfo(content);

        if (!info) {
            console.log(`Skipping ${file}: Could not extract ID or Appearance.`);
            continue;
        }

        const outPath = path.join(OUTPUT_DIR, `${info.id}_shower.png`);
        const galleryPath = `/gallery/${info.id}_shower.png`;

        if (fs.existsSync(outPath)) {
            console.log(`Skipping ${info.id}: Shower image already exists.`);
            if (!manifest[info.id]) manifest[info.id] = [];
            if (!manifest[info.id].includes(galleryPath)) {
                manifest[info.id].push(galleryPath);
            }
            continue;
        }

        console.log(`Generating shower image for ${info.id}...`);
        const fullPrompt = PROMPT_TEMPLATE.replace('{appearance}', info.appearance);
        
        try {
            const queueResponse = await queuePrompt(workflow, fullPrompt);
            const promptId = queueResponse.prompt_id;

            let finished = false;
            while (!finished) {
                const history = await checkStatus(promptId);
                if (history) {
                    const outputFilename = history.outputs["9"].images[0].filename;
                    await downloadImage(outputFilename, outPath);
                    console.log(`✅ Saved: ${outPath}`);
                    
                    if (!manifest[info.id]) manifest[info.id] = [];
                    if (!manifest[info.id].includes(galleryPath)) {
                        manifest[info.id].push(galleryPath);
                    }
                    // Save manifest after each image to be safe
                    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
                    finished = true;
                } else {
                    await new Promise(r => setTimeout(r, 2000));
                }
            }
        } catch (e) {
            console.error(`❌ Error for ${info.id}:`, e.message);
        }
    }

    console.log(`Batch generation complete.`);
}

run().catch(console.error);
