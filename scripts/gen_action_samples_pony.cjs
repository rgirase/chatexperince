const fs = require('fs');
const path = require('path');
const http = require('http');

const COMFY_URL = 'http://127.0.0.1:8000';
const OUTPUT_DIR = 'C:/Users/rgira/chatexperince/public/assets/scenes';

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
      "steps": 35
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

const ACTIONS = {
  squeeze: {
    prompt: "close up on torso, ((hands firmly squeezing and squishing breasts:1.4)), ((fingers sinking deep into breast skin:1.3)), deep cleavage, (breast deformation:1.2), red skin marks from pressure, highly detailed skin texture, sweat, luxury penthouse bedroom",
    lora: "phbjcrsc.safetensors"
  },
  penetration: {
    prompt: "close up on lower body, ((thick erect cock deeply penetrating pussy:1.5)), (insertion:1.3), ((pussy lips stretching around cock:1.4)), wet glistening skin, lubrication, extreme detail of labia and genitals, highly detailed skin texture, silk bedsheets",
    lora: "ossplnskFT15rs4.safetensors"
  },
  gangbang: {
    prompt: "5 naked men, one woman, surrounded by men, multiple penises, gangbang, buckeye, messy, facial, breast-splattered, internal creampie, group sex, extreme detail, masterpiece, dark basement studio",
    lora: "gngsrrmphFT15.safetensors"
  },
  cum_shot: {
    prompt: "close up on face and massive breasts, ((thick viscous white cum splattered all over face and boobs:1.5)), (cum dripping from lips:1.3), messy face, glazed eyes, highly detailed skin texture, pearl necklace, masterpiece, bathroom mirror background",
    lora: "orlpvmltlnccFT15.safetensors"
  },
  anal_doggy: {
    prompt: "rear view, (anal penetration:1.4), cock in ass, doggy style, stretching anus, extreme detail of sphincter and genitals, sweating, in a high-end mansion home gym, workout equipment background",
    lora: "ossplnskFT15rs4.safetensors"
  },
  anal_cowgirl: {
    prompt: "facing viewer, sitting on cock, (anal penetration:1.4), cock in ass, cowgirl position, bouncing, extreme detail of labia and anus, in a luxury bedroom, velvet headboard",
    lora: "ossplnskFT15rs4.safetensors"
  },
  anal_side_lying: {
    prompt: "side view, spooning, (anal penetration:1.4), cock in ass, side-lying position, legs pulled back, extreme detail, in a private morning studio, soft lighting",
    lora: "ossplnskFT15rs4.safetensors"
  },
  reverse_cowgirl: {
    prompt: "rear view, sitting on cock, reverse cowgirl, (vaginal penetration:1.4), looking back at viewer over shoulder, arching back, seductive gaze, on a penthouse rooftop balcony, sunset skyline",
    lora: "rvcgcoopcclnFT15.safetensors"
  },
  missionary: {
    prompt: "POV, missionary position, (vaginal penetration:1.4), legs wrapped around waist, eye contact, intense expression, sweat on skin, intimate, on a massive silk bed, master suite",
    lora: "mssncopFT15.safetensors"
  },
  blowjob: {
    prompt: "close up on face, (deepthroat:1.4), sucking cock, mouth full, saliva, looking up at camera, (gagging:0.8), messy hair, in a private mahogany office, executive office desk",
    lora: "orlpvmltlnccFT15.safetensors"
  },
  breast_bondage: {
    prompt: "close up on torso, (breast bondage:1.5), ropes around breasts, (clover clamps:0.7), skin indentation, red rope marks, (topped:1.2), in a dark BDSM studio, leather gear in background",
    lora: "breast_bondage_v2.safetensors"
  },
  bralette_off: {
    prompt: "front view, (removing clothes:1.4), taking off bralette, pulling up top, (topless:1.2), revealed breasts, seductive smile, on a grand estate balcony, moonlight",
    lora: "bralette-off.safetensors"
  },
  double_penetration: {
    prompt: "3 naked people, (double penetration:1.5), one cock in pussy, one cock in ass, simultaneous insertion, extreme detail, group sex, in a luxury penthouse suite, city lights",
    lora: "mmdmltFT15.safetensors"
  }
};

const characters = [
  {
    id: "julia_forgotten_wife",
    name: "Julia",
    appearance: "stunning 34yo American woman, Julia (suburban elegance, 34D-24-36, long dark hair, wearing high-end black silk slip), poised and sophisticated expression"
  },
  {
    id: "millie_thorne",
    name: "Millie",
    appearance: "curvy mature 46yo American woman, Millie Thorne (38DD-30-42, soft features, melancholic eyes, wearing elegant but revealing lace loungewear), emotionally vulnerable expression"
  }
];

async function queuePrompt(char, actionKey) {
  const action = ACTIONS[actionKey];
  const workflow = JSON.parse(JSON.stringify(workflow_template));
  
  workflow["6"]["inputs"]["text"] = `${PONY_PREFIX}${char.appearance}. ${action.prompt}. photorealistic, 8k, masterpiece.`;
  workflow["10"]["inputs"]["lora_name"] = action.lora;
  workflow["9"]["inputs"]["filename_prefix"] = `${char.id}_${actionKey}_pony_sample`;
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
  console.log('🚀 Starting Action Samples Generation (Pony XL)...');
  for (const char of characters) {
    console.log(`\n👤 Processing Character: ${char.name}`);
    for (const actionKey of Object.keys(ACTIONS)) {
      const filename = `${char.id}_${actionKey}_pony_sample.png`;
      const destPath = path.join(OUTPUT_DIR, filename);
      
      // Check if image already exists to allow resuming
      if (fs.existsSync(destPath)) {
        console.log(`  ✅ Action [${actionKey}] already exists, skipping.`);
        continue;
      }

      console.log(`  📸 Generating Action: [${actionKey}]...`);
      try {
        const response = await queuePrompt(char, actionKey);
        const prompt_id = response.prompt_id;
        console.log(`    ⏳ Waiting for generation (${prompt_id})...`);
        const resultFilename = await checkImage(prompt_id);
        console.log(`    📥 Downloading result to ${filename}...`);
        await downloadImage(resultFilename, destPath);
        console.log(`    ✅ Saved!`);
      } catch (err) {
        console.error(`    ❌ Error:`, err.message);
      }
    }
  }
  console.log('\n⭐ All Action Samples Generation Complete!');
}

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
run();
