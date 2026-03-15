const http = require('http');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://127.0.0.1:7860/sdapi/v1/img2img';
const BASE_IMAGE = '/Users/rahulgirase/Documents/RoleplayApp/public/assets/kavya_avatar_final_sexy.png';
const OUTPUT_FILE = '/Users/rahulgirase/Documents/RoleplayApp/public/assets/kavya_remix_pose_2.png';

function fileToBase64(filePath) {
    try {
        const fileData = fs.readFileSync(filePath);
        return fileData.toString('base64');
    } catch (e) {
        console.error(`Error encoding file ${filePath}: ${e.message}`);
        return null;
    }
}

async function run() {
    console.log("Generating second pose for Kavya...");
    
    const base64Image = fileToBase64(BASE_IMAGE);
    if (!base64Image) {
        console.error("Base image not found!");
        return;
    }

    // Appearance from personas.js for "forbidden_bhabhi"
    const appearance = "breathtakingly beautiful Indian woman with a voluptuous figure (38C-29-42), wearing a sexy saree with an ultra-revealing, deep-cut blouse highlighting deep cleavage";
    
    // User requested "different sexy pose"
    const targetPose = "sitting provocatively on a bed, leaning back on arms, seductive smile, direct eye contact";

    const prompt = `(8k, masterpiece, ultra-detailed), ${appearance}, ${targetPose}, cinematic lighting, professional photography, high-resolution.`;
    
    const postData = JSON.stringify({
        init_images: [base64Image],
        prompt: prompt,
        negative_prompt: "lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, covering cleavage, conservative dress, face changes",
        steps: 35,
        width: 640,
        height: 640,
        cfg_scale: 7.5,
        denoising_strength: 0.55, // Slightly higher for more variety
        sampler_name: "Euler a",
        batch_size: 1,
        n_iter: 1
    });

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
                } else {
                    console.error("Failed to generate image. Response:", data.substring(0, 500));
                }
            } catch (e) {
                console.error(`Error parsing response: ${e.message}. Data:`, data.substring(0, 500));
            }
        });
    });

    req.on('error', (e) => {
        console.error(`API Error: ${e.message}`);
    });

    req.write(postData);
    req.end();
}

run();
