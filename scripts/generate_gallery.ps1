param(
    [int]$Limit = 0,
    [switch]$Force,
    [string]$TargetId
)

# generate_gallery.ps1
# This script generates high-quality character portraits for all personas in character_prompts.json

$COMFY_URL = "http://127.0.0.1:8000"
$PROMPTS_FILE = "C:\Users\rgira\chatexperince\character_prompts.json"
$OUTPUT_DIR = "C:\Users\rgira\chatexperince\public\gallery"
$WORKFLOW_FILE = "C:\Users\rgira\.gemini\antigravity\brain\8604d1fc-cb0d-4397-a9ec-09a14e5bc98d\comfy_workflow_sdxl.json"

if (-not (Test-Path $OUTPUT_DIR)) { New-Item -ItemType Directory -Path $OUTPUT_DIR -Force }

$characters = Get-Content $PROMPTS_FILE | ConvertFrom-Json
$workflowTemplate = Get-Content $WORKFLOW_FILE -Raw

$count = 0
Write-Host "🚀 Starting Bulk Generation for $($characters.Count) characters..." -ForegroundColor Cyan

foreach ($char in $characters) {
    if ($TargetId -and $char.id -ne $TargetId) { continue }
    if ($Limit -gt 0 -and $count -ge $Limit) { break }
    
    $charName = $char.name -replace '[^a-zA-Z0-9]', '_'
    $targetPath = Join-Path $OUTPUT_DIR "$($char.id).png"

    if ((Test-Path $targetPath) -and -not $Force) {
        Write-Host "⏭️ Skipping $($char.name) - Already exists." -ForegroundColor Yellow
        $count++
        continue
    }

    # Extract appearance or use a generic fallback
    $appearance = ""
    if ($char.prompt -match 'APPEARANCE:\s*(.*?)(?=\n|BACKSTORY:|$)') {
        $appearance = $matches[1]
    } else {
        $appearance = "Portrait of $($char.name)"
    }
    
    # Sanitize appearance (remove potential JSON-breaking characters or non-ASCII)
    $appearance = $appearance -replace '[^\x00-\x7F]', '-' -replace '"', "'"

    # Enhanced seductive and seductive styling
    $seductiveModifiers = "seductive, sensuous, alluring gaze, provocative pose, highly detailed skin, soft cinematic lighting, masterpiece, photorealistic, 8k uhd, cinematic film grain, sharp focus, masterpiece quality"
    
    # New logic to detect Indian and Married traits
    $isIndian = ($char.prompt -match "Indian|Mumbai|Delhi|Bangalore|Pune|Saree|Salwar|Kameez|Lehenga|Hinglish|Hindi|Marathi") -or ($char.name -match "Priya|Ananya|Aisha|Naina|Kavya|Meera|Riya|Tara|Sharma|Mehek|Neha|Divya|Roshni|Simran|Kapoor|Gauri|Seema|Sneha|Ritu|Ishani|Aditi|Maya|Sujata|Sushma")
    $isMarried = $char.prompt -match "wife|married|matriarch|mother-in-law|bhabhi|saas|mangalsutra|wedding|bride"
    
    # Logic to detect Modern/Rebellious characters for piercings
    $modernKeywords = "rebellious|college|Gen Z|student|club|model|modern|wild|independent|divorce|brat"
    $modernIds = @("indian_college_gf", "arranged_match", "south_delhi_nri", "divorced_wife", "strict_auntie_daughter", "long_distance_gf", "friends_bold_wife")
    $isModern = ($char.prompt -match $modernKeywords) -or ($char.id -in $modernIds)

    $extraModifiers = "extremely revealing, showing most of cleavage, deep cleavage, full body shot, thigh up shot, standing, showing midriff, showing stomach, showing navel"
    if ($isIndian) {
        $extraModifiers += ", low cut v-neck deep cleavage blouse, thin strip blouse, showing deep cleavage"
    }
    if ($isMarried) {
        $extraModifiers += ", wearing thin cute gold mangalsutra necklace"
    }
    if ($isModern) {
        $extraModifiers += ", sparkling navel piercing, diamond belly button ring, exposed navel"
    }

    $fullPrompt = "$appearance, $seductiveModifiers, $extraModifiers"
    Write-Host "🎨 Generating $($char.name)..." -ForegroundColor Green
    
    # Prepare workflow
    $currentWorkflow = $workflowTemplate.Replace("__PROMPT__", $fullPrompt)
    $body = @{ prompt = ($currentWorkflow | ConvertFrom-Json) } | ConvertTo-Json -Depth 20

    # Queue Prompt
    try {
        $res = Invoke-RestMethod -Method Post -Uri "$COMFY_URL/prompt" -Body $body -ContentType "application/json"
        $promptId = $res.prompt_id
        
        Write-Host "⏳ Waiting for generation (ID: $promptId)..."
        
        # Poll for completion
        $completed = $false
        $attempts = 0
        $maxAttempts = 60 # 5 minutes max per image
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
                        
                        # Download
                        Invoke-WebRequest -Uri $viewUrl -OutFile $targetPath
                        Write-Host "✅ Saved to $targetPath" -ForegroundColor Green
                        $count++
                    }
                }
            } catch {
                Write-Host "⚠️ Polling warning: $($_.Exception.Message)"
            }
        }
        if (-not $completed) {
            Write-Host "❌ Generation timed out or failed for $($char.name)" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Failed generating $($char.name): $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "⭐ All tasks completed!" -ForegroundColor Cyan
