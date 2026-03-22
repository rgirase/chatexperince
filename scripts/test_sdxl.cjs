const fs = require('fs');
const http = require('http');

const WORKFLOW_FILE = 'C:/Users/rgira/.gemini/antigravity/brain/8604d1fc-cb0d-4397-a9ec-09a14e5bc98d/comfy_workflow_sdxl.json';
const workflow = JSON.parse(fs.readFileSync(WORKFLOW_FILE, 'utf8'));
workflow['6'].inputs.text = 'a beautiful Indian village sunset';

const payload = JSON.stringify({ prompt: workflow });

const options = {
    hostname: '127.0.0.1',
    port: 8000,
    path: '/prompt',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
    }
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log(`STATUS: ${res.statusCode}`);
        console.log(`RESPONSE: ${data}`);
    });
});

req.on('error', (e) => {
    console.error(`ERROR: ${e.message}`);
});

req.write(payload);
req.end();
