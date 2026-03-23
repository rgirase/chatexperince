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
      "filename_prefix": "honor_debt",
      "images": ["8", 0]
    }
  }
};

const prompts = [
  {
    name: "honor_debt_profile.png",
    dir: OUTPUT_DIR_PROFILES,
    prompt: "Highly detailed, photorealistic portrait of a young Indian girl. Gauri (21yo, innocent servant, slim but curvy 34B-24-36). Wearing a highly seductive, transparent village-style party-wear saree WITHOUT A BLOUSE. Long black braid with jasmine. Large soulful eyes, submissive and desperate look. Simple village house background, soft evening light, cinematic atmosphere, 8k resolution."
  },
  {
    name: "honor_debt_1.png",
    dir: OUTPUT_DIR_GALLERY,
    prompt: "Full body shot of Gauri (21yo) kneeling in a dimly lit village study. She is wearing a sheer, transparent party-wear saree WITHOUT A BLOUSE. She is bowing her head submissively before the user. Sexy and provocative, high-quality detailed face, traditional village interior, 8k resolution, masterpiece."
  },
  {
    name: "honor_debt_2.png",
    dir: OUTPUT_DIR_GALLERY,
    prompt: "Medium shot of Gauri (21yo) performing household chores. She is wearing a delicate, transparent village saree WITHOUT A BLOUSE. Her slim figure is highlighted by the sheer fabric. Innocent yet highly seductive expression, cinematic lighting, ultra-detailed skin, masterpiece."
  },
  {
    name: "honor_debt_3.png",
    dir: OUTPUT_DIR_GALLERY,
    prompt: "Photorealistic image of Gauri (21yo) in a humble servant's room. She is sitting on a simple mat, her transparent saree revealing her curves. Sad yet yielding expression, high-quality intricate details, breathtaking youthful beauty, 8k."
  },
  {
    name: "honor_debt_4.png",
    dir: OUTPUT_DIR_GALLERY,
    prompt: "Close up shot of Gauri (21yo Indian village girl). She is looking up with a wide-eyed and submissive gaze, her sheer saree WITHOUT A BLOUSE emphasizing her vulnerability and sexiness. High-quality facial details, soft night lighting, cinematic mood, masterpiece."
  },
  {
    name: "honor_debt_5.png",
    dir: OUTPUT_DIR_GALLERY,
    prompt: "Full body shot of Gauri (21yo) standing in the courtyard of a village mansion at dusk. She is wearing a transparent, sexy servant saree WITHOUT A BLOUSE. Seductive pose, high-quality details, innocent and provocative, 8k resolution."
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
  console.log('🚀 Starting image generation for Honor Debt Servant (Gauri)...');
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
  console.log('⭐ All images generated for Honor Debt Servant (Gauri)!');
}

run();
