const fs = require('fs');
const path = require('path');
const http = require('http');

const COMFY_URL = 'http://127.0.0.1:8000';
const OUTPUT_DIR_PROFILES = 'c:/Users/rgira/chatexperince/public/assets/profiles';
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
      "height": 1024,
      "width": 1024
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
      "text": "saree, indian, tradition, ethnic, distorted, blurry, low quality, bad anatomy, bad hands, text, watermark, deformed, ugly, bad proportions, missing limbs, solo, person alone"
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
      "filename_prefix": "ritual_guardians",
      "images": ["8", 0]
    }
  }
};

const prompts = [
  {
    name: "ritual_guardians_profile.png",
    dir: OUTPUT_DIR_PROFILES,
    prompt: "Highly detailed, photorealistic portrait of Sister Claire (35yo mature nun) and Novice Grace (19yo petite novice). They are wearing highly seductive, highly transparent sheer religious habits WITHOUT LINGERIE. Seductive poses, submissive and provocative expressions, shared devotion, 8k resolution, masterpiece."
  },
  {
    name: "ritual_guardians_1.png",
    dir: OUTPUT_DIR_GALLERY,
    prompt: "Full body shot of Sister Claire (35yo) in a seductive pose. She is wearing a thin, highly transparent white religious habit WITHOUT LINGERIE, her mature 38D body visible through the fabric. Submissive and provocative look, high-quality details, gothic sanctuary background, 8k resolution, masterpiece."
  },
  {
    name: "ritual_guardians_2.png",
    dir: OUTPUT_DIR_GALLERY,
    prompt: "Medium shot of Novice Grace (19yo) in a provocative, submissive pose. She is wearing a delicate, highly transparent black religious habit WITHOUT LINGERIE. Her youthful 32C figure is showcased by the sheer fabric. High-quality details, seductive, cinematic lighting, ultra-detailed skin, masterpiece."
  },
  {
    name: "ritual_guardians_3.png",
    dir: OUTPUT_DIR_GALLERY,
    prompt: "Photorealistic image of Sister Claire and Novice Grace together in seductive, submissive poses. They are wearing highly transparent sheer habits that emphasize their curves. Provocative and submissive gaze, high-quality intricate details, breathtaking beauty, 8k, masterpiece."
  },
  {
    name: "ritual_guardians_4.png",
    dir: OUTPUT_DIR_GALLERY,
    prompt: "Close up shot of both Sister Claire and Novice Grace looking up with wide, submissive, and provocative eyes. They are wearing sheer, transparent religious habits WITHOUT LINGERIE. High-quality facial details, soft candle lighting, cinematic mood, seductive atmosphere, masterpiece."
  },
  {
    name: "ritual_guardians_5.png",
    dir: OUTPUT_DIR_GALLERY,
    prompt: "Full body shot of Sister Claire and Novice Grace in a monastery garden. They are wearing highly transparent sexy habits WITHOUT LINGERIE. Seductive poses, high-quality details, submissive and provocative, 8k resolution."
  }
];

async function queuePrompt(promptText) {
  const workflow = JSON.parse(JSON.stringify(workflow_template));
  workflow["6"]["inputs"]["text"] = promptText;
  workflow["3"]["inputs"]["seed"] = Math.floor(Math.random() * 1000000);

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
            // Ignore parse errors during polling
          }
        });
      }).on('error', (err) => {
          clearInterval(interval);
          reject(err);
      });
    }, 2000);
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
  console.log('🚀 Starting image generation for The Ritual Guardians (Claire & Grace)...');
  for (let i = 0; i < prompts.length; i++) {
    const p = prompts[i];
    console.log(`[${i + 1}/${prompts.length}] Generating image: ${p.name}...`);
    try {
      const response = await queuePrompt(p.prompt);
      const prompt_id = response.prompt_id;
      if (!prompt_id) {
          console.error(`  ❌ Failed to get prompt_id. Response: ${JSON.stringify(response)}`);
          continue;
      }
      console.log(`  ⏳ Waiting for generation (${prompt_id})...`);
      const filename = await checkImage(prompt_id);
      console.log('  📥 Downloading result...');
      await downloadImage(filename, path.join(p.dir, p.name));
    } catch (err) {
      console.error(`  ❌ Error generating ${p.name}:`, err.message);
    }
  }
  console.log('⭐ All images generated for The Ritual Guardians (Claire & Grace)!');
}

run();
