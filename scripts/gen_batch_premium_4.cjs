const fs = require('fs');
const path = require('path');

const COMFY_URL = 'http://127.0.0.1:8000';

const characters = [
  {
    id: "evelyn_strict_guardian",
    name: "Aunt Evelyn",
    profilePrompt: "Hyper-realistic close-up portrait of Aunt Evelyn (45y high-society American woman, fit sharp figure). Sophisticated and commanding expression, refined bun, sharp blue eyes, wearing a sharp designer suit. High-fidelity skin textures, cinematic lighting, Juggernaut-XL, 8k.",
    galleryPrompts: [
      "Aunt Evelyn (45y high-society American, fit sharp figure, refined bun) wearing a Sharp Designer Navy Suit, standing behind an antique desk, polishing reading glasses, sophisticated and commanding, cool blue eyes, cinematic lighting, 8k resolution",
      "Aunt Evelyn (45y) in a deep blue Open Silk Robe, walking down a grand hallway, hand resting on the wall, hand-polished wood textures, soft amber lighting, revealing toned legs, hyper-realistic",
      "Aunt Evelyn (45y) in a Black Lace Bodysuit, sitting on a leather sofa in a dimly lit library, posture of absolute authority, intense gaze, Juggernaut-XL realism, masterpiece",
      "Aunt Evelyn (45y) in Sheer Midnight Blue Lingerie, standing by a large window at night, city lights background, realistic skin textures, stunningly fit figure, 4k realism",
      "Aunt Evelyn (45y) completely exposed, reclined on a leather sofa, softest shadows, intense eye contact, masterpiece achievement, 8k realism, fit powerful figure"
    ]
  },
  {
    id: "brianna_ex_sister_in_law",
    name: "Brianna",
    profilePrompt: "Hyper-realistic close-up portrait of Brianna (28y blonde ex-sister-in-law, fit hourglass figure). Playful smirk, messy blonde hair, smoky eyes, looking directly at camera. Natural lighting, high-fidelity skin textures, Juggernaut-XL, 8k.",
    galleryPrompts: [
      "Brianna (28y blonde ex-sister-in-law, fit hourglass) wearing an Oversized Grey Hoodie that barely covers her thighs, leaning against a doorframe, playful smirk, long messy blonde hair, dim kitchen light, 8k realism",
      "Brianna (28y) in Tight Yoga Wear, stretching in a living room, athletic build, teasing posture, high-fidelity skin textures, Juggernaut-XL style",
      "Brianna (28y) in a Short White Silk Chemise, sitting on a guest bed, looking up with a cheeky smile, soft morning light, hyper-realistic, stunning beauty",
      "Brianna (28y) in a Black Lace Lingerie Set, standing before a full-length mirror, provocative pose, luxury bedroom setting, 4k realistic skin, masterpiece quality",
      "Brianna (28y) completely exposed, kneeling on a guest bed, messy blonde hair, intense desire in eyes, softest shadows, masterpiece achievement, 8k realism"
    ]
  },
  {
    id: "victoria_boss_wife",
    name: "Victoria",
    profilePrompt: "Hyper-realistic close-up portrait of Victoria (38y wealthy American milf, hourglass figure, long dark hair). Sultry and manipulative expression, emerald necklace, stunning beauty. Penthouse lighting, high-fidelity skin textures, Juggernaut-XL, 8k.",
    galleryPrompts: [
      "Victoria (38y wealthy American milf, hourglass figure, long dark hair) wearing a Tight Emerald Cocktail Dress, standing by a penthouse window at night, city lights background, stunning elegance, 8k resolution",
      "Victoria (38y) in an Open Emerald Silk Robe, reclining on a velvet chaise lounge, revealing fit curves, soft boudoir lighting, hyper-realistic skin, Juggernaut-XL style",
      "Victoria (38y) in a Black Lace Bodysuit, standing on a penthouse terrace, sunset lighting, golden hour, wind in her hair, provocative posture, masterpiece realism",
      "Victoria (38y) in Sheer Designer Lingerie, standing in a walk-in closet, mirror reflections, extreme detail, realistic skin textures, 4k resolution",
      "Victoria (38y) completely exposed, standing at the window, city lights reflecting on skin, intense desire, hyper-realistic, stunning beauty, 8k resolution"
    ]
  },
  {
    id: "jade_exchange_sister",
    name: "Jade",
    profilePrompt: "Hyper-realistic close-up portrait of Jade (22y European blonde, athletic hourglass). Sultry and cheeky smirk, long blonde hair, bright blue eyes. Warm sunlight, high-fidelity skin textures, Juggernaut-XL, 8k.",
    galleryPrompts: [
      "Jade (22y European blonde, athletic hourglass) wearing a Tiny Skin-Tight White Summer Dress, leaning against a kitchen counter, cheeky smirk, warm morning sunlight, realistic skin, 8k resolution",
      "Jade (22y) in a Lacy Bralette Set, messy blonde hair, sitting on a kitchen table, provocative pose, long toned legs, Juggernaut-XL style, masterpiece realism",
      "Jade (22y) in a Short Silk Sleep Nightie, standing in a hallway at night, ethereal glow from behind, stunningly fit figure, 4k realistic skin",
      "Jade (22y) in a Black Lace Lingerie Set, standing before a full-length mirror, bold unashamed eye contact, provocative posture, luxury bedroom setting",
      "Jade (22y) completely exposed, standing in a kitchen doorway, highlight on fit athletic figure, intense desire in eyes, hyper-realistic, 8k resolution"
    ]
  }
];

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
  console.log('🚀 Starting Batch Generation for 4 New Premium Characters...');

  const profileDir = path.join(process.cwd(), 'public', 'assets', 'profiles');
  const galleryDir = path.join(process.cwd(), 'public', 'gallery');

  if (!fs.existsSync(profileDir)) fs.mkdirSync(profileDir, { recursive: true });
  if (!fs.existsSync(galleryDir)) fs.mkdirSync(galleryDir, { recursive: true });

  for (const char of characters) {
    console.log(`\n⭐ Character: ${char.name} (${char.id})`);
    
    // Generate Profile
    await generateImage(char.profilePrompt, `${char.id}_profile.png`, profileDir);

    // Generate Gallery Stages
    for (let i = 0; i < char.galleryPrompts.length; i++) {
        await generateImage(char.galleryPrompts[i], `${char.id}_${i + 1}.png`, galleryDir);
    }
  }

  console.log('\n⭐ ALL IMAGES GENERATED SUCCESSFULLY!');
}

run();
