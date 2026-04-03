const fs = require('fs');
const path = require('path');

const COMFY_URL = 'http://127.0.0.1:8000';

const character = {
  id: "sienna_secret_reunion",
  name: "Sienna",
  profilePrompt: "Hyper-realistic close-up portrait of Sienna (22y stunning blonde woman, athletic hourglass). Shocked and panicked expression, wide blue eyes, long flowing blonde hair. High-fidelity skin textures, soft indoor lighting, Juggernaut-XL, 8k.",
  galleryPrompts: [
    "Sienna (22y stunning blonde, athletic hourglass) wearing an Innocent Floral Dress, standing in a sunny living room, shocked expression, wide blue eyes, high-fidelity skin textures, Juggernaut-XL, 8k.",
    "Sienna (22y) in a Tight Grey Workout Set, stretching in your gym, breathless and panicked look, sweat on skin, realistic lighting, 4k realism.",
    "Sienna (22y) in a Short Silk Chemise, walking into your kitchen at night, softest moonlight, stunningly fit figure, Juggernaut-XL realism.",
    "Sienna (22y) in a Black Lace Lingerie Set, standing before a full-length mirror, provocative pose, luxury guest room setting, masterpiece quality.",
    "Sienna (22y) completely exposed, kneeling on your guest bed, messy blonde hair, intense pleading look in eyes, softest shadows, masterpiece achievement, 8k realism."
  ]
};

const workflow = {
  "3": {
    "class_type": "CheckpointLoaderSimple",
    "inputs": { "ckpt_name": "Juggernaut-XL_v9.safetensors" }
  },
  "6": {
    "class_type": "CLIPTextEncode",
    "inputs": { "clip": ["3", 1], "text": "" }
  },
  "7": {
    "class_type": "CLIPTextEncode",
    "inputs": { "clip": ["3", 1], "text": "low quality, blurry, distorted, deformed, (worst quality:1.4), (low quality:1.4), (normal quality:1.4), lowres, extra fingers, missing fingers, text, watermark" }
  },
  "8": {
    "class_type": "VAEDecode",
    "inputs": { "samples": ["13", 0], "vae": ["3", 2] }
  },
  "9": {
    "class_type": "SaveImage",
    "inputs": { "filename_prefix": "new_premium_", "images": ["8", 0] }
  },
  "13": {
    "class_type": "KSampler",
    "inputs": {
      "cfg": 7,
      "denoise": 1,
      "latent_image": ["14", 0],
      "model": ["3", 0],
      "negative": ["7", 0],
      "positive": ["6", 0],
      "sampler_name": "dpmpp_2m_sde_gpu",
      "scheduler": "karras",
      "seed": 0,
      "steps": 25
    }
  },
  "14": {
    "class_type": "EmptyLatentImage",
    "inputs": { "batch_size": 1, "height": 1024, "width": 768 }
  }
};

async function generateImage(prompt, filename, destDir) {
  console.log(`--- Generating: ${filename} ---`);
  const currentWorkflow = JSON.parse(JSON.stringify(workflow));
  currentWorkflow["6"].inputs.text = prompt;
  currentWorkflow["13"].inputs.seed = Math.floor(Math.random() * 1000000);

  try {
    console.log(`  Queuing prompt...`);
    const res = await fetch(`${COMFY_URL}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: currentWorkflow })
    });
    const data = await res.json();
    const promptId = data.prompt_id;
    console.log(`  ⏳ Prompt queued (ID: ${promptId}). Waiting for completion...`);

    let history;
    while (true) {
      const historyRes = await fetch(`${COMFY_URL}/history/${promptId}`);
      const historyData = await historyRes.json();
      const h = historyData[promptId];
      if (h && h.outputs) {
        history = h;
        break;
      }
      await new Promise(r => setTimeout(r, 2000));
    }

    const outputImage = history.outputs["9"].images[0].filename;
    console.log(`  📥 Downloading: ${outputImage}...`);
    const imgRes = await fetch(`${COMFY_URL}/view?filename=${outputImage}`);
    const imgBuffer = await imgRes.arrayBuffer();
    
    const finalPath = path.join(destDir, filename);
    fs.writeFileSync(finalPath, Buffer.from(imgBuffer));
    console.log(`  ✅ Successfully saved: ${filename}`);
  } catch (error) {
    console.error(`  ❌ Error generating ${filename}:`, error.message);
  }
}

async function run() {
  console.log(`🚀 Starting Generation for character ${character.name}...`);

  const profileDir = path.join(process.cwd(), 'public', 'assets', 'profiles');
  const galleryDir = path.join(process.cwd(), 'public', 'gallery');

  if (!fs.existsSync(profileDir)) fs.mkdirSync(profileDir, { recursive: true });
  if (!fs.existsSync(galleryDir)) fs.mkdirSync(galleryDir, { recursive: true });

  // Generate Profile
  await generateImage(character.profilePrompt, `${character.id}_profile.png`, profileDir);

  // Generate Gallery Stages
  for (let i = 0; i < character.galleryPrompts.length; i++) {
    await generateImage(character.galleryPrompts[i], `${character.id}_${i + 1}.png`, galleryDir);
  }

  console.log('\n⭐ Character asset generation complete!');
}

run();
