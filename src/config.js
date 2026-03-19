// Central configuration for default values and fallbacks
export const DEFAULT_LM_STUDIO_URL = 'http://192.168.1.233:1234/v1';
export const DEFAULT_SD_URL = 'http://127.0.0.1:8000';
export const DEFAULT_IMAGE_ENGINE = 'comfyui';
export const DEFAULT_LM_STUDIO_MODEL = 'local-model';

export const DEFAULT_COMFY_WORKFLOW = {
    "3": { "inputs": { "seed": 42, "steps": 25, "cfg": 7, "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": 1, "model": ["4", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["5", 0] }, "class_type": "KSampler" },
    "4": { "inputs": { "ckpt_name": "Juggernaut-XL_v9.safetensors" }, "class_type": "CheckpointLoaderSimple" },
    "5": { "inputs": { "width": 832, "height": 1216, "batch_size": 1 }, "class_type": "EmptyLatentImage" },
    "6": { "inputs": { "text": "__PROMPT__", "clip": ["4", 1] }, "class_type": "CLIPTextEncode" },
    "7": { "inputs": { "text": "lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry", "clip": ["4", 1] }, "class_type": "CLIPTextEncode" },
    "8": { "inputs": { "samples": ["3", 0], "vae": ["4", 2] }, "class_type": "VAEDecode" },
    "9": { "inputs": { "filename_prefix": "ChatExperience", "images": ["8", 0] }, "class_type": "SaveImage" }
};
