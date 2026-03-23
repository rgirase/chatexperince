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
      "text": "distorted, blurry, low quality, bad anatomy, bad hands, text, watermark, deformed, ugly, bad proportions, missing limbs, three women, solo, person alone"
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
      "filename_prefix": "ceo_reward",
      "images": ["8", 0]
    }
  }
};

const prompts = [
  {
    name: "ceo_reward_profile.png",
    dir: OUTPUT_DIR_PROFILES,
    prompt: "Highly detailed, photorealistic portrait of two Indian women in an executive suite. Aditi (40yo, commanding mature CEO, voluptuous 40D-30-44, regal beauty) and Riya (20yo, ambitious intern, slim athletic 32C-24-36, youthful beauty). Both wearing extremely seductive, transparent party-wear sarees WITHOUT BLOUSES. High-quality faces, detailed skin texture, soft office lighting, cinematic atmosphere, 8k resolution, masterpiece."
  },
  {
    name: "ceo_reward_1.png",
    dir: OUTPUT_DIR_GALLERY,
    prompt: "Full body shot of two breathtaking Indian women in a boardroom. Aditi (40yo CEO) and Riya (20yo intern). Both in transparent party-wear sarees WITHOUT BLOUSES. Aditi is leaning against a glass desk, Riya is standing close behind her. Sexy and seductive poses, two women in frame, high-quality detailed faces, luxury office background, masterpiece, 8k."
  },
  {
    name: "ceo_reward_2.png",
    dir: OUTPUT_DIR_GALLERY,
    prompt: "Two stunning Indian women, Aditi (40yo) and Riya (20yo), in an executive office after hours. Both wearing sheer, transparent party-wear sarees WITHOUT BLOUSES. They are standing close together, looking at the camera with seductive expressions. High-quality intricate details, two women in frame, sexy and provocative, office setting, cinematic lighting."
  },
  {
    name: "ceo_reward_3.png",
    dir: OUTPUT_DIR_GALLERY,
    prompt: "Medium shot of Aditi (40yo Indian CEO) and Riya (20yo Indian intern) in a private office lounge. Both in highly transparent, sexy sarees WITHOUT BLOUSES. Aditi has her arm around Riya's waist. Breathtakingly beautiful faces, two women in frame, seductive atmosphere, detailed skin, soft focus background, masterpiece."
  },
  {
    name: "ceo_reward_4.png",
    dir: OUTPUT_DIR_GALLERY,
    prompt: "Photorealistic image of two Indian women, Aditi (40yo) and Riya (20yo), in a high-rise office at night. Both wearing delicate, transparent sarees WITHOUT BLOUSES. They are in a close, intimate pose near a window overlooking the city lights. Two women in frame, sexy and seductive, ultra-detailed, high-quality faces, cinematic mood."
  },
  {
    name: "ceo_reward_5.png",
    dir: OUTPUT_DIR_GALLERY,
    prompt: "Two gorgeous Indian women, Aditi (CEO, 40yo) and Riya (intern, 20yo), celebrate in a luxury executive suite. Both in sheer, transparent sarees WITHOUT BLOUSES. Seductive and playful interaction, two women in frame, high-quality details, breathtaking beauty, 8k, cinematic lighting."
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
  console.log('🚀 Starting image generation for Aditi & Riya...');
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
  console.log('⭐ All images generated for Aditi & Riya!');
}

run();
