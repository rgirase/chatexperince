# generate_payal_comfy.ps1
# Generates consistent high-quality photos for Payal using local ComfyUI

$COMFY_URL = "http://127.0.0.1:8000"
$OUTPUT_DIR = "c:\Users\rgira\chatexperince\public\gallery"
$PROFILE_DIR = "c:\Users\rgira\chatexperince\public\assets\profiles"
$WORKFLOW_FILE = "C:\Users\rgira\.gemini\antigravity\brain\8604d1fc-cb0d-4397-a9ec-09a14e5bc98d\comfy_workflow_sdxl.json"
$workflowTemplate = Get-Content $WORKFLOW_FILE -Raw

$charName = "Payal (Liberal Bhabhi)"
$charId = "payal_newlywed_bride"
$appearance = "breathtakingly beautiful 22-year-old Indian woman, soft innocent beauty but with a bold gaze, curvy figure (34C-26-38), wearing traditional heavy gold jewelry and red bridal lehenga, intricate dark henna (Mehandi) on hands and feet"

$photoTypes = @(
    @{ index = 0; type = "profile"; name = "Profile Shot"; target = "$PROFILE_DIR\$($charId)_profile.png"; prompt = "portrait shot, looking at camera with a shy but bold smile, wearing heavy gold necklace and red bridal lehenga" },
    @{ index = 1; type = "gallery"; name = "Bridal Bed"; target = "$OUTPUT_DIR\$($charId)_1.png"; prompt = "sitting on a decorated bed, adjusting hennaed hands, looking up at camera, red bridal lehenga" },
    @{ index = 2; type = "gallery"; name = "Reception Balcony"; target = "$OUTPUT_DIR\$($charId)_2.png"; prompt = "wearing an emerald green silk saree, standing on a balcony at night, city lights background, confident expression" },
    @{ index = 3; type = "gallery"; name = "Net Saree"; target = "$OUTPUT_DIR\$($charId)_3.png"; prompt = "wearing a translucent black net saree, leaning against a wall, naughty playful smile, touching neck with hennaed hands" },
    @{ index = 4; type = "gallery"; name = "Morning Satin"; target = "$OUTPUT_DIR\$($charId)_4.png"; prompt = "morning-after look, wearing a white satin dressing gown, sitting by a window, soft natural light, hair slightly messy" },
    @{ index = 5; type = "gallery"; name = "Private Desire"; target = "$OUTPUT_DIR\$($charId)_5.png"; prompt = "intimate close-up, wearing a sheer red silk dupatta, bold passionate desire in eyes, reaching towards camera" },
    # Wardrobe Avatars
    @{ index = 1; type = "wardrobe"; name = "Bridal Avatar"; target = "$PROFILE_DIR\$($charId)_wardrobe_1.png"; prompt = "square avatar shot, focusing on the intricate gold embroidery and vibrant red of her bridal lehenga, close-up" },
    @{ index = 2; type = "wardrobe"; name = "Emerald Avatar"; target = "$PROFILE_DIR\$($charId)_wardrobe_2.png"; prompt = "square avatar shot, focusing on the deep green silk and elegant drape of her emerald saree" },
    @{ index = 3; type = "wardrobe"; name = "Net Avatar"; target = "$PROFILE_DIR\$($charId)_wardrobe_3.png"; prompt = "square avatar shot, focusing on the translucent black net fabric and her naughty expression" },
    @{ index = 4; type = "wardrobe"; name = "Satin Avatar"; target = "$PROFILE_DIR\$($charId)_wardrobe_4.png"; prompt = "square avatar shot, focusing on the soft white satin texture and her relaxed morning look" },
    @{ index = 5; type = "wardrobe"; name = "Sheer Avatar"; target = "$PROFILE_DIR\$($charId)_wardrobe_5.png"; prompt = "square avatar shot, focusing on the provocative sheer red silk dupatta and her bold passionate gaze" }
)

Write-Host "🚀 Starting Consistent Photo Generation for Payal..." -ForegroundColor Cyan

foreach ($type in $photoTypes) {
    Write-Host " [$(($type.index))] Generating $($type.name)..." -ForegroundColor Green

    $extraModifiers = "masterpiece, photorealistic, 8k uhd, cinematic lighting, sharp focus, highly detailed skin texture"
    $fullPrompt = "$charName, $appearance, $($type.prompt), $extraModifiers"
    
    # Check if we can use a reference image (simplified: just detailed prompt for now as per workflow support)
    $currentWorkflow = $workflowTemplate.Replace("__PROMPT__", $fullPrompt)
    $body = @{ prompt = ($currentWorkflow | ConvertFrom-Json) } | ConvertTo-Json -Depth 20

    try {
        $res = Invoke-RestMethod -Method Post -Uri "$COMFY_URL/prompt" -Body $body -ContentType "application/json"
        $promptId = $res.prompt_id
        
        $completed = $false
        $attempts = 0
        $maxAttempts = 120
        while (-not $completed -and $attempts -lt $maxAttempts) {
            Start-Sleep -Seconds 3
            $attempts++
            try {
                $history = Invoke-RestMethod -Method Get -Uri "$COMFY_URL/history/$promptId"
                if ($history.$promptId -and $history.$promptId.outputs) {
                    $outputs = $history.$promptId.outputs
                    if ($outputs.'9') {
                        $completed = $true
                        $img = $outputs.'9'.images[0]
                        $viewUrl = "$COMFY_URL/view?filename=$($img.filename)&subfolder=$($img.subfolder)&type=$($img.type)"
                        Invoke-WebRequest -Uri $viewUrl -OutFile $type.target
                        Write-Host "    ✅ Saved to $($type.target)" -ForegroundColor Green
                    }
                }
            } catch { }
        }
        if (-not $completed) { Write-Host "    ❌ Timeout" -ForegroundColor Red }
    } catch {
        Write-Host "    ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "⭐ All Payal photos generated and updated!" -ForegroundColor Cyan
