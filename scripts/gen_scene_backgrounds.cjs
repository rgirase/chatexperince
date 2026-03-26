const fs = require('fs');
const path = require('path');
const http = require('http');

const COMFY_HOST = '127.0.0.1';
const COMFY_PORT = 8000;
const OUTPUT_DIR = path.join(__dirname, '../public/assets/locations');

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const workflow = JSON.parse(fs.readFileSync(path.join(__dirname, '../comfy_workflow_sdxl.json'), 'utf8'));

const scenes = [
    { id: 'bedroom_dim', prompt: "ultra realistic photography of a dimly lit bedroom, soft moody shadows, luxurious bed with silk sheets, warm ambient lighting, highly detailed, 8k" },
    { id: 'living_room_evening', prompt: "modern living room at evening, soft lamplight, comfortable sofa, elegant interior design, cinematic lighting, realistic, 8k" },
    { id: 'kitchen_morning', prompt: "bright modern kitchen in the morning, sunlight streaming through windows, coffee maker on counter, clean minimalist design, photorealistic, 8k" },
    { id: 'kitchen_evening', prompt: "kitchen interior at night, soft warm overhead lights, luxury appliances, intimate home atmosphere, realistic photography, 8k" },
    { id: 'living_room_afternoon', prompt: "spacious living room in the afternoon, bright natural daylight, large windows, contemporary furniture, high quality, 8k" },
    { id: 'steamy_shower', prompt: "modern walk-in shower with glass doors, thick white steam, water droplets on glass, moody bathroom lighting, luxury spa vibe, realistic, 8k" },
    { id: 'public_park', prompt: "beautiful public park landscape, green grass, lush trees, sunny day, walking path, peaceful outdoor setting, photorealistic, 8k" },
    { id: 'club_night', prompt: "luxury nightclub interior, neon purple and blue lighting, empty dance floor, professional bar, cinematic atmosphere, 8k" },
    { id: 'club_restroom', prompt: "stylish nightclub restroom, neon accents, large mirrors, marble counters, dim moody lighting, realistic, 8k" },
    { id: 'restaurant', prompt: "fine dining restaurant interior, elegantly set tables, warm intimate lighting, upscale atmosphere, bokeh background, 8k" },
    { id: 'restaurant_restroom', prompt: "elegant luxury restaurant restroom, gold accents, marble walls, soft lighting, clean and sophisticated, 8k" },
    { id: 'suv_car', prompt: "interior of a luxury SUV at night, leather seats, glowing dashboard instruments, city lights visible through windows, realistic photography, 8k" },
    { id: 'cabin_summer', prompt: "interior of a rustic wooden cabin, summer afternoon sunlight, view of a lake through window, cozy forest retreat, 8k" },
    { id: 'cabin_winter', prompt: "inside a cozy mountain cabin, winter night, heavy snow outside window, fireplace with glowing embers, warm blankets, 8k" },
    { id: 'balcony_river', prompt: "private balcony overlook at night, view of a wide shimmering river, luxury apartment balcony, city lights across the water, cinematic, 8k" },
    { id: 'balcony_eiffel', prompt: "luxurious balcony in Paris, direct view of the illuminated Eiffel Tower at night, romantic city atmosphere, highly detailed, 8k" },
    { id: 'ny_street', prompt: "empty New York City street at night, wet pavement reflecting street lights, brick buildings, urban atmosphere, realistic, 8k" },
    { id: 'paris_street', prompt: "charming cobblestone street in Paris, old architecture, flower boxes, cafe tables on sidewalk, romantic morning light, 8k" },
    { id: 'office_meeting', prompt: "modern corporate meeting room, large glass table, panoramic city view through floor-to-ceiling windows, professional lighting, 8k" },
    { id: 'office_boss', prompt: "executive boss office, large mahogany desk, comfortable leather chair, private bookshelves, sophisticated professional atmosphere, 8k" }
];

async function queuePrompt(promptText) {
    const currentWorkflow = JSON.parse(JSON.stringify(workflow));
    currentWorkflow["6"].inputs.text = promptText;
    currentWorkflow["3"].inputs.seed = Math.floor(Math.random() * 1000000);

    const postData = JSON.stringify({ prompt: currentWorkflow });

    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: COMFY_HOST,
            port: COMFY_PORT,
            path: '/prompt',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        }, (res) => {
            let data = '';
            res.on('data', d => data += d);
            res.on('end', () => resolve(JSON.parse(data)));
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

function checkStatus(promptId) {
    return new Promise((resolve, reject) => {
        http.get(`http://${COMFY_HOST}:${COMFY_PORT}/history/${promptId}`, (res) => {
            let data = '';
            res.on('data', d => data += d);
            res.on('end', () => {
                const history = JSON.parse(data);
                if (history[promptId]) {
                    resolve(history[promptId]);
                } else {
                    resolve(null);
                }
            });
        }).on('error', reject);
    });
}

async function downloadImage(filename, savePath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(savePath);
        http.get(`http://${COMFY_HOST}:${COMFY_PORT}/view?filename=${filename}`, (res) => {
            res.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(savePath, () => {});
            reject(err);
        });
    });
}

async function generateAll() {
    console.log(`🚀 Starting generation of ${scenes.length} backgrounds...`);

    for (const scene of scenes) {
        const filename = `${scene.id}.jpg`;
        const fullPath = path.join(OUTPUT_DIR, filename);

        if (fs.existsSync(fullPath)) {
            console.log(`⏩ Skipping ${scene.id}, already exists.`);
            continue;
        }

        console.log(`🎨 Generating: ${scene.id}...`);
        try {
            const queueResponse = await queuePrompt(scene.prompt);
            const promptId = queueResponse.prompt_id;

            let finished = false;
            while (!finished) {
                const history = await checkStatus(promptId);
                if (history) {
                    const outputFilename = history.outputs["9"].images[0].filename;
                    await downloadImage(outputFilename, fullPath);
                    console.log(`✅ Saved: ${filename}`);
                    finished = true;
                } else {
                    await new Promise(r => setTimeout(r, 2000));
                }
            }
        } catch (e) {
            console.error(`❌ Failed ${scene.id}:`, e.message);
        }
    }
    console.log("✨ All scenes generated!");
}

generateAll();
