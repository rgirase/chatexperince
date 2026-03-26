const fs = require('fs');
const path = require('path');
const http = require('http');

const CHARACTERS_DIR = path.join(__dirname, '../src/data/characters');
const OUTPUT_DIR = path.join(__dirname, '../public/gallery');
const WORKFLOW_PATH = path.join(__dirname, '../comfy_workflow_animatediff.json');

const COMFY_HOST = '127.0.0.1';
const COMFY_PORT = 8000;

async function queuePrompt(workflow, promptText) {
    const currentWorkflow = JSON.parse(JSON.stringify(workflow));
    // Inject character appearance
    currentWorkflow["6"].inputs.text = currentWorkflow["6"].inputs.text.replace('{appearance}', promptText);
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

async function downloadVideo(filename, savePath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(savePath);
        http.get(`http://${COMFY_HOST}:${COMFY_PORT}/view?filename=${filename}&type=output`, (res) => {
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
    // Test with Ritu
    const charFile = 'ritu_bold_bhabhi.js';
    const content = fs.readFileSync(path.join(CHARACTERS_DIR, charFile), 'utf8');
    const info = extractInfo(content);

    if (!info) {
        console.error("Could not extract Ritu info.");
        return;
    }

    const workflow = JSON.parse(fs.readFileSync(WORKFLOW_PATH, 'utf8'));
    console.log(`Generating video clip for ${info.id}... (16 frames)`);

    try {
        const queueResponse = await queuePrompt(workflow, info.appearance);
        const promptId = queueResponse.prompt_id;

        let finished = false;
        while (!finished) {
            const history = await checkStatus(promptId);
            if (history) {
                const outputFilename = history.outputs["13"].gifs[0].filename; // Video nodes often return in gifs key but filename is .mp4
                const outPath = path.join(OUTPUT_DIR, `${info.id}_clip.mp4`);
                await downloadVideo(outputFilename, outPath);
                console.log(`✅ Saved Clip: ${outPath}`);
                finished = true;
            } else {
                process.stdout.write(".");
                await new Promise(r => setTimeout(r, 5000));
            }
        }
    } catch (e) {
        console.error(`❌ Error:`, e.message);
    }
}

run().catch(console.error);
