const http = require('http');

const workflow = {
  "3": {
    "inputs": {
      "seed": 1234, "steps": 15, "cfg": 7, "sampler_name": "euler", "scheduler": "normal", "denoise": 1,
      "model": ["12", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["5", 0]
    },
    "class_type": "KSampler"
  },
  "4": {
    "inputs": { "ckpt_name": "v1-5-pruned-emaonly.safetensors" },
    "class_type": "CheckpointLoaderSimple"
  },
  "5": {
    "inputs": { "width": 512, "height": 512, "batch_size": 2 },
    "class_type": "EmptyLatentImage"
  },
  "6": {
    "inputs": { "text": "a beautiful landscape, 8k", "clip": ["4", 1] },
    "class_type": "CLIPTextEncode"
  },
  "7": {
    "inputs": { "text": "text, watermark", "clip": ["4", 1] },
    "class_type": "CLIPTextEncode"
  },
  "8": {
    "inputs": { "samples": ["3", 0], "vae": ["4", 2] },
    "class_type": "VAEDecode"
  },
  "12": {
    "inputs": {
      "model_name": "mm_sd_v15_v2.ckpt",
      "beta_schedule": "sqrt_linear (AnimateDiff)",
      "motion_scale": 1,
      "apply_v2_models_properly": true,
      "model": ["4", 0],
      "latents": ["5", 0],
      "unlimited_area_hack": false,
      "context_length": 16,
      "context_stride": 1,
      "context_overlap": 4,
      "context_schedule": "uniform",
      "closed_loop": false
    },
    "class_type": "ADE_AnimateDiffLoaderV1Advanced"
  },
  "9": {
    "inputs": { "filename_prefix": "test_animatediff_simple", "images": ["8", 0] },
    "class_type": "SaveImage"
  }
};

const postData = JSON.stringify({ prompt: workflow });

const req = http.request({
    hostname: '127.0.0.1',
    port: 8000,
    path: '/prompt',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
}, (res) => {
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Response:', data);
    });
});

req.on('error', (e) => console.error(e));
req.write(postData);
req.end();
