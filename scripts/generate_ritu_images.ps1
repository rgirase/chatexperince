# generate_ritu_images.ps1
# Generates character-consistent photos for Ritu using SDXL img2img in ComfyUI

$COMFY_URL = "http://127.0.0.1:8000"
$OUTPUT_DIR = "c:\Users\rgira\chatexperince\public\gallery"
$PROFILE_DIR = "c:\Users\rgira\chatexperince\public\assets\profiles"
$WORKFLOW_FILE = "c:\Users\rgira\chatexperince\scripts\comfy_workflow_ritu_img2img.json"
$workflowTemplate = Get-Content $WORKFLOW_FILE -Raw

# Reference Image for Consistency
$REF_IMAGE_PATH = "$PROFILE_DIR\ritu_bold_bhabhi_profile.png"
$REF_IMAGE_NAME = "ritu_bold_bhabhi_profile.png"

Write-Host "⏳ Waiting for ComfyUI to be ready at $COMFY_URL..." -ForegroundColor Yellow
$ready = $false
while (-not $ready) {
    try {
        $check = Invoke-RestMethod -Method Get -Uri "$COMFY_URL/system_stats" -ErrorAction Stop
        $ready = $true
        Write-Host "🚀 ComfyUI is READY!" -ForegroundColor Cyan
    } catch {
        Write-Host "." -NoNewline -ForegroundColor Yellow
        Start-Sleep -Seconds 5
    }
}

# Upload reference image to ComfyUI for img2img
Write-Host "📤 Uploading reference image for character consistency..." -ForegroundColor Cyan
try {
    $imgBytes = [System.IO.File]::ReadAllBytes($REF_IMAGE_PATH)
    $boundary = [System.Guid]::NewGuid().ToString()
    $LF = "`r`n"
    $bodyLines = (
        "--$boundary",
        "Content-Disposition: form-data; name=`"image`"; filename=`"$REF_IMAGE_NAME`"",
        "Content-Type: image/png",
        "",
        [System.Text.Encoding]::GetEncoding("ISO-8859-1").GetString($imgBytes),
        "--$boundary--",
        ""
    ) -join $LF
    $headers = @{ "Content-Type" = "multipart/form-data; boundary=$boundary" }
    Invoke-RestMethod -Method Post -Uri "$COMFY_URL/upload/image" -Headers $headers -Body $bodyLines -ErrorAction Stop
    Write-Host "✅ Reference image uploaded successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to upload reference image: $($_.Exception.Message)" -ForegroundColor Red
}

$charName = "Ritu (The Bold Bhabhi)"
$charId = "ritu_bold_bhabhi"
$appearance = "stunning 28-year-old Indian woman, perfect hourglass figure (36D-26-38), long dark hair, very thin and delicate gold mangalsutra around her neck, biting her lower lip seductively, deep-neck traditional blouses"

$photoTypes = @(
    # Gallery images using img2img consistency
    @{ index = 1; type = "gallery"; name = "Initial Meeting"; target = "$OUTPUT_DIR\$($charId)_1.png"; prompt = "sitting in a traditional living room, leaning forward slightly, wearing a sky-blue chiffon saree, highlighting her hourglass figure, biting lower lip" },
    @{ index = 2; type = "gallery"; name = "Emerald Seduction"; target = "$OUTPUT_DIR\$($charId)_2.png"; prompt = "standing in a corridor, wearing a deep emerald green silk saree with a sleeveless backless blouse, turning slowly towards the camera, thin gold mangalsutra shining" },
    @{ index = 3; type = "gallery"; name = "Sheer White Intimacy"; target = "$OUTPUT_DIR\$($charId)_3.png"; prompt = "in a private bedroom, wearing a translucent sheer white silk saree with a very low-cut blouse, messy hair, looking at the camera, sweaty skin" },
    @{ index = 4; type = "gallery"; name = "Modern Fusion"; target = "$OUTPUT_DIR\$($charId)_4.png"; prompt = "wearing a modern fusion saree, very tight-fitting and revealing, showcasing her curves, leaning against a wall, biting lower lip, thin mangalsutra visible" },
    @{ index = 5; type = "gallery"; name = "Midnight Secret"; target = "$OUTPUT_DIR\$($charId)_5.png"; prompt = "dimly lit midnight setting, wearing her most daring and uninhibited outfit, unzipped or loosened saree, showing off her figure, assertive expression" }
)

Write-Host "🚀 Starting Consistent Bold Photo Generation for Ritu (img2img)..." -ForegroundColor Cyan

foreach ($type in $photoTypes) {
    Write-Host " [$(($type.index))] Generating $($type.name)..." -ForegroundColor Green

    $extraModifiers = "masterpiece, photorealistic, 8k uhd, cinematic lighting, sharp focus, highly detailed skin texture, sweaty, flushed, arousing, provocative, biting lip detail"
    $fullPrompt = "$charName, $appearance, $($type.prompt), $extraModifiers"
    
    # Update workflow with prompt and image reference
    $currentWorkflow = $workflowTemplate.Replace("__PROMPT__", $fullPrompt).Replace("__IMAGE__", $REF_IMAGE_NAME)
    $body = @{ prompt = ($currentWorkflow | ConvertFrom-Json) } | ConvertTo-Json -Depth 20

    try {
        $res = Invoke-RestMethod -Method Post -Uri "$COMFY_URL/prompt" -Body $body -ContentType "application/json"
        $promptId = $res.prompt_id
        
        $completed = $false
        $attempts = 0
        $maxAttempts = 300 
        while (-not $completed -and $attempts -lt $maxAttempts) {
            Start-Sleep -Seconds 3
            $attempts++
            try {
                $history = Invoke-RestMethod -Method Get -Uri "$COMFY_URL/history/$promptId"
                if ($history.$promptId -and $history.$promptId.outputs) {
                    $outputs = $history.$promptId.outputs
                    # Search for any node that outputted images (usually node '9')
                    foreach ($nodeId in $outputs.PSObject.Properties.Name) {
                        if ($outputs.$nodeId.images) {
                            $completed = $true
                            $imgData = $outputs.$nodeId.images[0]
                            # Cleanly format the URL to avoid PowerShell ampersand issues
                            $viewUrl = "{0}/view?filename={1}&subfolder={2}&type={3}" -f $COMFY_URL, $imgData.filename, $imgData.subfolder, $imgData.type
                            Invoke-WebRequest -Uri $viewUrl -OutFile $type.target
                            Write-Host "    ✅ Saved to $($type.target)" -ForegroundColor Green
                            break
                        }
                    }
                }
            } catch { }
        }
        if (-not $completed) { Write-Host "    ❌ Timeout for $($type.name)" -ForegroundColor Red }
    } catch {
        Write-Host "    ❌ Failed ($($type.name)): $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "⭐ All Ritu photos generated with character consistency!" -ForegroundColor Cyan
