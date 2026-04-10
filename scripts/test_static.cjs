const fs = require('fs');
const path = require('path');
const http = require('http');

const WORKFLOW_PATH = path.join(__dirname, '../comfy_workflow_static_test.json');

async function queuePrompt() {
    const workflow = JSON.parse(fs.readFileSync(WORKFLOW_PATH, 'utf8'));
    const postData = JSON.stringify({ prompt: workflow });

    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: '127.0.0.1',
            port: 8000,
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

async function run() {
    try {
        console.log("🔥 Running Static Isolation Test...");
        const response = await queuePrompt();
        console.log("✅ Static Prompt Queued! ID:", response.prompt_id);
    } catch (e) {
        console.error("❌ Error queueing static prompt:", e.message);
    }
}

run();
