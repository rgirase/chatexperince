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
      "sampler_name": "dpmpp_2m_sde",
      "scheduler": "karras",
      "seed": 0,
      "steps": 50
    }
  },
  "4": {
    "class_type": "CheckpointLoaderSimple",
    "inputs": {
      "ckpt_name": "0184PONYLordkamix_v10.safetensors"
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
      "text": "score_4, score_3, score_2, score_1, (worst quality:1.2), (low quality:1.2), (normal quality:1.2), lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, jpeg artifacts, signature, watermark, username, blurry, (deformed:1.2)"
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
      "filename_prefix": "isabella_noble",
      "images": ["8", 0]
    }
  },
  "11": {
    "class_type": "CLIPSetLastLayer",
    "inputs": {
      "stop_at_clip_layer": -2,
      "clip": ["4", 1]
    }
  },
  "12": {
    "class_type": "VAELoader",
    "inputs": {
      "vae_name": "sdxl_vae_fix.safetensors"
    }
  }
};

const PONY_PREFIX = "score_9, score_8_up, score_7_up, score_6_up, score_5_up, score_4_up, photo (medium), 8k, high quality, cinematic, from above, rating_explicit, ";

const prompts = [
  {
    name: "isabella_noble_profile.png",
    dir: OUTPUT_DIR_PROFILES,
    prompt: PONY_PREFIX + "highly detailed photorealistic portrait of an elegant European woman (aristocrat). Countess Isabella (40yo, statuesque beauty, fine features, 36C-25-38). Wearing an extremely seductive highly transparent sheer black Italian designer lace dress WITHOUT LINGERIE, paired with heirloom diamonds. Her hair is in a sophisticated updo. Luxury estate background, refined atmosphere, cinematic lighting, 8k resolution."
  },
  {
    name: "isabella_noble_1.png",
    dir: OUTPUT_DIR_GALLERY,
    prompt: PONY_PREFIX + "Full body shot of Countess Isabella (40yo) in a grand mahogany-paneled library. She is wearing a highly transparent sheer black Italian designer lace dress WITHOUT LINGERIE. She is standing gracefully by a large window, a look of noble submission on her face. Sexy and provocative, high-quality detailed face, luxury leather-bound books background, 8k resolution, masterpiece."
  },
  {
    name: "isabella_noble_2.png",
    dir: OUTPUT_DIR_GALLERY,
    prompt: PONY_PREFIX + "Medium shot of Countess Isabella (40yo) serving tea in a luxury private study. She is wearing a delicate highly transparent sheer black Italian designer lace dress WITHOUT LINGERIE. The fabric revealed her statuesque figure. High-born beauty, seductive and provocative, cinematic lighting, ultra-detailed skin, masterpiece."
  },
  {
    name: "isabella_noble_3.png",
    dir: OUTPUT_DIR_GALLERY,
    prompt: PONY_PREFIX + "photorealistic image of Countess Isabella (40yo) in her master suite. She is reclining on a velvet chaise lounge, her highly transparent sheer black Italian designer lace dress emphasizing her elegant curves. Sophisticated yet submissive expression, high-quality intricate details, breathtaking beauty, 8k."
  },
  {
    name: "isabella_noble_4.png",
    dir: OUTPUT_DIR_GALLERY,
    prompt: PONY_PREFIX + "Close up shot of Countess Isabella (40yo European aristocrat). She is looking into the camera with a refined and seductive gaze, her highly transparent sheer black Italian designer lace dress WITHOUT LINGERIE revealing her bare shoulders and fine skin. High-quality facial details, soft office/study lighting, cinematic mood, masterpiece."
  },
  {
    name: "isabella_noble_5.png",
    dir: OUTPUT_DIR_GALLERY,
    prompt: PONY_PREFIX + "Full body shot of Countess Isabella (40yo) standing in the moonlight on a balcony of a private estate. She is wearing a highly transparent sheer black Italian designer lace dress WITHOUT LINGERIE. Seductive pose, high-quality details, regal and provocative, 8k resolution."
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
  console.log('🚀 Starting image generation for Countess Isabella...');
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
  console.log('⭐ All images generated for Countess Isabella!');
}

run();
