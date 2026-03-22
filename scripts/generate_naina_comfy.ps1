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

$charName = "Naina (The Secret Wife)"
$charId = "indian_ex_gf"
$appearance = "breathtakingly beautiful 26-year-old Indian woman, soft feminine figure (34C-26-38), sophisticated interior designer, elegant power saree"

$prompts = @(
    @{ name = "Profile Shot"; file = "$PROFILE_DIR\indian_ex_gf_profile.png"; prompt = "portrait shot, looking at camera with a confident yet secret smile, wearing a professional silk power saree, luxury car interior background, high-end makeup" },
    @{ name = "Secret Meeting"; file = "$OUTPUT_DIR\indian_ex_gf_1.png"; prompt = "leaning against a door, looking at user with intense longing, unbuttoning her saree, revealing black lace lingerie beneath, dimly lit room, high-contrast lighting" },
    @{ name = "Late Night Consultation"; file = "$OUTPUT_DIR\indian_ex_gf_2.png"; prompt = "sitting on a bed, pointing at a blueprint but looking at user seductively, wearing a sheer nightie, moonlight through window, intimate atmosphere" },
    @{ name = "Desperate Passion"; file = "$OUTPUT_DIR\indian_ex_gf_3.png"; prompt = "standing close to user, hands on user's chest, hair slightly messy, flushed face, wearing a tight silk blouse unbuttoned at the top, provocative gaze" },
    @{ name = "The Morning After"; file = "$OUTPUT_DIR\indian_ex_gf_4.png"; prompt = "wrapped in a white bedsheet, looking out of the window with a mix of regret and satisfaction, soft morning light, messy hair, glowing skin" },
    @{ name = "Elite Gala"; file = "$OUTPUT_DIR\indian_ex_gf_5.png"; prompt = "wearing a stunning gold designer saree, deep plunging neckline, standing in a crowded luxury lounge but looking only at user with a secret invitation, bokeh background" }
)

Write-Host "dYs? Starting Consistent Steamy Photo Generation for Naina..." -ForegroundColor Green

foreach ($p in $prompts) {
    $type = $p
    Write-Host " [$($prompts.IndexOf($p))] Generating $($type.name)..." -ForegroundColor Cyan
    
    $extraModifiers = "masterpiece, photorealistic, 8k uhd, cinematic lighting, sharp focus, highly detailed skin texture, sweaty, flushed, arousing, provocative"
    $fullPrompt = "$charName, $appearance, $($type.prompt), $extraModifiers"
    
    # Update workflow with prompt using JSON object manipulation (safer than -replace)
    $workflowObj = $workflowTemplate | ConvertFrom-Json
    $workflowObj."6".inputs.text = $fullPrompt
    $body = @{ prompt = $workflowObj } | ConvertTo-Json -Depth 20

    try {
        $res = Invoke-RestMethod -Method Post -Uri "$COMFY_URL/prompt" -Body $body -ContentType "application/json"
        $promptId = $res.prompt_id
        
        # Wait for completion
        $done = $false
        while (-not $done) {
            $history = Invoke-RestMethod -Method Get -Uri "$COMFY_URL/history/$promptId"
            if ($history.$promptId) {
                $done = $true
                $output = $history.$promptId.outputs."9".images[0]
                $filename = $output.filename
                $subfolder = $output.subfolder
                
                # Fetch and save image
                $imgUrl = "$COMFY_URL/view?filename=$filename&subfolder=$subfolder&type=output"
                Invoke-WebRequest -Uri $imgUrl -OutFile $type.file
                Write-Host "    o. Saved to $($type.file)" -ForegroundColor Gray
            } else {
                Start-Sleep -Seconds 5
            }
        }
    } catch {
        Write-Host "    ?O Failed ($($type.name)): $_" -ForegroundColor Red
    }
}

Write-Host "-? All Naina photos generated and updated via ComfyUI!" -ForegroundColor Green
