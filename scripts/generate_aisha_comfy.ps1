# generate_aisha_comfy.ps1
# Generates consistent high-quality "steamy" photos for Aisha using local ComfyUI

$COMFY_URL = "http://127.0.0.1:8000"
$OUTPUT_DIR = "c:\Users\rgira\chatexperince\public\gallery"
$PROFILE_DIR = "c:\Users\rgira\chatexperince\public\assets\profiles"
$WORKFLOW_FILE = "C:\Users\rgira\.gemini\antigravity\brain\8604d1fc-cb0d-4397-a9ec-09a14e5bc98d\comfy_workflow_sdxl.json"
$workflowTemplate = Get-Content $WORKFLOW_FILE -Raw

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

$charName = "Aisha (Eager Employee)"
$charId = "indian_colleague"
$appearance = "breathtakingly beautiful 24-year-old Indian woman, athletic and curvy figure (34DD-26-38), long wavy dark hair, stylish sharp glasses, bold red lipstick"

$photoTypes = @(
    @{ index = 0; type = "profile"; name = "Profile Shot"; target = "$PROFILE_DIR\$($charId)_profile.png"; prompt = "portrait shot, looking at camera with a shy but very bold and eager smile, wearing a tight white silk blouse unbuttoned at the top, heavy cleavage, sweaty skin, messy hair, provocative gaze" },
    @{ index = 1; type = "gallery"; name = "Office Desk"; target = "$OUTPUT_DIR\$($charId)_1.png"; prompt = "leaning deep over the office desk towards the camera, showcasing deep cleavage, looking up with a submissive and eager expression, wearing a tight grey power suit jacket with nothing underneath, messy hair" },
    @{ index = 2; type = "gallery"; name = "Late Night Seduction"; target = "$OUTPUT_DIR\$($charId)_2.png"; prompt = "late night in the office, dimly lit, wearing only a sleeveless sheer white silk top, visibly aroused, hard nipples visible through fabric, sweaty skin, looking devotedly at the camera" },
    @{ index = 3; type = "gallery"; name = "Executive Lounge"; target = "$OUTPUT_DIR\$($charId)_3.png"; prompt = "sitting in a leather executive chair, legs spread slightly, wearing a skin-tight black pencil skirt hiked up high, looking over her glasses seductively, heavy breathing" },
    @{ index = 4; type = "gallery"; name = "Company Gala"; target = "$OUTPUT_DIR\$($charId)_4.png"; prompt = "standing at a gala, wearing a metallic gold dress with a dangerously low plunging neckline and high slit, showing off her curves, looking back over her shoulder invitingly" },
    @{ index = 5; type = "gallery"; name = "Private Submission"; target = "$OUTPUT_DIR\$($charId)_5.png"; prompt = "in a private setting, wearing a provocative black office dress unzipped at the back, kneeling on the floor looking up eagerly, submissive and ready to please, messy hair, flushed face" }
)

Write-Host "🚀 Starting Consistent Steamy Photo Generation for Aisha..." -ForegroundColor Cyan

foreach ($type in $photoTypes) {
    Write-Host " [$(($type.index))] Generating $($type.name)..." -ForegroundColor Green

    $extraModifiers = "masterpiece, photorealistic, 8k uhd, cinematic lighting, sharp focus, highly detailed skin texture, sweaty, flushed, arousing, provocative"
    $fullPrompt = "$charName, $appearance, $($type.prompt), $extraModifiers"
    
    # Update workflow with prompt using JSON object manipulation (safer than -replace)
    $workflowObj = $workflowTemplate | ConvertFrom-Json
    $workflowObj."6".inputs.text = $fullPrompt
    $body = @{ prompt = $workflowObj } | ConvertTo-Json -Depth 20

    try {
        $res = Invoke-RestMethod -Method Post -Uri "$COMFY_URL/prompt" -Body $body -ContentType "application/json"
        $promptId = $res.prompt_id
        
        $completed = $false
        $attempts = 0
        $maxAttempts = 200 # Increased timeout for SDXL
        while (-not $completed -and $attempts -lt $maxAttempts) {
            Start-Sleep -Seconds 3
            $attempts++
            try {
                $history = Invoke-RestMethod -Method Get -Uri "$COMFY_URL/history/$promptId"
                if ($history.$promptId -and $history.$promptId.outputs) {
                    $outputs = $history.$promptId.outputs
                    # Node 9 is the SaveImage node in this workflow
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
        if (-not $completed) { Write-Host "    ❌ Timeout for $($type.name)" -ForegroundColor Red }
    } catch {
        Write-Host "    ❌ Failed ($($type.name)): $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "⭐ All Aisha photos generated and updated via ComfyUI!" -ForegroundColor Cyan
