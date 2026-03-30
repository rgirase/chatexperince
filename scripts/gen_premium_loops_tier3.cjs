const fs = require('fs');
const path = require('path');
const http = require('http');

const OUTPUT_DIR = path.join(__dirname, '../public/assets/videos');
const COMFY_HOST = '127.0.0.1';
const COMFY_PORT = 8000;

const CHARACTERS = [
  {
    id: "millie_thorne",
    appearance: "High-quality photorealistic cinematic loop, attractive 46-year-old American woman, 'Millie Thorne'. Melancholic eyes, soft features. Standing in a steam-filled shower, thick white steam and fog, condensation on the glass. Water droplets on skin, wet hair. Subtle breathing, blinking, water running down her face. Cinematic lighting through the steam, 8k, masterpiece, skin texture, moody atmosphere."
  },
  {
    id: "julia_forgotten_wife",
    appearance: "High-quality photorealistic cinematic loop, attractive 34-year-old American woman, 'Julia'. Sophisticated, long dark hair. Standing in a luxury steam shower, marble walls, thick steam, water droplets. Subtle breathing, blinking, tracing the steamy glass with a finger. Soft warm lighting, 8k, masterpiece, sharp focus, skin texture, wet skin."
  }
];

async function queuePrompt(char, filename) {
    const workflow = {
  "3": {
    "inputs": {
      "seed": Math.floor(Math.random() * 1000000), "steps": 20, "cfg": 8, "sampler_name": "euler", "scheduler": "normal", "denoise": 1,
      "model": ["12", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["5", 0]
    },
    "class_type": "KSampler"
  },
  "4": {
    "inputs": { "ckpt_name": "v1-5-pruned-emaonly.safetensors" },
    "class_type": "CheckpointLoaderSimple"
  },
  "5": {
    "inputs": { "width": 512, "height": 512, "batch_size": 16 },
    "class_type": "EmptyLatentImage"
  },
  "6": {
    "inputs": { "text": char.appearance, "clip": ["4", 1] },
    "class_type": "CLIPTextEncode"
  },
  "7": {
    "inputs": { 
        "text": "lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, nsfw", 
        "clip": ["4", 1] 
    },
    "class_type": "CLIPTextEncode"
  },
  "8": {
    "inputs": { "samples": ["3", 0], "vae": ["4", 2] },
    "class_type": "VAEDecode"
  },
  "12": {
    "inputs": {
      "model_name": "mm_sd_v15_v2.ckpt",
      "beta_schedule": "sqrt_linear (AnimateDiff)",
      "model": ["4", 0],
      "context_options": ["14", 0]
    },
    "class_type": "ADE_AnimateDiffLoaderGen1"
  },
  "13": {
    "inputs": {
      "images": ["8", 0],
      "frame_rate": 8,
      "loop_count": 0,
      "filename_prefix": `${filename}_loop`,
      "format": "video/h264-mp4",
      "pix_fmt": "yuv420p",
      "crf": 19,
      "save_output": true,
      "pingpong": false
    },
    "class_type": "VHS_VideoCombine"
  },
  "14": {
    "inputs": {
      "context_length": 16,
      "context_stride": 1,
      "context_overlap": 4,
      "context_schedule": "uniform",
      "closed_loop": true
    },
    "class_type": "ADE_AnimateDiffUniformContextOptions"
  }
};

    const postData = JSON.stringify({ prompt: workflow });

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
            res.on('end', () => {
                if (res.statusCode >= 400) {
                    console.error(`   ❌ HTTP Error ${res.statusCode}: ${data}`);
                    return resolve(null);
                }
                try {
                    const parsed = JSON.parse(data);
                    resolve(parsed);
                } catch (e) {
                    console.error(`   ❌ JSON Parse Error: ${data}`);
                    resolve(null);
                }
            });
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
                try {
                    const history = JSON.parse(data);
                    if (history[promptId]) {
                        resolve(history[promptId]);
                    } else {
                        resolve(null);
                    }
                } catch (e) {
                    resolve(null);
                }
            });
        }).on('error', reject);
    });
}

async function downloadResult(filename, subfolder, savePath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(savePath);
        const url = `http://${COMFY_HOST}:${COMFY_PORT}/view?filename=${encodeURIComponent(filename)}&subfolder=${encodeURIComponent(subfolder)}&type=output`;
        http.get(url, (res) => {
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

async function generateCharacter(char) {
    console.log(`\n🚀 Starting generation for ${char.id} (Steam Shower Edition)...`);
    try {
        const queueResponse = await queuePrompt(char, char.id);
        if (!queueResponse || !queueResponse.prompt_id) {
            console.error(`   ❌ Failed to queue prompt for ${char.id}. Response:`, queueResponse);
            return;
        }
        const promptId = queueResponse.prompt_id;
        console.log(`   Prompt Queued (ID: ${promptId}). Waiting for completion...`);

        let finished = false;
        let checks = 0;
        while (!finished) {
            const history = await checkStatus(promptId);
            if (history) {
                if (history.status.status_str === 'error') {
                    console.error(`   ❌ Server Error: ${JSON.stringify(history.status.messages)}`);
                    break;
                }
                
                const output = history.outputs["13"];
                if (!output) {
                    console.error(`   ❌ No output for Node 13 in history.`);
                    break;
                }
                
                const result = (output.videos && output.videos[0]) ? output.videos[0] : 
                               (output.gifs && output.gifs[0]) ? output.gifs[0] : 
                               (output.images && output.images[0]) ? output.images[0] : null;
                
                if (!result) throw new Error("No output found in Node 13 keys.");
                
                const filename = result.filename;
                const subfolder = result.subfolder || "";
                const ext = filename.split('.').pop();
                const targetFilename = `${char.id}_loop.${ext}`;
                const outPath = path.join(OUTPUT_DIR, targetFilename);
                
                await downloadResult(filename, subfolder, outPath);
                console.log(`   ✅ Saved: ${targetFilename}`);
                finished = true;
            } else {
                process.stdout.write(".");
                await new Promise(r => setTimeout(r, 10000));
                checks++;
                if (checks > 180) { // 30 minutes timeout
                    console.error("\n   ❌ Timeout waiting for generation.");
                    break;
                }
            }
        }
    } catch (e) {
        console.error(`   ❌ Error generating ${char.id}:`, e.message);
    }
}

async function main() {
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    
    for (const char of CHARACTERS) {
        await generateCharacter(char);
    }
    
    console.log("\n✨ Tier 3 Steam Shower Loop Generation Complete!");
}

main().catch(console.error);
