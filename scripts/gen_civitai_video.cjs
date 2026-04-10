const fs = require('fs');
const path = require('path');
const http = require('http');

const WORKFLOW_PATH = path.join(__dirname, '../comfy_workflow_civitai_video.json');
const OUTPUT_DIR = path.join(__dirname, '../public/assets/videos');

const FPS = 8;

const SCRIPT = [
    { time: 0, text: "Blonde trainee cashier smiles friendly and says in an American accent, 'Welcome to McSloppy’s, how may we serve you?', photorealistic, high quality" },
    { time: 3, text: "Male customer voice replies, 'Number 5.', cashier maintains friendly smile, photorealistic" },
    { time: 5, text: "Brunette supervisor is teaching the blonde pointing to the keyboard, the blonde looks back to the cash register and types, photorealistic" },
    { time: 8, text: "Brunette turns back to the viewer and asks 'Would you like to add anal or a cream pie with that sir?', seductive smile, eye contact, photorealistic" },
    { time: 11, text: "Male voice replies casually, 'Just the standard.', brunette supervisor maintains eye contact, photorealistic" },
    { time: 13, text: "Brunette supervisor shows the blonde what to press on the machine while saying, 'A number five is a burger, fries and a blowjob.', blonde nods and starts typing, photorealistic" },
    { time: 19, text: "Blonde cashier looks up and says, 'That’ll be 69.99 sir. Your food will be ready in 30 minutes. Would you like your blowjob here or to go?', professional smile, eye contact, blowjob lora active, photorealistic" }
];

function convertToPromptTravel(script) {
    return script.map(s => {
        const frame = s.time * FPS;
        return `"${frame}": ${s.text}`;
    }).join("\n");
}

async function queuePrompt() {
    const workflow = JSON.parse(fs.readFileSync(WORKFLOW_PATH, 'utf8'));
    
    const promptTravel = "Blonde trainee cashier and brunette supervisor, mc sloppys uniform, customer service, eye contact, photorealistic, 8k";
    console.log("🚀 Using Static Prompt for Diagnostic:");

    workflow["6"].inputs.text = promptTravel;
    workflow["3"].inputs.seed = Math.floor(Math.random() * 1000000);
    
    // Explicitly set frame count for diagnostic (2 frames)
    const totalFrames = 2;
    workflow["5"].inputs.batch_size = totalFrames;

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
        console.log("🔥 Starting Scripted Video Generation...");
        const response = await queuePrompt();
        console.log("✅ Prompt Queued! ID:", response.prompt_id);
        console.log("⏳ This will take several minutes to generate 200 frames. Monitor ComfyUI for progress.");
    } catch (e) {
        console.error("❌ Error queueing prompt:", e.message);
    }
}

run();
