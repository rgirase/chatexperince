$COMFY_URL = "http://127.0.0.1:8000"
$WARDROBE_DIR = "c:\Users\rgira\chatexperince\public\gallery\wardrobe"
$PROFILE_DIR = "c:\Users\rgira\chatexperince\public\assets\profiles"
$WORKFLOW_FILE = "C:\Users\rgira\.gemini\antigravity\brain\8604d1fc-cb0d-4397-a9ec-09a14e5bc98d\comfy_workflow_sdxl.json"
$workflowTemplate = Get-Content $WORKFLOW_FILE -Raw

Write-Host "Waiting for ComfyUI to be ready at $COMFY_URL..." -ForegroundColor Yellow
$ready = $false
while (-not $ready) {
    try {
        $check = Invoke-RestMethod -Method Get -Uri "$COMFY_URL/system_stats" -ErrorAction Stop
        $ready = $true
        Write-Host "ComfyUI is READY!" -ForegroundColor Cyan
    } catch {
        Write-Host "." -NoNewline -ForegroundColor Yellow
        Start-Sleep -Seconds 5
    }
}

$charName = "Emily (The Summer Niece)"
$appearance = "beautiful 19-year-old American university student, athletic sun-kissed figure, long blonde hair, expressive blue eyes, wearing trendy summer clothes"

$prompts = @(
    @{ name = "Profile Image"; file = "$PROFILE_DIR\emily_summer_niece_profile.png"; prompt = "portrait shot, looking at camera with a playful smile, standing by a luxury swimming pool, bright summer day" },
    @{ name = "Yellow Sundress"; file = "$WARDROBE_DIR\emily_1.png"; prompt = "wearing a tiny yellow sundress, laughing, holding a tropical drink, patio background" },
    @{ name = "Poolside Bikini"; file = "$WARDROBE_DIR\emily_2.png"; prompt = "wearing a skimpy bikini, coming out of the swimming pool, wet hair, water dripping down her body, seductive gaze" },
    @{ name = "Jacuzzi Silk Wrap"; file = "$WARDROBE_DIR\emily_3.png"; prompt = "sitting in a steamy jacuzzi, wearing a sheer silk wrap that clings to her wet skin, night time, romantic lighting" },
    @{ name = "Night Out Glam"; file = "$WARDROBE_DIR\emily_4.png"; prompt = "dressed up for a night out, wearing a tight glam dress, high heels, standing by the pool at night, confident pose" }
)

Write-Host "Starting Photo Generation for Emily..." -ForegroundColor Green

foreach ($p in $prompts) {
    $type = $p
    Write-Host " [$($prompts.IndexOf($p))] Generating $($type.name)..." -ForegroundColor Cyan
    
    $extraModifiers = "masterpiece, photorealistic, 8k uhd, cinematic lighting, sharp focus, highly detailed skin texture"
    $fullPrompt = "$charName, $appearance, $($type.prompt), $extraModifiers"
    
    # Update workflow with prompt using JSON object manipulation
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
                $imgUrl = "$COMFY_URL/view?filename=$filename`&subfolder=$subfolder`&type=output"
                Invoke-WebRequest -Uri $imgUrl -OutFile $type.file
                Write-Host "    Saved to $($type.file)" -ForegroundColor Gray
            } else {
                Start-Sleep -Seconds 5
            }
        }
    } catch {
        Write-Host "    Failed ($($type.name)): $_" -ForegroundColor Red
    }
}

Write-Host "All Emily photos generated and updated via ComfyUI!" -ForegroundColor Green
