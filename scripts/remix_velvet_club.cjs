const http = require('http');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://127.0.0.1:7860/sdapi/v1/img2img';
const BASE_IMAGE = '/Users/rahulgirase/Documents/RoleplayApp/public/assets/velvet_club_group_avatar.png';

function fileToBase64(filePath) {
    try {
        const fileData = fs.readFileSync(filePath);
        return fileData.toString('base64');
    } catch (e) {
        console.error(`Error encoding file ${filePath}: ${e.message}`);
        return null;
    }
}

async function generateAvatar(name, prompt_suffix) {
    const filename = `velvet_club_${name.toLowerCase()}_avatar.png`;
    const OUTPUT_FILE = `/Users/rahulgirase/Documents/RoleplayApp/public/assets/${filename}`;
    console.log(`Generating avatar for ${name}...`);
    
    const base64Image = fileToBase64(BASE_IMAGE);
    if (!base64Image) return;

    const fullPrompt = `(8k, masterpiece, ultra-detailed, photorealistic), a beautiful Indian woman, ${prompt_suffix}, in an exclusive high-end pleasure club, bokeh background of club lights, cinematic lighting, professional photography, high-resolution.`;
    
    const postData = JSON.stringify({
        init_images: [base64Image],
        prompt: fullPrompt,
        negative_prompt: "lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, group of people, multiple faces, distorted face",
        steps: 30,
        width: 640,
        height: 640,
        cfg_scale: 7.5,
        denoising_strength: 0.65, // Strong enough to focus on one face but keep the vibe
        sampler_name: "Euler a",
        batch_size: 1,
        n_iter: 1,
        seed: -1
    });

    return new Promise((resolve) => {
        const req = http.request(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        }, (res) => {
            let data = '';
            console.log(`Status for ${name}: ${res.statusCode}`);
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (response.images && response.images[0]) {
                        fs.writeFileSync(OUTPUT_FILE, Buffer.from(response.images[0], 'base64'));
                        console.log(`Successfully generated: ${OUTPUT_FILE}`);
                        resolve(filename);
                    } else {
                        console.error(`Failed to generate ${name}. Body starts with: ${data.substring(0, 200)}`);
                        resolve(null);
                    }
                } catch (e) {
                    console.error(`Error parsing JSON for ${name}: ${e.message}. Body: ${data.substring(0, 200)}`);
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
    const girls = [
        { name: "Eleanor", prompt: "elegant mature Indian woman, sophisticated evening gown, diamonds, poised" },
        { name: "Sarah", prompt: "fit vibrant Indian woman, playful expression, athletic build, sheer club wear" },
        { name: "Priya", prompt: "breathtaking traditional Indian woman, intricate saree, heavy jewelry, devoted gaze" },
        { name: "Chloe", prompt: "flirtatious Indian woman with reddish-tinted hair, bold makeup, provocative lingerie" },
        { name: "Ananya", prompt: "young high-energy Indian student, naughty expression, short club dress" },
        { name: "Aisha", prompt: "sharp corporate Indian woman, commanding presence, silk blouse, stern but sexy" },
        { name: "Victoria", prompt: "wild uninhibited Indian woman, aggressive stance, leather club outfit, messy hair" }
    ];

    for (const girl of girls) {
        await generateAvatar(girl.name, girl.prompt);
    }
}

run();
