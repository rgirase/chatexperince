const http = require('http');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://127.0.0.1:7860/sdapi/v1/img2img';
const BASE_IMAGE = '/Users/rahulgirase/Documents/RoleplayApp/public/assets/kavya_avatar_final_sexy.png';

function fileToBase64(filePath) {
    try {
        const fileData = fs.readFileSync(filePath);
        return fileData.toString('base64');
    } catch (e) {
        console.error(`Error encoding file ${filePath}: ${e.message}`);
        return null;
    }
}

async function generatePose(index, targetPose) {
    const OUTPUT_FILE = `/Users/rahulgirase/Documents/RoleplayApp/public/assets/kavya_remix_option_${index}.png`;
    console.log(`Generating option ${index}: ${targetPose}...`);
    
    const base64Image = fileToBase64(BASE_IMAGE);
    if (!base64Image) return;

    // Appearance from personas.js for "forbidden_bhabhi"
    const appearance = "breathtakingly beautiful Indian woman with a voluptuous figure (38C-29-42), wearing a sexy saree with an ultra-revealing, deep-cut blouse highlighting deep cleavage";
    
    const prompt = `(8k, masterpiece, ultra-detailed), ${appearance}, ((${targetPose})), cinematically posed, dramatic lighting, professional erotic photography, high-resolution.`;
    
    const postData = JSON.stringify({
        init_images: [base64Image],
        prompt: prompt,
        negative_prompt: "lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, covering cleavage, conservative dress, face changes, standing straight, portrait",
        steps: 40,
        width: 640,
        height: 640,
        cfg_scale: 8.0,
        denoising_strength: 0.85, // Radical change to break the standing silhouette
        sampler_name: "Euler a",
        batch_size: 1,
        n_iter: 1,
        seed: -1 // Fully random
    });

    return new Promise((resolve, reject) => {
        const req = http.request(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (response.images && response.images[0]) {
                        fs.writeFileSync(OUTPUT_FILE, Buffer.from(response.images[0], 'base64'));
                        console.log(`Successfully generated: ${OUTPUT_FILE}`);
                        resolve(OUTPUT_FILE);
                    } else {
                        console.error(`Failed to generate option ${index}`);
                        resolve(null);
                    }
                } catch (e) {
                    resolve(null);
                }
            });
        });

        req.on('error', (e) => {
            console.error(`API Error: ${e.message}`);
            resolve(null);
        });

        req.write(postData);
        req.end();
    });
}

async function run() {
    const poses = [
        "lying on a bed provocatively, arched back, looking at camera, messy hair",
        "bending over a balcony railing, looking back over shoulder with a seductive smirk",
        "sitting on a kitchen counter, legs apart, holding a glass of wine, revealing blouse",
        "kneeling on a plush rug, hands pulling at saree pallu, intense gaze"
    ];

    for (let i = 0; i < poses.length; i++) {
        await generatePose(i + 1, poses[i]);
    }
}

run();
