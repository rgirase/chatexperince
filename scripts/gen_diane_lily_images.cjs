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
      "text": "distorted, blurry, low quality, bad anatomy, bad hands, text, watermark, deformed, ugly, bad proportions, missing limbs, solo, person alone"
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
      "filename_prefix": "diane_lily_home_correction",
      "images": ["8", 0]
    }
  }
};

const prompts = [
  {
    name: "diane_lily_home_correction_profile.png",
    dir: OUTPUT_DIR_PROFILES,
    prompt: "Highly detailed, photorealistic portrait of Diane (42yo stunning American mother) and Lily (19yo rebellious daughter). Diane has a mature 40D figure, Lily has a fit 32B figure. They are both wearing highly transparent, extremely seductive designer outfits WITHOUT LINGERIE. Seductive and provocative expression, home library background, 8k resolution, masterpiece."
  },
  {
    name: "diane_lily_home_correction_1.png",
    dir: OUTPUT_DIR_GALLERY,
    prompt: "Full body shot of Diane and Lily in a seductive, submissive pose side-by-side. Diane is in a sheer black lace dress, Lily is in a sheer white slip WITHOUT LINGERIE. High-quality details, provocative look, 8k resolution, masterpiece."
  },
  {
    name: "diane_lily_home_correction_2.png",
    dir: OUTPUT_DIR_GALLERY,
    prompt: "Medium shot of Diane (42yo) in a provocative, submissive pose standing with her hands on her hips. She is wearing a thin, highly transparent black silk dress WITHOUT LINGERIE. Seductive gaze towards the camera, cinematic lighting, ultra-detailed skin, masterpiece."
  },
  {
    name: "diane_lily_home_correction_3.png",
    dir: OUTPUT_DIR_GALLERY,
    prompt: "Photorealistic image of Lily (19yo) in a provocative, submissive pose kneeling at her mother's feet. She is wearing a highly transparent sheer white slip WITHOUT LINGERIE that emphasizes her youthful curves. Yielding gaze, high-quality intricate details, breathtaking beauty, 8k, masterpiece."
  },
  {
    name: "diane_lily_home_correction_4.png",
    dir: OUTPUT_DIR_GALLERY,
    prompt: "Close up shot of both Diane and Lily looking up with wide, submissive, and provocative eyes. They are wearing their sheer correction outfits WITHOUT LINGERIE. High-quality facial details, soft warm lighting, cinematic mood, seductive atmosphere, masterpiece."
  },
  {
    name: "diane_lily_home_correction_5.png",
    dir: OUTPUT_DIR_GALLERY,
    prompt: "Full body shot of Diane and Lily in a modern penthouse. They are wearing highly transparent, extremely sexy correction attire WITHOUT LINGERIE. Seductive poses, high-quality details, submissive and provocative, 8k resolution."
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
  console.log('🚀 Starting image generation for Diane & Lily (The Home Correction Program)...');
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
  console.log('⭐ All images generated for Diane & Lily (The Home Correction Program)!');
}

run();
