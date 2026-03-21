# generate_tiffany_extended.ps1
# Generates 10 additional high-quality OnlyFans/Fitness photos for Tiffany

$COMFY_URL = "http://127.0.0.1:8000"
$OUTPUT_DIR = "C:\Users\rgira\chatexperince\public\gallery"
$WORKFLOW_FILE = "C:\Users\rgira\.gemini\antigravity\brain\8604d1fc-cb0d-4397-a9ec-09a14e5bc98d\comfy_workflow_sdxl.json"
$workflowTemplate = Get-Content $WORKFLOW_FILE -Raw

$charName = "Tiffany (Bimbo Stepmom)"
$charId = "tiffany_bimbo_stepmom"
$appearance = "stunning 32-year-old Caucasian woman with a 'bimbo' aesthetic, platinum blonde hair, full lip fillers, tanned skin, very fit hourglass figure (36DDD-24-36), diamond navel piercing, thin gold chain necklace"

$photoTypes = @(
    @{ index = 6; name = "Ring Light Setup"; prompt = "adjusting a camera ring light in a home gym, wearing only a sheer lacy robe, back view showing curves, fitness influencer vibe" },
    @{ index = 7; name = "Shower Selfie"; prompt = "steamy bathroom mirror, holding a phone, wearing a tiny thong and sports bra, wet hair, provocative pose" },
    @{ index = 8; name = "Bed POV"; prompt = "lying on a plush bed looking up at camera with a seductive smile, wearing lacy black lingerie, highly detailed skin" },
    @{ index = 9; name = "Workout Slip"; prompt = "performing squats in a gym, 'accidental' wardrobe slip of her tight leggings, looking at camera with a wink, high energy" },
    @{ index = 10; name = "Sunset Bikini"; prompt = "standing on a luxury balcony at sunset, wearing a tiny neon-yellow bikini, golden hour lighting, cinematic" },
    @{ index = 11; name = "Yoga Inversion"; prompt = "performing a yoga pose showing flexibility, tight yoga pants pulling tight against curves, focus on legs and crotch" },
    @{ index = 12; name = "Kitchen Baking"; prompt = "wearing only a tiny frilly apron over lingerie in a modern kitchen, holding a spatula, looking playful and sexy" },
    @{ index = 13; name = "Car Selfie"; prompt = "sitting in the driver's seat of a luxury car, low-cut top, seatbelt passing between large breasts, looking at camera" },
    @{ index = 14; name = "Library Naughty"; prompt = "hidden between library shelves, pulling up a short skirt to reveal lacy panties, wearing glasses, 'naughty librarian' vibe" },
    @{ index = 15; name = "OnlyFans Live"; prompt = "sitting in front of a computer screen with a ring light reflection in eyes, wearing a crop top and thong, blowing a kiss to camera" }
)

Write-Host "🚀 Starting Extended Photo Generation for Tiffany..." -ForegroundColor Cyan

foreach ($type in $photoTypes) {
    $targetPath = Join-Path $OUTPUT_DIR "$($charId)_$($type.index).png"
    Write-Host " [$(($type.index))] Generating $($type.name)..." -ForegroundColor Green

    $extraModifiers = "masterpiece, photorealistic, 8k uhd, cinematic lighting, sharp focus, seductive gaze, alluring"
    $fullPrompt = "$charName, $appearance, $($type.prompt), $extraModifiers"
    
    $currentWorkflow = $workflowTemplate.Replace("__PROMPT__", $fullPrompt)
    $body = @{ prompt = ($currentWorkflow | ConvertFrom-Json) } | ConvertTo-Json -Depth 20

    try {
        $res = Invoke-RestMethod -Method Post -Uri "$COMFY_URL/prompt" -Body $body -ContentType "application/json"
        $promptId = $res.prompt_id
        
        $completed = $false
        $attempts = 0
        $maxAttempts = 100
        while (-not $completed -and $attempts -lt $maxAttempts) {
            Start-Sleep -Seconds 5
            $attempts++
            try {
                $history = Invoke-RestMethod -Method Get -Uri "$COMFY_URL/history/$promptId"
                if ($history.$promptId -and $history.$promptId.outputs) {
                    $outputs = $history.$promptId.outputs
                    if ($outputs.'9') {
                        $completed = $true
                        $img = $outputs.'9'.images[0]
                        $viewUrl = "$COMFY_URL/view?filename=$($img.filename)&subfolder=$($img.subfolder)&type=$($img.type)"
                        Invoke-WebRequest -Uri $viewUrl -OutFile $targetPath
                        Write-Host "    ✅ Saved to $($targetPath)" -ForegroundColor Green
                    }
                }
            } catch { }
        }
        if (-not $completed) { Write-Host "    ❌ Timeout" -ForegroundColor Red }
    } catch {
        Write-Host "    ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "⭐ All extended photos generated!" -ForegroundColor Cyan
