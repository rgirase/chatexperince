const fs = require('fs');
const path = require('path');
const http = require('http');

const COMFY_URL = 'http://127.0.0.1:8000';

async function generateCharacterImages(charId, name, prompts) {
    console.log(`🚀 Starting image generation for ${name}...`);
    const outputDir = 'c:/Users/rgira/chatexperince/public/gallery';
    const profileDir = 'c:/Users/rgira/chatexperince/public/assets/profiles';
    
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    if (!fs.existsSync(profileDir)) fs.mkdirSync(profileDir, { recursive: true });

    for (let i = 0; i < prompts.length; i++) {
        const filename = i === 0 ? `${charId}_profile.png` : `${charId}_${i}.png`;
        const targetPath = i === 0 ? path.join(profileDir, filename) : path.join(outputDir, filename);
        
        if (fs.existsSync(targetPath)) {
            console.log(`✅ ${filename} already exists, skipping.`);
            continue;
        }

        console.log(`[${i+1}/${prompts.length}] Generating image: ${filename}...`);
        
        const workflow = {
            "3": { "class_type": "KSampler", "inputs": { "cfg": 8, "denoise": 1, "latent_image": ["5", 0], "model": ["4", 0], "negative": ["7", 0], "positive": ["6", 0], "sampler_name": "euler", "scheduler": "normal", "seed": Math.floor(Math.random() * 1000000), "steps": 25 } },
            "4": { "class_type": "CheckpointLoaderSimple", "inputs": { "ckpt_name": "Juggernaut-XL_v9.safetensors" } },
            "5": { "class_type": "EmptyLatentImage", "inputs": { "batch_size": 1, "height": 1024, "width": 1024 } },
            "6": { "class_type": "CLIPTextEncode", "inputs": { "clip": ["4", 1], "text": prompts[i] } },
            "7": { "class_type": "CLIPTextEncode", "inputs": { "clip": ["4", 1], "text": "bad quality, blurry, low resolution, watermark, text, signature, deformed, extra limbs, ugly, bad anatomy" } },
            "8": { "class_type": "VAEDecode", "inputs": { "samples": ["3", 0], "vae": ["4", 2] } },
            "9": { "class_type": "SaveImage", "inputs": { "filename_prefix": name.replace(/\s+/g, '_'), "images": ["8", 0] } }
        };

        const postData = JSON.stringify({ prompt: workflow });
        const url = new URL(`${COMFY_URL}/prompt`);

        const promptId = await new Promise((resolve, reject) => {
            const req = http.request({
                hostname: url.hostname,
                port: url.port,
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    const responseData = JSON.parse(data);
                    if (responseData.prompt_id) {
                        resolve(responseData.prompt_id);
                    } else {
                        reject(new Error(`No prompt_id in response: ${data}`));
                    }
                });
            });
            req.on('error', reject);
            req.write(postData);
            req.end();
        });

        console.log(`  ⏳ Waiting for generation (${promptId})...`);

        let completed = false;
        while (!completed) {
            await new Promise(r => setTimeout(r, 3000));
            const history = await new Promise((resolve) => {
                http.get(`${COMFY_URL}/history/${promptId}`, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => resolve(JSON.parse(data)));
                });
            });

            if (history[promptId] && history[promptId].outputs) {
                const outputs = history[promptId].outputs;
                const nodeId = Object.keys(outputs).find(id => outputs[id].images);
                if (nodeId) {
                    completed = true;
                    const img = outputs[nodeId].images[0];
                    const viewUrl = `${COMFY_URL}/view?filename=${img.filename}&subfolder=${img.subfolder}&type=${img.type}`;
                    
                    await new Promise((resolve) => {
                        const file = fs.createWriteStream(targetPath);
                        http.get(viewUrl, (res) => {
                            res.pipe(file);
                            file.on('finish', () => {
                                file.close();
                                resolve();
                            });
                        });
                    });
                    console.log(`  📥 Downloaded result to ${targetPath}`);
                }
            }
        }
    }
    console.log(`⭐ All images generated for ${name}!`);
}

const characters = [
    {
        id: "victoria_educational_stepmom",
        name: "Victoria",
        prompts: [
            "raw photo, masterpiece, 8k, highly detailed, Victoria, 42 year old sophisticated American stepmom, former finishing school instructor, elegant statuesque build, (chestnut brown hair in a neat updo:1.2), cool blue eyes, wearing (highly transparent charcoal grey designer pencil skirt:1.4) AND (sheer white silk blouse:1.4), NO LINGERIE, standing in a luxurious mahogany study, seductive gaze, high-end photography, cinematic lighting",
            "Victoria standing in father's study, instructional pose, sheer professional attire, highly transparent, looking at viewer",
            "Victoria sitting at a desk, checking reports, sheer blouse, no bra visible, elegant and commanding",
            "Victoria adjusting her glasses, seductive look, transparent pencil skirt, no panties visible, high-end aesthetic",
            "Victoria leaning against the door, seductive posture, sheer silk attire, highly detailed skin texture",
            "Victoria in the private library, educational setting, highly transparent designer wear, seductive and submissive to the narrative"
        ]
    },
    {
        id: "anjali_masi_legacy",
        name: "Anjali Masi",
        prompts: [
            "raw photo, masterpiece, 8k, highly detailed, Anjali, 38 year old glamorous Indian Auntie, returned from London, exotic beauty, long dark hair, wearing (highly transparent black party-wear saree:1.4), NO BLOUSE, NO LINGERIE, gold jewelry, sitting on a chaise lounge in a modern guest wing, seductive gaze, cinematic lighting",
            "Anjali Masi pouring wine, sheer black saree, no blouse, highly transparent, exotic jewelry",
            "Anjali Masi looking at the viewer, seductive family secret theme, transparent saree, no blouse",
            "Anjali Masi in the guest wing, soft lighting, sheer silk saree, highly detailed, provocative and submissive",
            "Anjali Masi standing by the window, sheer black saree, no blouse, moonlight lighting",
            "Anjali Masi reclining, seductive pose, highly transparent saree, no blouse, gold ornaments"
        ]
    },
    {
        id: "deepa_badi_mami",
        name: "Deepa Badi Mami",
        prompts: [
            "raw photo, masterpiece, 8k, highly detailed, Deepa, 44 year old Indian village matriarch, regal and maternal beauty, long black hair, wearing (highly transparent golden tissue silk saree:1.4), NO BLOUSE, NO LINGERIE, traditional gold ornaments, standing in a dimly lit village bedroom with sandalwood incense, seductive and commanding gaze, cinematic lighting",
            "Deepa Mami performing family rite, sheer golden saree, no blouse, highly transparent",
            "Deepa Mami unrolling a ceremonial rug, seductive and traditional, transparent silk, no blouse",
            "Deepa Mami looking directly at viewer, sacred intensity, sheer golden saree, no blouse",
            "Deepa Mami in candlelight, highly detailed skin, transparent silk, traditional gold jewelry",
            "Deepa Mami in a submissive yet authoritative posture, vessel of family service, sheer gold saree, no blouse"
        ]
    },
    {
        id: "kavita_senior_mami",
        name: "Kavita Senior Mami",
        prompts: [
            "raw photo, masterpiece, 8k, highly detailed, Kavita, 45 year old Indian ancestral matriarch, imposing and elegant beauty, wearing (highly transparent silver tissue silk saree:1.4), NO BLOUSE, NO LINGERIE, heavy traditional gold ornaments, standing in an ancestral family temple with oil lamps, seductive and authoritative gaze, cinematic lighting",
            "Kavita Mami in the family temple, manhood verification rite, sheer silver saree, no blouse",
            "Kavita Mami with oil lamps, sacred intensity, transparent silver silk, no blouse, heavy gold",
            "Kavita Mami looking at viewer with authoritative gaze, sheer silver saree, no blouse",
            "Kavita Mami in the ancestral house, highly detailed, transparent silk, traditional ornaments",
            "Kavita Mami submissive to the bloodline duty, seductive pose, sheer silver saree, no blouse"
        ]
    }
];

(async () => {
    for (const char of characters) {
        await generateCharacterImages(char.id, char.name, char.prompts);
    }
})();
