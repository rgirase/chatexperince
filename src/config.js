// Central configuration for default values and fallbacks
export const DEFAULT_LM_STUDIO_URL = `http://${window.location.hostname}:5173/api-ollama`;
export const DEFAULT_SD_URL = `http://${window.location.hostname}:8000`;
export const DEFAULT_NEXUS_URL = `http://${window.location.hostname}:8001`;

export const DEFAULT_IMAGE_ENGINE = 'comfyui';
export const DEFAULT_LM_STUDIO_MODEL = 'gemma2:9b';

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

export const DEFAULT_REALISM_WORKFLOW = {
    "3": { "inputs": { "seed": 42, "steps": 25, "cfg": 7, "sampler_name": "euler_ancestral", "scheduler": "normal", "denoise": 1, "model": ["4", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["5", 0] }, "class_type": "KSampler" },
    "4": { "inputs": { "ckpt_name": "realvisxlV50_v50LightningBakedvae.safetensors" }, "class_type": "CheckpointLoaderSimple" },
    "5": { "inputs": { "width": 832, "height": 1216, "batch_size": 1 }, "class_type": "EmptyLatentImage" },
    "6": { "inputs": { "text": "__PROMPT__", "clip": ["4", 1] }, "class_type": "CLIPTextEncode" },
    "7": { "inputs": { "text": "lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, (unnatural skin:1.2), (monochrome:1.1), (grayscale:1.1), (headless:1.5), (out of frame:1.3), cropped head, blurry face", "clip": ["4", 1] }, "class_type": "CLIPTextEncode" },
    "8": { "inputs": { "samples": ["3", 0], "vae": ["4", 2] }, "class_type": "VAEDecode" },
    "10": { "inputs": { "model_name": "bbox/face_yolov8m.pt" }, "class_type": "UltralyticsDetectorProvider" },
    "11": { "inputs": { "image": ["8", 0], "model": ["4", 0], "clip": ["4", 1], "vae": ["4", 2], "positive": ["6", 0], "negative": ["7", 0], "bbox_detector": ["10", 0], "guide_size": 384, "guide_size_for": true, "max_size": 1024, "seed": 42, "steps": 20, "cfg": 8, "sampler_name": "euler_ancestral", "scheduler": "normal", "denoise": 0.5, "feather": 5, "noise_mask": true, "force_inpaint": true, "bbox_threshold": 0.5, "bbox_dilation": 10, "bbox_crop_factor": 3, "sam_detection_hint": "center-1", "sam_dilation": 0, "sam_threshold": 0.93, "sam_bbox_expansion": 0, "sam_mask_hint_threshold": 0.7, "sam_mask_hint_use_negative": "False", "drop_size": 10, "wildcard": "", "cycle": 1 }, "class_type": "FaceDetailer" },
    "12": { "inputs": { "filename_prefix": "ChatExperience_Realism", "images": ["11", 0] }, "class_type": "SaveImage" }
};
export const AVAILABLE_PONY_MODELS = [
    { 
        id: "realvisxlV50_v50LightningBakedvae.safetensors", 
        name: "RealVisXL V5.0", 
        category: "Photorealistic",
        description: "Latest benchmark for photorealism. Exceptional skin textures and lighting."
    },
    { 
        id: "snofsSexNudesAndOtherFunStuff_v13Base.safetensors", 
        name: "SNOFS v1.3", 
        category: "Uncensored Realism",
        description: "Specialized model for high-fidelity anatomical realism and detail."
    },
    { 
        id: "unstableRevolution_V3Fp16.safetensors", 
        name: "Unstable Revolution V3", 
        category: "Premium Realism",
        description: "Top-tier realism model with high dynamic range and crisp details."
    },
    { 
        id: "realismIllustriousBy_v55FP16.safetensors", 
        name: "Realism Illustrious V5.5", 
        category: "Anime Realism",
        description: "Bridges the gap between Illustrious anime styles and high-end realism."
    },
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

