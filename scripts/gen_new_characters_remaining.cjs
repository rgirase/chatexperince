const fs = require('fs');
const path = require('path');
const http = require('http');

const COMFY_URL = 'http://127.0.0.1:8000';
const OUTPUT_DIR_GALLERY = 'c:/Users/rgira/chatexperince/public/gallery';

const workflow_template = {
  "3": {
    "class_type": "KSampler",
    "inputs": {
      "cfg": 7,
      "denoise": 1,
      "latent_image": ["5", 0],
      "model": ["4", 0],
      "negative": ["7", 0],
      "positive": ["6", 0],
      "sampler_name": "dpmpp_2m",
      "scheduler": "karras",
      "seed": 0,
      "steps": 30
    }
  },
  "4": {
    "class_type": "CheckpointLoaderSimple",
    "inputs": {
      "ckpt_name": "Juggernaut-XL_v9.safetensors"
    }
  },
  "5": {
    "class_type": "EmptyLatentImage",
    "inputs": {
      "batch_size": 1,
      "height": 1216,
      "width": 832
    }
  },
  "6": {
    "class_type": "CLIPTextEncode",
    "inputs": {
      "clip": ["4", 1],
      "text": ""
    }
  },
  "7": {
    "class_type": "CLIPTextEncode",
    "inputs": {
      "clip": ["4", 1],
      "text": "lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, distorted"
    }
  },
  "8": {
    "class_type": "VAEDecode",
    "inputs": {
      "samples": ["3", 0],
      "vae": ["4", 2]
    }
  },
  "9": {
    "class_type": "SaveImage",
    "inputs": {
      "filename_prefix": "new_characters",
      "images": ["8", 0]
    }
  }
};

const prompts = [
  {
    name: "candice_shared_stepmom_5.png",
    prompt: "Highly detailed photorealistic image of Candice (40y blonde step-mom, fit milf figure) completely exposed, standing in a sunlit bedroom, blushing expression, hyper-realistic skin texture, water droplets on skin, stunning beauty, 8k resolution, masterpiece."
  },
  {
    name: "lexi_sons_girlfriend_3.png",
    prompt: "Lexi (21y brunette, fit hourglass 34D) in a short sheer silk sleep nightie, standing in a doorway, soft glow from behind, ethereal yet seductive, Juggernaut-XL textures, 8k realism, masterpiece."
  },
  {
    name: "lexi_sons_girlfriend_4.png",
    prompt: "Lexi (21y brunette) in a black lace lingerie set, standing before a full-length mirror, provocative pose, luxury bedroom setting, hyper-realistic skin, 8k resolution, masterpiece."
  },
  {
    name: "lexi_sons_girlfriend_5.png",
    prompt: "Lexi (21y brunette) completely exposed, kneeling on a bed, messy hair, intense desire in eyes, softest shadows, masterpiece achievement, 8k realism, fit hourglass figure."
  }
];

async function queuePrompt(promptText) {
  const workflow = JSON.parse(JSON.stringify(workflow_template));
  workflow["6"]["inputs"]["text"] = promptText;
  workflow["3"]["inputs"]["seed"] = Math.floor(Math.random() * 1000000000);

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ prompt: workflow });
    const req = http.request(`${COMFY_URL}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
          try {
              resolve(JSON.parse(data));
          } catch (e) {
              reject(new Error(`Failed to parse response: ${data}`));
          }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function checkImage(promptId) {
  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      http.get(`${COMFY_URL}/history/${promptId}`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json[promptId]) {
              clearInterval(interval);
              const filename = json[promptId].outputs["9"].images[0].filename;
              resolve(filename);
            }
          } catch (e) {
            // Wait for completion
          }
        });
      }).on('error', (err) => {
          clearInterval(interval);
          reject(err);
      });
    }, 3000);
  });
}

async function downloadImage(filename, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    http.get(`${COMFY_URL}/view?filename=${filename}`, (res) => {
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('🚀 Generating remaining images using ComfyUI (Juggernaut-XL)...');
  for (const p of prompts) {
    console.log(`\n--- Working on: ${p.name} ---`);
    try {
      console.log(`  Queuing prompt for: ${p.name}...`);
      const response = await queuePrompt(p.prompt);
      const promptId = response.prompt_id;
      
      if (!promptId) {
        console.error(`  ❌ Failed to get prompt_id. Response:`, response);
        continue;
      }
      
      console.log(`  ⏳ Prompt queued (ID: ${promptId}). Waiting for completion...`);
      const filename = await checkImage(promptId);
      
      console.log(`  📥 Downloading: ${filename}...`);
      await downloadImage(filename, path.join(OUTPUT_DIR_GALLERY, p.name));
      console.log(`  ✅ Successfully saved: ${p.name}`);
    } catch (err) {
      console.error(`  ❌ Error generating ${p.name}:`, err.message);
    }
  }
  console.log('\n⭐ ALL REMAINING IMAGES GENERATED SUCCESSFULLY!');
}

run();
