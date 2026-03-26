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
      "filename_prefix": "batch8_gen",
      "images": ["8", 0]
    }
  }
};

const characters = [
  {
    prefix: 'jade_ex_sister_in_law',
    desc: 'Jade (29yo city beauty, sophisticated, 34DD-25-37)',
    prompts: [
      { name: 'profile.png', dir: OUTPUT_DIR_PROFILES, p: "Highly detailed, photorealistic portrait of Jade (29yo stunning city beauty with an hourglass figure 34DD). Sophisticated and confident expression, modern apartment background, 8k resolution, masterpiece." },
      { name: '1.png', dir: OUTPUT_DIR_GALLERY, p: "Jade (29yo) in a tank top and jeans, packing boxes in a sunlit apartment, focus on her voluptuous figure, 8k, photorealistic." },
      { name: '2.png', dir: OUTPUT_DIR_GALLERY, p: "Jade (29yo) with a sweaty face, wearing a wet white tank top that is slightly transparent, seductive look, packing boxes, 8k." },
      { name: '3.png', dir: OUTPUT_DIR_GALLERY, p: "Jade (29yo) in delicate black lace lingerie, standing amongst half-empty boxes, sophisticated and uninhibited expression, cinematic lighting." },
      { name: '4.png', dir: OUTPUT_DIR_GALLERY, p: "Jade (29yo) wrapped only in a white bath towel, damp skin, looking at the camera with a trusting and intimate smile, 8k." },
      { name: '5.png', dir: OUTPUT_DIR_GALLERY, p: "Jade (29yo) completely nude in her empty apartment, back to the camera but looking over her shoulder with a liberated smile, artistic lighting, masterpiece." }
    ]
  },
  {
    prefix: 'brianna_stepsister_friend',
    desc: 'Brianna (21yo athletic fit girl, 32DD-22-34)',
    prompts: [
      { name: 'profile.png', dir: OUTPUT_DIR_PROFILES, p: "Photorealistic portrait of Brianna (21yo athletic beauty, 32DD, short blonde hair). Teasing and mischievous expression, suburban bedroom background, 8k resolution." },
      { name: '1.png', dir: OUTPUT_DIR_GALLERY, p: "Brianna (21yo) in a tiny crop top and denim shorts, leaning back in a desk chair with a playful smirk, athletic figure, 8k." },
      { name: '2.png', dir: OUTPUT_DIR_GALLERY, p: "Brianna (21yo) in a sporty neon bikini, stretching lazily near a pool, focus on her toned abs and fit body, photorealistic." },
      { name: '3.png', dir: OUTPUT_DIR_GALLERY, p: "Brianna (21yo) wearing only an oversized men's dress shirt, partially unbuttoned, looking at the camera with a dominant and teasing gaze, 8k." },
      { name: '4.png', dir: OUTPUT_DIR_GALLERY, p: "Brianna (21yo) in a sheer black mesh top without lingerie, athletic figure visible, provocative pose, cinematic lighting." },
      { name: '5.png', dir: OUTPUT_DIR_GALLERY, p: "Brianna (21yo) completely nude, lying on a bed with a satisfied smirk, athletic body, artistic lighting, masterpiece." }
    ]
  },
  {
    prefix: 'mrs_sterling_step_aunt',
    desc: 'Mrs. Sterling (40yo severe beauty, 36D-24-38)',
    prompts: [
      { name: 'profile.png', dir: OUTPUT_DIR_PROFILES, p: "Severe and striking portrait of Mrs. Sterling (40yo mature beauty, 36D). Wearing a professional pencil skirt and blazer, cold analytical expression, study background, 8k." },
      { name: '1.png', dir: OUTPUT_DIR_GALLERY, p: "Mrs. Sterling (40yo) in a grey tailored business suit, standing with perfect posture, severe and commanding presence, 8k resolution." },
      { name: '2.png', dir: OUTPUT_DIR_GALLERY, p: "Mrs. Sterling (40yo) peering over her glasses, clinical and intense gaze, holding a pen, authoritative expression, detailed skin." },
      { name: '3.png', dir: OUTPUT_DIR_GALLERY, p: "Mrs. Sterling (40yo) in her office with her blazer removed, silk blouse slightly unbuttoned, powerful and seductive aura, cinematic lighting." },
      { name: '4.png', dir: OUTPUT_DIR_GALLERY, p: "Mrs. Sterling (40yo) in a tight black silk dress, sitting at a desk with an authoritative and intimate look, 8k, masterpiece." },
      { name: '5.png', dir: OUTPUT_DIR_GALLERY, p: "Mrs. Sterling (40yo) completely nude but for her high heels, standing in a study with a severe and yielding expression, artistic lighting." }
    ]
  },
  {
    prefix: 'catherine_mom_friend',
    desc: 'Catherine (41yo glamorous widow, 38D-27-39)',
    prompts: [
      { name: 'profile.png', dir: OUTPUT_DIR_PROFILES, p: "Glamorous portrait of Catherine (41yo blonde widow, 38D). Wearing a low-cut cocktail dress, flirtatious and slightly tipsy expression, hotel bar background, 8k." },
      { name: '1.png', dir: OUTPUT_DIR_GALLERY, p: "Catherine (41yo) in a sequined cocktail dress, spinning on a barstool with a soft laugh, seductive and adventurous energy, 8k." },
      { name: '2.png', dir: OUTPUT_DIR_GALLERY, p: "Catherine (41yo) leaning in close, strap of her dress falling off her shoulder, seductive gaze, cinematic lighting, hotel background." },
      { name: '3.png', dir: OUTPUT_DIR_GALLERY, p: "Catherine (41yo) in a white hotel robe, slightly open, wet hair, looking at the camera with a reckless and inviting smile, 8k." },
      { name: '4.png', dir: OUTPUT_DIR_GALLERY, p: "Catherine (41yo) in black lace lingerie, mature and voluptuous figure, seductive pose on a hotel bed, high detail, masterpiece." },
      { name: '5.png', dir: OUTPUT_DIR_GALLERY, p: "Catherine (41yo) completely nude, draped in hotel sheets, laughing recklessly, mature and beautiful body, 8k resolution." }
    ]
  },
  {
    prefix: 'alexis_older_stepsister',
    desc: 'Alexis (24yo curvy rebel, 36DD-26-38)',
    prompts: [
      { name: 'profile.png', dir: OUTPUT_DIR_PROFILES, p: "Bold and seductive portrait of Alexis (24yo curvy beauty, 36DD). Dark hair, knowing smirk, confident and challenging expression, bedroom doorway background, 8k." },
      { name: '1.png', dir: OUTPUT_DIR_GALLERY, p: "Alexis (24yo) in a bold fashion-forward outfit, leaning against a doorframe with arms crossed under her chest, confident smirk, 8k." },
      { name: '2.png', dir: OUTPUT_DIR_GALLERY, p: "Alexis (24yo) in a micro bikini, posing confidently in a backyard, focus on her curvy and experienced body, 8k photorealistic." },
      { name: '3.png', dir: OUTPUT_DIR_GALLERY, p: "Alexis (24yo) in a red silk slip dress, walking towards the camera with a predatory and alluring gaze, cinematic lighting." },
      { name: '4.png', dir: OUTPUT_DIR_GALLERY, p: "Alexis (24yo) in intricate red lace lingerie, dominant and challenging pose, bedroom background, masterpiece detail." },
      { name: '5.png', dir: OUTPUT_DIR_GALLERY, p: "Alexis (24yo) completely nude, standing in a doorway with a triumphant and seductive smile, curvy body, artistic lighting." }
    ]
  },
  {
    prefix: 'victoria_business_stepmom',
    desc: 'Victoria (34yo ruthless corporate, 34C-26-38)',
    prompts: [
      { name: 'profile.png', dir: OUTPUT_DIR_PROFILES, p: "Ruthless and polished portrait of Victoria (34yo corporate beauty, 34C). Wearing a Tom Ford pinstripe suit, commanding and needy expression, boardroom background, 8k." },
      { name: '1.png', dir: OUTPUT_DIR_GALLERY, p: "Victoria (34yo) in a full business suit, sitting at the head of a conference table, authoritative and weary expression, 8k resolution." },
      { name: '2.png', dir: OUTPUT_DIR_GALLERY, p: "Victoria (34yo) with her heels off, feet on a mahogany table, leaning back with an intimate and needy gaze, office background, 8k." },
      { name: '3.png', dir: OUTPUT_DIR_GALLERY, p: "Victoria (34yo) in her office with the blinds closed, suit jacket removed, silk blouse open, vulnerable and seductive aura, cinematic lighting." },
      { name: '4.png', dir: OUTPUT_DIR_GALLERY, p: "Victoria (34yo) in high-end black lingerie underneath her unbuttoned suit, secret and powerful expression, office background, masterpiece." },
      { name: '5.png', dir: OUTPUT_DIR_GALLERY, p: "Victoria (34yo) completely nude, except for her Louboutin heels, standing in her private office with an authoritative and longing look." }
    ]
  }
];

async function queuePrompt(promptText, prefix) {
  const workflow = JSON.parse(JSON.stringify(workflow_template));
  workflow["6"]["inputs"]["text"] = promptText;
  workflow["9"]["inputs"]["filename_prefix"] = prefix;
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
            // Ignore parse errors
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
    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
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
  console.log('🚀 Starting image generation for Batch 8 (6 characters)...');
  for (const char of characters) {
    console.log(`\n--- Generating for ${char.desc} ---`);
    for (const p of char.prompts) {
      const filename = `${char.prefix}_${p.name}`;
      const destPath = path.join(p.dir, filename);
      console.log(`[Queueing] ${filename}...`);
      try {
        const response = await queuePrompt(p.p, char.prefix + '_' + p.name.replace('.png', ''));
        const prompt_id = response.prompt_id;
        if (!prompt_id) {
            console.error(`  ❌ Failed to get prompt_id.`);
            continue;
        }
        console.log(`  ⏳ Waiting for ${prompt_id}...`);
        const comfyFilename = await checkImage(prompt_id);
        console.log(`  📥 Downloading to ${destPath}...`);
        await downloadImage(comfyFilename, destPath);
      } catch (err) {
        console.error(`  ❌ Error:`, err.message);
      }
    }
  }
  console.log('\n⭐ All images generated for Batch 8!');
}

run();
