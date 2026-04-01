const fs = require('fs');
const path = require('path');
const http = require('http');

const COMFY_URL = 'http://127.0.0.1:8000';
const OUTPUT_DIR = 'C:/Users/rgira/chatexperince/public/assets/profiles';

const workflow_template = {
  "3": {
    "class_type": "KSampler",
    "inputs": {
      "cfg": 7,
      "denoise": 1,
      "latent_image": ["5", 0],
      "model": ["10", 0],
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
      "ckpt_name": "realismByStableYogi_ponyV3VAE.safetensors"
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
      "clip": ["11", 0],
      "text": ""
    }
  },
  "7": {
    "class_type": "CLIPTextEncode",
    "inputs": {
      "clip": ["11", 0],
      "text": "score_4, score_3, score_2, score_1, (worst quality:1.2), (low quality:1.2), (normal quality:1.2), lowres, anime, cartoon, sketch, ugly, blurry, deformed, mutated, extra limbs"
    }
  },
  "8": {
    "class_type": "VAEDecode",
    "inputs": {
      "samples": ["3", 0],
      "vae": ["12", 0]
    }
  },
  "9": {
    "class_type": "SaveImage",
    "inputs": {
      "filename_prefix": "",
      "images": ["8", 0]
    }
  },
  "10": {
    "class_type": "LoraLoader",
    "inputs": {
      "lora_name": "none",
      "strength_model": 0.8,
      "strength_clip": 0.8,
      "model": ["4", 0],
      "clip": ["4", 1]
    }
  },
  "11": {
    "class_type": "CLIPSetLastLayer",
    "inputs": {
      "stop_at_clip_layer": -2,
      "clip": ["10", 1]
    }
  },
  "12": {
    "class_type": "VAELoader",
    "inputs": {
      "vae_name": "sdxl_vae_fix.safetensors"
    }
  }
};

const PONY_PREFIX = "score_9, score_8_up, score_7_up, score_6_up, score_5_up, score_4_up, rating_explicit, ";

const characters = [
  {
    id: "gauri_bhabhi",
    prompt: "beautiful 27yo Indian woman, Gauri (soft classical beauty, curvaceous 36D-26-40, large expressive eyes, long dark hair in a loose braid), wearing a simple cotton house saree with a modest blouse, standing in a dim kitchen, soft evening light, seductive expression"
  },
  {
    id: "anjali_auntie",
    prompt: "stunning 38yo Indian woman, Anjali (glamorous sharp features, hourglass 36DD-28-40, long wavy dark hair), wearing a high-end black sequin cocktail dress, holding a wine glass, leaning against a doorframe, sharp knowing gaze, seductive expression"
  },
  {
    id: "meera_bride",
    prompt: "breathtaking 24yo Indian woman, Meera (vulnerable doll-like grace, slender curvaceous 34C-24-38, tear-rimmed eyes, messy dark hair), wearing a heavy semi-undone red bridal lehenga, sitting on a bed in a rainy guest room, melancholic expression, seductive yet broken"
  }
];

async function queuePrompt(char) {
  const workflow = JSON.parse(JSON.stringify(workflow_template));
  workflow["6"]["inputs"]["text"] = `${PONY_PREFIX}${char.prompt}, photorealistic, 8k, masterpiece, cinematic lighting, highly detailed skin texture.`;
  workflow["9"]["inputs"]["filename_prefix"] = `${char.id}_profile`;
  workflow["3"]["inputs"]["seed"] = Math.floor(Math.random() * 1000000);

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ prompt: workflow });
    const req = http.request(`${COMFY_URL}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function checkImage(promptId) {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      http.get(`${COMFY_URL}/history/${promptId}`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json[promptId]) {
              clearInterval(interval);
              const node9 = json[promptId].outputs["9"];
              resolve(node9.images[0].filename);
            }
          } catch (e) {}
        });
      }).on('error', () => {});
    }, 4000);
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
  console.log('🚀 Starting Profile Generation...');
  for (const char of characters) {
    const filename = `${char.id}_profile.png`;
    const destPath = path.join(OUTPUT_DIR, filename);
    console.log(`👤 Generating: ${char.id}...`);
    try {
      const response = await queuePrompt(char);
      const prompt_id = response.prompt_id;
      const resultFilename = await checkImage(prompt_id);
      await downloadImage(resultFilename, destPath);
      console.log(`✅ Saved to ${filename}`);
    } catch (err) {
      console.error(`❌ Error:`, err.message);
    }
  }
  console.log('⭐ Generation Complete!');
}

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
run();
