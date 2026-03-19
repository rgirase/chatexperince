$COMFY_URL = "http://127.0.0.1:8000"
$OUTPUT_PATH = "c:\Users\rgira\chatexperince\public\assets\profiles\velvet_club_group.png"
$prompt = "High-end luxury velvet club interior, three beautiful sophisticated diverse women, elegant evening wear, silk sarees and cocktail dresses, mysterious smiles, masterpiece, 8k uhd, photorealistic, glamorous atmosphere"

# Simple workflow snippet for ComfyUI API
$workflow = @{
    "3" = @{
        "inputs" = @{
            "seed" = [Random]::new().Next(1, 1000000000)
            "steps" = 20
            "cfg" = 8
            "sampler_name" = "euler"
            "scheduler" = "normal"
            "denoise" = 1
            "model" = @("4", 0)
            "positive" = @("6", 0)
            "negative" = @("7", 0)
            "latent_image" = @("5", 0)
        }
        "class_type" = "KSampler"
    }
    "4" = @{ "inputs" = @{ "ckpt_name" = "sd_xl_base_1.0.safetensors" }; "class_type" = "CheckpointLoaderSimple" }
    "5" = @{ "inputs" = @{ "width" = 1024; "height" = 1024; "batch_size" = 1 }; "class_type" = "EmptyLatentImage" }
    "6" = @{ "inputs" = @{ "text" = "$prompt, masterpiece, best quality"; "clip" = @("4", 1) }; "class_type" = "CLIPTextEncode" }
    "7" = @{ "inputs" = @{ "text" = "ugly, deformed, blurry, low quality, watermarks"; "clip" = @("4", 1) }; "class_type" = "CLIPTextEncode" }
    "8" = @{ "inputs" = @{ "samples" = @("3", 0); "vae" = @("4", 2) }; "class_type" = "VAEDecode" }
    "9" = @{ "inputs" = @{ "filename_prefix" = "VelvetClub"; "images" = @("8", 0) }; "class_type" = "SaveImage" }
}

$body = @{ prompt = $workflow } | ConvertTo-Json -Depth 20
try {
    Write-Host "Sending to ComfyUI..."
    $res = Invoke-RestMethod -Method Post -Uri "$COMFY_URL/prompt" -Body $body -ContentType "application/json"
    $promptId = $res.prompt_id
    Write-Host "Queued: $promptId"
} catch {
    Write-Host "Failed to connect to ComfyUI at $COMFY_URL. Is it running?" -ForegroundColor Red
}
