const fs = require('fs');
const path = require('path');
const http = require('http');

const COMFY_URL = 'http://127.0.0.1:8000';
const GALLERY_DIR = 'c:/Users/rgira/chatexperince/public/gallery';

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
      "text": "distorted, blurry, low quality, bad anatomy, bad hands, text, watermark, deformed, ugly, bad proportions, missing limbs"
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
      "filename_prefix": "wardrobe_fix",
      "images": ["8", 0]
    }
  }
};

const characters = [
  {
    id: 'brooke_guardian',
    appearance: "breathtaking 38yo woman, cold beauty, powerful hourglass 36DD-25-38, glasses, commanding expression",
    scenes: [
      "wearing a tailored pinstripe blazer, buttoned tight, sitting at a kitchen table with a folio, professional and analytical",
      "wearing a sheer white silk blouse, slightly unbuttoned, standing in a study, intense gaze",
      "wearing a tight leather pencil skirt and heels, walking with perfect posture, severe and alluring",
      "wearing sheer black stockings and suspenders, looking over her glasses with a mix of judgment and desire",
      "completely nude but for her glasses, looking at the camera with a severe and yielding expression"
    ]
  },
  {
    id: 'elena_rival_cousin',
    appearance: "tanned 24yo resort beauty, long dark hair, 34C-24-36, cynical and witty smile",
    scenes: [
      "wearing a sheer silk kaftan, lounging in a private poolside cabana, cynical smile",
      "wearing a designer gold micro bikini, posing confidently near an infinity pool, 8k",
      "wearing a red high-slit evening gown, standing in a luxury resort corridor, glamorous",
      "wearing a black silk and lace lingerie set, in a dark hotel room, seductive and playful",
      "completely nude, draped in hotel sheets, lounging on a bed with a provocative smirk"
    ]
  },
  {
    id: 'natalie_reunion',
    appearance: "sophisticated 25yo city beauty, perfect hourglass 34D-24-36, confident and assertive",
    scenes: [
      "wearing a backless black cocktail dress, leaning against a rooftop bar rail, martini in hand",
      "wearing an emerald silk slip dress, in a luxury apartment, seductive gaze",
      "wearing a designer lace lingerie set, standing in a sophisticated bedroom, 8k",
      "wearing an open white hotel robe, wet hair, intimate and nostalgic look",
      "completely nude, standing in a penthouse with a triumphant and seductive smile"
    ]
  },
  {
    id: 'natalie_babysitter',
    appearance: "fit athletic 24yo woman, 34C-25-36, flirty and teasing",
    scenes: [
      "wearing casual babysitter jeans and a tank top, leaning against a doorframe, teasing smile",
      "wearing short denim shorts and a crop top, sitting on a sofa with legs tucked, playful",
      "wearing an off-the-shoulder tee, looking at the camera with a nostalgic and seductive gaze",
      "wearing a sporty black bra and shorts, athletic figure visible, 8k photorealistic",
      "completely nude, lying on a bed with a satisfied and 'older sister' smirk"
    ]
  },
  {
    id: 'skylar_quasi_sibling',
    appearance: "alt style 22yo woman, fit toned 32DD-23-35, dyed hair tips, cheeky and territorial",
    scenes: [
      "wearing an oversized white button-down shirt that hangs halfway down her thighs, leaning against a doorframe",
      "wearing tiny distressed denim shorts and a small top, sitting on a desk with a defiant gaze",
      "wearing a neon string bikini, standing in a hallway, territorial and seductive",
      "wearing a gothic lace bodysuit, rebellious and alluring pose, cinematic lighting",
      "completely nude, standing in a bedroom doorway with a 'bratty' and victorious smile"
    ]
  },
  {
    id: 'vanderbilt_widow_aunt',
    appearance: "stunning 39yo woman, old money elegance, mature hourglass 36D-26-38, vulnerable and gentle",
    scenes: [
      "wearing a black lace mourning morning-gown, in a dim library with boxes, desperate and beautiful",
      "wearing a sheer pearl silk negligee, sitting on the edge of a bed, vulnerable and red-eyed",
      "wearing a deep purple velvet robe, slightly open, looking at the camera with a soft whisper",
      "wearing a highly transparent black mourning veil and nothing else, artistic and evocative lighting",
      "completely nude, draped in expensive velvet, looking at the camera with a longing and relieved expression"
    ]
  }
];

async function queuePrompt(promptText, prefix) {
  const workflow = JSON.parse(JSON.stringify(workflow_template));
  workflow["6"]["inputs"]["text"] = promptText;
  workflow["9"]["inputs"]["filename_prefix"] = prefix;
  workflow["3"]["inputs"]["seed"] = Math.floor(Math.random() * 1000000000);

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

async function checkImage(promptId) {
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
          } catch (e) {}
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
  console.log('👗 Generating missing wardrobe images for 6 characters (30 total)...');
  for (const char of characters) {
    console.log(`\n--- Character: ${char.id} ---`);
    for (let i = 0; i < 5; i++) {
      const filename = `${char.id}_${i + 1}.png`;
      const destPath = path.join(GALLERY_DIR, filename);
      const prompt = `Highly detailed photorealistic image of ${char.appearance}, ${char.scenes[i]}, masterpiece, 8k, cinematic lighting.`;
      
      console.log(`[Queueing] ${filename}...`);
      try {
        const response = await queuePrompt(prompt, `${char.id}_${i + 1}`);
        const prompt_id = response.prompt_id;
        console.log(`  ⏳ Waiting for ${prompt_id}...`);
        const comfyFilename = await checkImage(prompt_id);
        console.log(`  📥 Downloading to ${destPath}...`);
        await downloadImage(comfyFilename, destPath);
      } catch (err) {
        console.error(`  ❌ Error:`, err.message);
      }
    }
  }
  console.log('\n✨ All wardrobe images generated!');
}

run();
