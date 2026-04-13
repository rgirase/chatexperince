// Central configuration for default values and fallbacks
export const DEFAULT_LM_STUDIO_URL = `http://${window.location.hostname}:1234/v1`;
export const DEFAULT_SD_URL = `http://${window.location.hostname}:8000`;
export const DEFAULT_IMAGE_ENGINE = 'comfyui';
export const DEFAULT_LM_STUDIO_MODEL = 'local-model';

export const DEFAULT_COMFY_WORKFLOW = {
    "3": { "inputs": { "seed": 42, "steps": 25, "cfg": 7, "sampler_name": "euler_ancestral", "scheduler": "normal", "denoise": 1, "model": ["4", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["5", 0] }, "class_type": "KSampler" },
    "4": { "inputs": { "ckpt_name": "bigLust_v16.safetensors" }, "class_type": "CheckpointLoaderSimple" },
    "5": { "inputs": { "width": 832, "height": 1216, "batch_size": 1 }, "class_type": "EmptyLatentImage" },
    "6": { "inputs": { "text": "__PROMPT__", "clip": ["4", 1] }, "class_type": "CLIPTextEncode" },
    "7": { "inputs": { "text": "lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, (unnatural skin:1.2), (monochrome:1.1), (grayscale:1.1), (headless:1.5), (out of frame:1.3), cropped head, blurry face", "clip": ["4", 1] }, "class_type": "CLIPTextEncode" },
    "8": { "inputs": { "samples": ["3", 0], "vae": ["4", 2] }, "class_type": "VAEDecode" },
    "9": { "inputs": { "filename_prefix": "ChatExperience", "images": ["8", 0] }, "class_type": "SaveImage" }
};

export const DEFAULT_PONY_WORKFLOW = {
    "3": { "inputs": { "seed": 42, "steps": 25, "cfg": 7, "sampler_name": "euler_ancestral", "scheduler": "normal", "denoise": 1, "model": ["4", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["5", 0] }, "class_type": "KSampler" },
    "4": { "inputs": { "ckpt_name": "bigLust_v16.safetensors" }, "class_type": "CheckpointLoaderSimple" },
    "5": { "inputs": { "width": 832, "height": 1216, "batch_size": 1 }, "class_type": "EmptyLatentImage" },
    "6": { "inputs": { "text": "score_9, score_8_up, score_7_up, score_6_up, score_5_up, score_4_up, rating_explicit, __PROMPT__", "clip": ["11", 0] }, "class_type": "CLIPTextEncode" },
    "7": { "inputs": { "text": "score_4, score_3, score_2, score_1, (worst quality:1.2), (low quality:1.2), (normal quality:1.2), lowres, bad anatomy, bad hands, text, error, (unnatural skin:1.2), (monochrome:1.1), (grayscale:1.1), (headless:1.5), (out of frame:1.3), cropped head, blurry face", "clip": ["11", 0] }, "class_type": "CLIPTextEncode" },
    "8": { "inputs": { "samples": ["3", 0], "vae": ["4", 2] }, "class_type": "VAEDecode" },
    "9": { "inputs": { "filename_prefix": "ChatExperience_Pony", "images": ["8", 0] }, "class_type": "SaveImage" },
    "11": { "class_type": "CLIPSetLastLayer", "inputs": { "stop_at_clip_layer": -2, "clip": ["4", 1] } }
};

export const AVAILABLE_PONY_MODELS = [
    { 
        id: "bigLust_v16.safetensors", 
        name: "Big Lust v16", 
        category: "Premium Realism",
        description: "Latest high-fidelity character model. Best for hyper-realistic details and high-end aesthetics."
    },
    { 
        id: "Juggernaut-XL_v9.safetensors", 
        name: "Juggernaut XL v9", 
        category: "Cinematic",
        description: "High-quality general purpose SDXL model. Best for cinematic lighting, portraits, and environmental depth."
    },
    { 
        id: "Realistic_Vision_V6.0_NV_B1.safetensors", 
        name: "Realistic Vision V6", 
        category: "Photorealistic",
        description: "Standard for photorealistic human portraits (SD 1.5). Best for grounded, life-like results."
    },
    { 
        id: "disneyrealcartoonmix_v10.safetensors", 
        name: "Disney Real Cartoon", 
        category: "3D Animation",
        description: "Pixar/Disney movie style. Best for vibrant, expressive 3D animated character looks."
    },
    { 
        id: "autismmixSDXL_autismmixPony.safetensors", 
        name: "AutismMix Pony", 
        category: "Pony Diffusion",
        description: "Versatile Pony-based model. Excellent for both stylized and semi-realistic character art."
    },
    { 
        id: "0184PONYLordkamix_v10.safetensors", 
        name: "LordKamix v10", 
        category: "Illustrative",
        description: "Default sturdy Pony mix. Best for anime-style illustrations and clean character sheets."
    },
    { 
        id: "aimrimPonyIllusSDXL_v10ILLFP16.safetensors", 
        name: "Aimrim Illustrious", 
        category: "Anime/Manga",
        description: "Specialized for high-end illustrative anime styles. Best for comic panels and manga art."
    },
    { 
        id: "ponyMegaMixXL_v20.safetensors", 
        name: "Pony Mega Mix V2", 
        category: "Comprehensive Mix",
        description: "A blend of multiple Pony models. High flexibility for complex tags and poses."
    },
    { 
        id: "alchemistMixReal_v20.safetensors", 
        name: "Alchemist Mix Real", 
        category: "Semi-Realistic",
        description: "Bridging the gap between 2D and 3D. Best for fantasy characters and artistic realism."
    },
    { 
        id: "realismByStableYogi_ponyV3VAE.safetensors", 
        name: "Stable Yogi Realism", 
        category: "Pony Realism",
        description: "Retains Pony flexibility but targets realistic skin and lighting. Best for 'realistic' 2D art."
    },
    { 
        id: "vendoPonyRealistic_v13Lora.safetensors", 
        name: "Vendo Pony Real", 
        category: "Stylized Realism",
        description: "A popular mix for high-contrast, 'premium' rendered character looks."
    },
    { 
        id: "vendoPonyAnimated_v10.safetensors", 
        name: "Vendo Animated", 
        category: "2D Animation",
        description: "Flat, clean animated lines. Best for cell-shaded comic styles and cartoons."
    },
    { 
        id: "ponyLoraLover_v10.safetensors", 
        name: "Pony Lora Lover", 
        category: "LoRA Compatible",
        description: "Highly receptive to additional LoRAs. Best for specific character or clothing LoRAs."
    },
    { 
        id: "v1-5-pruned-emaonly.safetensors", 
        name: "SD 1.5 Base", 
        category: "Standard",
        description: "Standard SD 1.5 model. Best for traditional, fast generations or when using 1.5 LoRAs."
    }
];
