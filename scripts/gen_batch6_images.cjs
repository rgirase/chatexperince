const fs = require('fs');
const path = require('path');
const http = require('http');

// Configuration
const COMFY_URL = 'http://127.0.0.1:8000';
const OUTPUT_DIR = path.join(__dirname, '../public/assets/profiles');
const GALLERY_DIR = path.join(__dirname, '../public/gallery');
const WORKFLOW_PATH = path.join(__dirname, '../comfy_workflow_sdxl.json');

// Ensure directories exist
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(GALLERY_DIR)) fs.mkdirSync(GALLERY_DIR, { recursive: true });

// Batch 6 Characters and their image prompts
const charactersToGen = [
    {
        id: 'melanie_stepmom_cabin',
        appearance: "stunning 36yo blonde bombshell, heavy hourglass figure, large natural breasts, arctic blue eyes, pale skin, wet blonde hair",
        outfits: [
            "oversized cable knit wool sweater, shivering, clutching a blanket",
            "sheer white thermal tank top and grey leggings, wet from snow",
            "highly transparent silk slip, shivering in the dark cabin",
            "wrapped tightly in a single wool blanket, only her bare shoulders visible",
            "nude under a large fur blanket, huddled close for warmth, seductive gaze"
        ]
    },
    {
        id: 'jade_stepsister_dorm',
        appearance: "20yo rebel brunette, petite hourglass, perky breasts, dark messy hair, piercings, rebellious gaze",
        outfits: [
            "oversized vintage band t-shirt, no pants, messy dorm bed",
            "tiny ribbed white crop top, sweating in a hot dorm room",
            "sheer lace thong and over-the-knee socks, leaning back on a bed",
            "highly transparent black mesh top, no bra, defiant expression",
            "nude covered only by a thin dorm sheet, messy hair, inviting gaze"
        ]
    },
    {
        id: 'victoria_aunt_estate',
        appearance: "42yo ageless queenly brunette, heavy hourglass, statuesque, large heavy breasts, regal features",
        outfits: [
            "floor-length midnight blue silk evening gown, holding a wine glass",
            "highly transparent black lace robe, unbelted, showing curves",
            "sheer satin chemise, wet from rain on the porch",
            "unbuttoned men's silk dress shirt, barefoot, sophisticated gaze",
            "nude wrapped in expensive silk sheets, elegant and ready"
        ]
    },
    {
        id: 'chloe_cousin_roadtrip',
        appearance: "24yo fit blonde, girl-next-door, soccer body, toned abs, perky 34D breasts, freckles",
        outfits: [
            "tight white tank top and tiny denim cut-offs, road trip vibe",
            "sheer silk nightie, sitting on a cheap motel bed",
            "oversized white t-shirt, no underwear, wet from a rest stop splash",
            "highly transparent white lace panties only, laying on motel pillows",
            "nude in a motel shower, steam and glass, wet hair"
        ]
    },
    {
        id: 'isabella_stepmom_office',
        appearance: "38yo power executive brunette, tall statuesque, heavy hourglass, large breasts, sharp bob cut",
        outfits: [
            "tight charcoal designer power suit, unbuttoned jacket",
            "highly transparent white silk blouse, no bra, pencil skirt",
            "sheer black lace camisole, sitting on a mahogany desk",
            "unbuttoned white dress shirt, barefoot in a corner office",
            "nude in a leather executive chair, drinking scotch, city lights background"
        ]
    },
    {
        id: 'vanessa_step_aunt_wedding',
        appearance: "32yo auburn vixen, tight toned hourglass, vixen features, dark flashing eyes",
        outfits: [
            "tight red cocktail dress, pushing limits, wedding party background",
            "highly transparent white lace dress, seductive vixen gaze",
            "sheer black stockings and lace garter belt only, predatory grin",
            "transparent white lingerie set, unbuttoned, leaning forward",
            "nude with a bridal veil and champagne glass, victorious gaze"
        ]
    },
    {
        id: 'madison_cousin_attic',
        appearance: "26yo blonde intellectual, soft hourglass, large natural breasts, intelligent eyes, honey blonde hair",
        outfits: [
            "thin white cotton sundress, sweaty and flushed in a hot attic",
            "sheer white ribbed tank top, dress straps pulled down",
            "highly transparent silk camisole, messy hair, attic setting",
            "white lace brazilian panties only, sitting on a wooden trunk",
            "nude covered by an old dusty sheet, flushed face, seductive"
        ]
    },
    {
        id: 'sarah_aunt_divorce',
        appearance: "40yo mature blonde, full inviting hourglass, large natural breasts, warm smile, thick blonde hair",
        outfits: [
            "loosely tied silk sleep robe, holding a wine glass in a dark kitchen",
            "highly transparent black lace nightgown, vulnerable gaze",
            "unbuttoned men's flannel shirt, no pants, bare legs",
            "sheer white silk negligee, sitting on a guest room bed",
            "nude in the dark kitchen moonlight, soft and inviting"
        ]
    },
    {
        id: 'claire_stepmom_study',
        appearance: "34yo intellectual brunette, glasses, soft hourglass, large breasts, refined features",
        outfits: [
            "silk blouse and cardigan, glasses, leaning over a desk",
            "highly transparent white silk blouse, no bra, library setting",
            "sheer black stockings and a short skirt, sitting on a desk",
            "unbuttoned white blouse, glasses pulled down, biting lip",
            "nude among old books, soft lighting, intellectual gaze"
        ]
    },
    {
        id: 'isabel_moms_friend',
        appearance: "40yo glamorous raven-haired vixen, heavy hourglass, large breasts, full red lips",
        outfits: [
            "borrowed silk robe, half-open, tipsy expression",
            "highly transparent red lace set, leaning against a door",
            "sheer black chemise, holding a wine glass, seductive grin",
            "sheer silk nightie, messy hair, sleepover setting",
            "nude on a guest bed, drunk on wine and desire"
        ]
    },
    {
        id: 'evelyn_stepmom_swim',
        appearance: "36yo blonde vixen, athletic hourglass, large perky breasts, wet blonde hair, tan lines",
        outfits: [
            "white one-piece swimsuit, wet and clinging, poolside",
            "highly transparent wet white swimsuit, surfacing from water",
            "loosely wrapped white towel, dripping wet, seductive gaze",
            "sheer silk robe over wet skin, midnight moonlight",
            "nude in the pool water, ripples and reflections, inviting"
        ]
    },
    {
        id: 'nora_stepsister_funeral',
        appearance: "28yo mysterious brunette, full hourglass, large breasts, dark intense eyes, black hair",
        outfits: [
            "tight black funeral dress, intense gaze, hotel room",
            "highly transparent black silk negligee, mourning dynamic",
            "sheer black lace set, sitting on a bed, heavy mood",
            "unbuttoned black dress shirt, barefoot, tired eyes",
            "nude under heavy hotel blankets, searching for comfort"
        ]
    }
];

// ComfyUI Helper Functions
async function generateImage(prompt, filename) {
    const workflow = JSON.parse(fs.readFileSync(WORKFLOW_PATH, 'utf8'));
    
    // Update prompts in workflow
    // Node 6 is usually CLIP Text Encode (Positive)
    workflow["6"]["inputs"]["text"] = prompt + ", highly detailed, high quality, masterwork, juggernaut xl style, realistic, sharp focus, extreme transperancy, seductive";
    
    // Node 3 is KSampler (Seed)
    workflow["3"]["inputs"]["seed"] = Math.floor(Math.random() * 1000000);

    const postData = JSON.stringify({ prompt: workflow });

    return new Promise((resolve, reject) => {
        const req = http.request(`${COMFY_URL}/prompt`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                const response = JSON.parse(data);
                const promptId = response.prompt_id;
                console.log(`Prompt queued: ${promptId}`);
                checkStatus(promptId, filename, resolve, reject);
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

function checkStatus(promptId, filename, resolve, reject) {
    const check = () => {
        http.get(`${COMFY_URL}/history/${promptId}`, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                const history = JSON.parse(data);
                if (history[promptId]) {
                    const outputFilename = history[promptId].outputs["9"].images[0].filename;
                    downloadImage(outputFilename, filename, resolve, reject);
                } else {
                    setTimeout(check, 2000);
                }
            });
        }).on('error', reject);
    };
    check();
}

function downloadImage(comfyFilename, targetFilename, resolve, reject) {
    const file = fs.createWriteStream(targetFilename);
    http.get(`${COMFY_URL}/view?filename=${comfyFilename}`, (res) => {
        res.pipe(file);
        file.on('finish', () => {
            file.close();
            console.log(`Saved: ${targetFilename}`);
            resolve();
        });
    }).on('error', reject);
}

// Main Runner
async function main() {
    const profilesOnly = process.argv.includes('--profiles-only');
    console.log(`Starting Batch 6 Generation (Profiles Only: ${profilesOnly})`);

    for (const char of charactersToGen) {
        console.log(`\nGenerating for: ${char.id}`);
        
        // 1. Profile Image
        const profilePrompt = `(Profile photo), ${char.appearance}, wearing ${char.outfits[0]}, ${char.id} style`;
        const profilePath = path.join(OUTPUT_DIR, `${char.id}_profile.png`);
        await generateImage(profilePrompt, profilePath);

        if (!profilesOnly) {
            // 2. Gallery Images
            for (let i = 0; i < char.outfits.length; i++) {
                const galleryPrompt = `(Full body photo), ${char.appearance}, wearing ${char.outfits[i]}, extreme transparency, revealing, seductive, ${char.id} scene`;
                const galleryPath = path.join(GALLERY_DIR, `${char.id}_${i + 1}.png`);
                await generateImage(galleryPrompt, galleryPath);
            }
        }
    }
    console.log('\nBatch 6 Generation Complete!');
}

main().catch(console.error);
