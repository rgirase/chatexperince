# restart_comfy.ps1
# Use this script to start ComfyUI with remote access (Mobile/Tailscale) enabled.

$PYTHON = "C:\Users\rgira\Documents\ComfyUI\.venv\Scripts\python.exe"
$MAIN_PY = "C:\Users\rgira\AppData\Local\Programs\ComfyUI\resources\ComfyUI\main.py"
$EXTRA_CONFIG = "C:\Users\rgira\AppData\Local\Temp\extra_model_paths.yaml"
$USER_DIR = "C:\Users\rgira\Documents\ComfyUI\user"
$INPUT_DIR = "C:\Users\rgira\Documents\ComfyUI\input"
$OUTPUT_DIR = "C:\Users\rgira\Documents\ComfyUI\output"

Write-Host "🚀 Starting ComfyUI with Remote Access & CORS..." -ForegroundColor Cyan

# Update/Verify Extra Model Paths
$configContent = @"
comfyui:
    base_path: C:\Users\rgira\Documents\ComfyUI
    checkpoints: models/checkpoints
    vae: models/vae
    loras: models/loras
    upscale_models: models/upscale_models
    controlnet: models/controlnet
    clip: models/clip
    clip_vision: models/clip_vision
    style_models: models/style_models
    embeddings: models/embeddings
    diffusers: models/diffusers
    vae_approx: models/vae_approx
    gligen: models/gligen
    unclip: models/unclip
    u-net: models/u-net
"@
$configContent | Out-File $EXTRA_CONFIG -Encoding utf8

# Kill existing process on 8000
$portProcess = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($portProcess) {
    Write-Host "⚠️ Port 8000 is busy. Closing existing ComfyUI..." -ForegroundColor Yellow
    Stop-Process -Id $portProcess.OwningProcess -Force -ErrorAction SilentlyContinue
}

# Run
# Run
# Run
& $PYTHON $MAIN_PY --listen 0.0.0.0 --port 8000 --enable-cors-header --force-fp16 --fp16-vae --fp16-text-enc --extra-model-paths-config $EXTRA_CONFIG --input-directory $INPUT_DIR --output-directory $OUTPUT_DIR --user-directory $USER_DIR
