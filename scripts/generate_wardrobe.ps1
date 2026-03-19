param(
    [int]$Limit = 0,
    [switch]$Force,
    [string]$TargetId
)

# generate_wardrobe.ps1
# Generates a diverse wardrobe (Seductive, Sexy Outfits, and Naked variations) per character

$COMFY_URL = "http://127.0.0.1:1234/v1" # Adjusted for user's LM Studio port or ComfyUI port? 
# Wait, generate_gallery used 8000. Let's stick to 8000 for ComfyUI.
$COMFY_URL = "http://127.0.0.1:8000"
$PROMPTS_FILE = "C:\Users\rgira\chatexperince\character_prompts.json"
$OUTPUT_DIR = "C:\Users\rgira\chatexperince\public\gallery\wardrobe"
$WORKFLOW_FILE = "C:\Users\rgira\.gemini\antigravity\brain\8604d1fc-cb0d-4397-a9ec-09a14e5bc98d\comfy_workflow_sdxl.json"

if (-not (Test-Path $OUTPUT_DIR)) { New-Item -ItemType Directory -Path $OUTPUT_DIR -Force }

$characters = Get-Content $PROMPTS_FILE | ConvertFrom-Json
$workflowTemplate = Get-Content $WORKFLOW_FILE -Raw

$wardrobeTypes = @(
    @{ index = 0; name = "Default"; prompt = "wearing clothes as described, in-character outfit, high quality" },
    @{ index = 1; name = "Lingerie"; prompt = "sexy lace lingerie, seductive pose, indoor bedroom setting, highly detailed skin" },
    @{ index = 2; name = "SexyOutfit"; prompt = "short seductive dress, revealing outfit, alluring gaze, posing for camera" },
    @{ index = 3; name = "Naked"; prompt = "fully naked, nude, uncensored, explicit lewd, beautiful body, highly detailed skin" },
    @{ index = 4; name = "Bikini"; prompt = "sexy bikini, beach setting, sun-kissed skin, wet hair" }
)

Write-Host "🚀 Starting Wardrobe Generation for $($characters.Count) characters..." -ForegroundColor Cyan

$count = 0
foreach ($char in $characters) {
    if ($TargetId -and $char.id -ne $TargetId) { continue }
    if ($Limit -gt 0 -and $count -ge $Limit) { break }

    Write-Host "--- Wardrobe: $($char.name) ($($char.id)) ---" -ForegroundColor Cyan

    foreach ($type in $wardrobeTypes) {
        $targetPath = Join-Path $OUTPUT_DIR "$($char.id)_$($type.index).png"

        if ((Test-Path $targetPath) -and -not $Force) {
            Write-Host " [$(($type.index))] Skipping - Already exists." -ForegroundColor Yellow
            continue
        }

        Write-Host " [$(($type.index))] Generating $($type.name)..." -ForegroundColor Green

        # Extract appearance
        $appearance = ""
        if ($char.prompt -match 'APPEARANCE:\s*(.*?)(?=\n|BACKSTORY:|$)') {
            $appearance = $matches[1]
        }
        $appearance = $appearance -replace '[^\x00-\x7F]', '-' -replace '"', "'"

        # Trait Detection for smarter prompting
        $isIndian = ($char.prompt -match "Indian|Mumbai|Delhi|Bangalore|Pune|Saree|Salwar|Kameez|Lehenga|Hinglish|Hindi|Marathi")
        $isMarried = $char.prompt -match "wife|married|matriarch|mother-in-law|bhabhi|saas|mangalsutra|wedding|bride"
        $modernKeywords = "rebellious|college|Gen Z|student|club|model|modern|wild|independent|divorce|brat"
        $isModern = ($char.prompt -match $modernKeywords)

        $extraModifiers = "masterpiece, photorealistic, 8k uhd, cinematic lighting, sharp focus"
        
        # Apply character traits to ALL wardrobe types
        if ($isIndian) { 
            $extraModifiers += ", indian ethnicity, long dark hair" 
            if ($type.name -eq "Default") {
                # Saree/Salwar context for Indian characters in default look
            }
        }
        
        if ($isMarried) { 
            $extraModifiers += ", wearing thin gold mangalsutra necklace" 
        }
        
        if ($isModern) { 
            $extraModifiers += ", sparkling navel piercing, exposed navel" 
        }

        # Combine
        $fullPrompt = "$($char.name), $($appearance), $($type.prompt), $($extraModifiers)"
        $fullPrompt = $fullPrompt -replace '"', ""

        # Prepare workflow
        $currentWorkflow = $workflowTemplate.Replace("__PROMPT__", $fullPrompt)
        $body = @{ prompt = ($currentWorkflow | ConvertFrom-Json) } | ConvertTo-Json -Depth 20

        # Queue Prompt
        try {
            $res = Invoke-RestMethod -Method Post -Uri "$COMFY_URL/prompt" -Body $body -ContentType "application/json"
            $promptId = $res.prompt_id
            
            $completed = $false
            $attempts = 0
            $maxAttempts = 120 # 10 minutes total
            while (-not $completed -and $attempts -lt $maxAttempts) {
                Start-Sleep -Seconds 5
                $attempts++
                try {
                    $history = Invoke-RestMethod -Method Get -Uri "$COMFY_URL/history/$promptId"
                    if ($history.$promptId -and $history.$promptId.outputs) {
                        $outputs = $history.$promptId.outputs
                        # Check for node 9 (as per config.js) or any image output
                        foreach ($nodeId in $outputs.PSObject.Properties.Name) {
                            if ($outputs.$nodeId.images) {
                                $completed = $true
                                $img = $outputs.$nodeId.images[0]
                                $viewUrl = "$COMFY_URL/view?filename=$($img.filename)&subfolder=$($img.subfolder)&type=$($img.type)"
                                Invoke-WebRequest -Uri $viewUrl -OutFile $targetPath
                                Write-Host "    ✅ Saved to $($targetPath)" -ForegroundColor Green
                                break
                            }
                        }
                    }
                } catch { }
            }
            if (-not $completed) { Write-Host "    ❌ Timeout ($($attempts) attempts)" -ForegroundColor Red }
        } catch {
            Write-Host "    ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    $count++
}

Write-Host "⭐ Wardrobe task completed!" -ForegroundColor Cyan
