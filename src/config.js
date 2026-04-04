// Central configuration for default values and fallbacks
export const DEFAULT_LM_STUDIO_URL = `http://${window.location.hostname}:1234/v1`;
export const DEFAULT_SD_URL = `http://${window.location.hostname}:8000`;
export const DEFAULT_IMAGE_ENGINE = 'comfyui';
export const DEFAULT_LM_STUDIO_MODEL = 'local-model';

export const DEFAULT_COMFY_WORKFLOW = {
    "3": { "inputs": { "seed": 42, "steps": 50, "cfg": 7, "sampler_name": "dpmpp_2m_sde", "scheduler": "karras", "denoise": 1, "model": ["4", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["5", 0] }, "class_type": "KSampler" },
    "4": { "inputs": { "ckpt_name": "bigLust_v16.safetensors" }, "class_type": "CheckpointLoaderSimple" },
    "5": { "inputs": { "width": 832, "height": 1216, "batch_size": 1 }, "class_type": "EmptyLatentImage" },
    "6": { "inputs": { "text": "__PROMPT__", "clip": ["4", 1] }, "class_type": "CLIPTextEncode" },
    "7": { "inputs": { "text": "lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry", "clip": ["4", 1] }, "class_type": "CLIPTextEncode" },
    "8": { "inputs": { "samples": ["3", 0], "vae": ["4", 2] }, "class_type": "VAEDecode" },
    "9": { "inputs": { "filename_prefix": "ChatExperience", "images": ["8", 0] }, "class_type": "SaveImage" }
};

export const DEFAULT_PONY_WORKFLOW = {
    "3": { "inputs": { "seed": 42, "steps": 50, "cfg": 7, "sampler_name": "dpmpp_2m_sde", "scheduler": "karras", "denoise": 1, "model": ["4", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["5", 0] }, "class_type": "KSampler" },
    "4": { "inputs": { "ckpt_name": "bigLust_v16.safetensors" }, "class_type": "CheckpointLoaderSimple" },
    "5": { "inputs": { "width": 832, "height": 1216, "batch_size": 1 }, "class_type": "EmptyLatentImage" },
    "6": { "inputs": { "text": "score_9, score_8_up, score_7_up, score_6_up, score_5_up, score_4_up, rating_explicit, __PROMPT__", "clip": ["11", 0] }, "class_type": "CLIPTextEncode" },
    "7": { "inputs": { "text": "score_4, score_3, score_2, score_1, (worst quality:1.2), (low quality:1.2), (normal quality:1.2), lowres, bad anatomy, bad hands, text, error", "clip": ["11", 0] }, "class_type": "CLIPTextEncode" },
    "8": { "inputs": { "samples": ["3", 0], "vae": ["12", 0] }, "class_type": "VAEDecode" },
    "9": { "inputs": { "filename_prefix": "ChatExperience_Pony", "images": ["8", 0] }, "class_type": "SaveImage" },
    "11": { "class_type": "CLIPSetLastLayer", "inputs": { "stop_at_clip_layer": -2, "clip": ["4", 1] } },
    "12": { "class_type": "VAELoader", "inputs": { "vae_name": "sdxl_vae_fix.safetensors" } }
};

export const AVAILABLE_PONY_MODELS = [
    { id: "bigLust_v16.safetensors", name: "Premium: Big Lust v16 (Latest Realism)" },
    { id: "0184PONYLordkamix_v10.safetensors", name: "Pony: LordKamix v10 (Default)" },
    { id: "vendoPonyRealistic_v13Lora.safetensors", name: "Pony: Vendo Realistic v13" },
    { id: "4gbPONY4STEP2GB_fp8FullCheckpoint.safetensors", name: "Pony: 4-Step 2GB (Lite/Fast)" },
    { id: "aimrimPonyIllusSDXL_v10ILLFP16.safetensors", name: "Pony: Aimrim Illustrious" },
    { id: "ponyLoraLover_v10.safetensors", name: "Pony: Lora Lover v1.0" },
    { id: "ponyMegaMixXL_v20.safetensors", name: "Pony: Mega Mix XL v2" },
    { id: "cartoonStyle_v02.safetensors", name: "Pony: Cartoon Style v0.2" },
    { id: "disneyrealcartoonmix_v10.safetensors", name: "Pony: Disney Real Cartoon Mix v1.0" },
    { id: "alchemistMixReal_v20.safetensors", name: "Pony: Alchemist Mix Real v2.0 (New)" },
    { id: "vendoPonyAnimated_v10.safetensors", name: "Pony: Vendo Animated" },
    { id: "realismByStableYogi_ponyV3VAE.safetensors", name: "Pony: Stable Yogi Realism V3" },
    { id: "Juggernaut-XL_v9.safetensors", name: "SDXL: Juggernaut XL v9 (Cinematic Realism)" },
    { id: "realisticVisionV60B1_v51HyperVAE.safetensors", name: "SD 1.5: Realistic Vision V6.0 B1 (Hyper VAE)" },
    { id: "Realistic_Vision_V6.0_NV_B1.safetensors", name: "SD 1.5: Realistic Vision V6.0 NV" }
];
