# scripts/generate_character_updates.ps1

$COMFY_URL = "http://127.0.0.1:8000"
$WORKFLOW_FILE = "C:\Users\rgira\.gemini\antigravity\brain\8604d1fc-cb0d-4397-a9ec-09a14e5bc98d\comfy_workflow_sdxl.json"
$PROFILE_DIR = "C:\Users\rgira\chatexperince\public\assets\profiles"
$GALLERY_DIR = "C:\Users\rgira\chatexperince\public\gallery"

if (-not (Test-Path $PROFILE_DIR)) { New-Item -ItemType Directory -Path $PROFILE_DIR -Force }
if (-not (Test-Path $GALLERY_DIR)) { New-Item -ItemType Directory -Path $GALLERY_DIR -Force }

$workflowTemplate = Get-Content $WORKFLOW_FILE -Raw

$tasks = @(
    # PRIYA
    @{ id = "indian_wife"; type = "profile"; path = "$PROFILE_DIR\indian_wife_profile.png"; prompt = "Priya (Indian Wife), 38 year old stunning indian woman, traditional silk saree, soft voluptuous figure, elegant, looking at camera, cinematic lighting, masterpiece, photorealistic, 8k" },
    @{ id = "indian_wife"; type = "gallery"; path = "$GALLERY_DIR\indian_wife_1.png"; prompt = "Priya (Indian Wife), traditional silk saree, doting wife pose, kitchen setting, beautiful indian home, masterpiece" },
    @{ id = "indian_wife"; type = "gallery"; path = "$GALLERY_DIR\indian_wife_2.png"; prompt = "Priya (Indian Wife), ultra-sheer provocative designer saree, deep cleavage, mischievous look, indoor setting, masterpiece" },
    @{ id = "indian_wife"; type = "gallery"; path = "$GALLERY_DIR\indian_wife_3.png"; prompt = "Priya (Indian Wife), naughty lace lingerie set, bedroom setting, high-intensity desire, masterpiece" },
    @{ id = "indian_wife"; type = "gallery"; path = "$GALLERY_DIR\indian_wife_4.png"; prompt = "Priya (Indian Wife), revealing edgy clothing, showcasing secret tattoos on hips and navel piercing, dark moody lighting, alt identity, masterpiece" },
    @{ id = "indian_wife"; type = "gallery"; path = "$GALLERY_DIR\indian_wife_5.png"; prompt = "Priya (Indian Wife), fully naked, secret tattoos and piercings prominent, extreme passion, looking at camera, masterpiece, uncensored" },
    
    # KIARA
    @{ id = "kiara"; type = "profile"; path = "$PROFILE_DIR\kiara_profile.png"; prompt = "Kiara (College GF), 20 year old petite indian woman, engineering student, messy bun, white tank top, oversized flannel, intense focus, masterpiece, 8k" },
    @{ id = "kiara"; type = "gallery"; path = "$GALLERY_DIR\kiara_1.png"; prompt = "Kiara (College GF), engineering lab setting, circuit boards, messy chic, hyper-focused look, masterpiece" },
    @{ id = "kiara"; type = "gallery"; path = "$GALLERY_DIR\kiara_2.png"; prompt = "Kiara (College GF), silk slip dress, messy hair, yearning expression, physical focus, masterpiece" },
    @{ id = "kiara"; type = "gallery"; path = "$GALLERY_DIR\kiara_3.png"; prompt = "Kiara (College GF), revealing tech-inspired lingerie, bedroom setting, hyper-sensitive look, masterpiece" },
    @{ id = "kiara"; type = "gallery"; path = "$GALLERY_DIR\kiara_4.png"; prompt = "Kiara (College GF), short seductive shorts and tiny tank top, pinning viewer, desperate for touch, intense physical expression, masterpiece" },
    @{ id = "kiara"; type = "gallery"; path = "$GALLERY_DIR\kiara_5.png"; prompt = "Kiara (College GF), fully naked, petite fit body, extreme physical release, desperate passion, masterpiece, uncensored" },
    
    # ANANYA
    @{ id = "ananya_nri_cousin"; type = "profile"; path = "$PROFILE_DIR\ananya_nri_cousin_profile.png"; prompt = "Ananya (NRI Cousin), 24 year old stunning NRI woman from London, high-fashion beauty, toned perfect figure, designer clothes, arrogant look, masterpiece, 8k" },
    @{ id = "ananya_nri_cousin"; type = "gallery"; path = "$GALLERY_DIR\ananya_nri_cousin_1.png"; prompt = "Ananya (NRI Cousin), sheer designer nightie, leaning against doorframe, jet-lagged look, seductive wanderer, midnight bedroom setting, masterpiece" },
    @{ id = "ananya_nri_cousin"; type = "gallery"; path = "$GALLERY_DIR\ananya_nri_cousin_2.png"; prompt = "Ananya (NRI Cousin), expensive London lace lingerie, hotel room setting, sophisticated seduction, masterpiece" },
    @{ id = "ananya_nri_cousin"; type = "gallery"; path = "$GALLERY_DIR\ananya_nri_cousin_3.png"; prompt = "Ananya (NRI Cousin), silk hotel robe slipping off shoulder, holding glass of wine, mocking yet sensual tone, masterpiece" },
    @{ id = "ananya_nri_cousin"; type = "gallery"; path = "$GALLERY_DIR\ananya_nri_cousin_4.png"; prompt = "Ananya (NRI Cousin), boutique luxury bikini, hotel pool at night, sun-kissed skin, dripping wet, masterpiece" },
    @{ id = "ananya_nri_cousin"; type = "gallery"; path = "$GALLERY_DIR\ananya_nri_cousin_5.png"; prompt = "Ananya (NRI Cousin), fully naked, high-society elegance in raw passion, forbidden affair, extreme intensity, masterpiece, uncensored" }
)

Write-Host "🎨 Starting Image Generation for 3 Character Updates..." -ForegroundColor Cyan

foreach ($task in $tasks) {
    Write-Host "Generating: $($task.path)" -ForegroundColor Green
    
    $currentWorkflow = $workflowTemplate.Replace("__PROMPT__", $task.prompt)
    $body = @{ prompt = ($currentWorkflow | ConvertFrom-Json) } | ConvertTo-Json -Depth 20

    try {
        $res = Invoke-RestMethod -Method Post -Uri "$COMFY_URL/prompt" -Body $body -ContentType "application/json"
        $promptId = $res.prompt_id
        
        $completed = $false
        $attempts = 0
        while (-not $completed -and $attempts -lt 120) {
            Start-Sleep -Seconds 5
            $attempts++
            try {
                $history = Invoke-RestMethod -Method Get -Uri "$COMFY_URL/history/$promptId"
                if ($history.$promptId -and $history.$promptId.outputs) {
                    $outputs = $history.$promptId.outputs
                    foreach ($nodeId in $outputs.PSObject.Properties.Name) {
                        if ($outputs.$nodeId.images) {
                            $completed = $true
                            $img = $outputs.$nodeId.images[0]
                            $viewUrl = "$COMFY_URL/view?filename=$($img.filename)&subfolder=$($img.subfolder)&type=$($img.type)"
                            Invoke-WebRequest -Uri $viewUrl -OutFile $task.path
                            Write-Host "  ✅ Saved!" -ForegroundColor Green
                            break
                        }
                    }
                }
            } catch { }
        }
    } catch {
        Write-Host "  ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "✨ All images generated successfully!" -ForegroundColor Cyan
