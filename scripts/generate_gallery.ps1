param(
    [int]$Limit = 0,
    [switch]$Force,
    [string]$TargetId
)

# generate_gallery.ps1
# Generates 5 high-quality photos per character (Seductive, Nipples, Pussy, Anal, Sex)

$COMFY_URL = "http://127.0.0.1:8000"
$PROMPTS_FILE = "C:\Users\rgira\chatexperince\character_prompts.json"
$OUTPUT_DIR = "C:\Users\rgira\chatexperince\public\gallery"
$WORKFLOW_FILE = "C:\Users\rgira\.gemini\antigravity\brain\8604d1fc-cb0d-4397-a9ec-09a14e5bc98d\comfy_workflow_sdxl.json"

if (-not (Test-Path $OUTPUT_DIR)) { New-Item -ItemType Directory -Path $OUTPUT_DIR -Force }

$characters = Get-Content $PROMPTS_FILE | ConvertFrom-Json
$workflowTemplate = Get-Content $WORKFLOW_FILE -Raw

$photoTypes = @(
    @{ index = 1; name = "Seductive"; prompt = "seductive look, alluring gaze, posing for camera, highly detailed skin, wearing revealing clothes" },
    @{ index = 2; name = "Nipples"; prompt = "nude, topless, exposed breasts, showing nipples, focus on chest" },
    @{ index = 3; name = "Pussy"; prompt = "fully naked, spread legs, showing vulva, showing pussy, focus on crotch" },
    @{ index = 4; name = "Anal"; prompt = "nude, doggy style pose, showing anus, showing butt, arched back, rear view" },
    @{ index = 5; name = "Sex"; prompt = "nude, having sex, penetration, penis inside pussy, close up action shot, intense pleasure" }
)

Write-Host "🚀 Starting Multi-Photo Generation for $($characters.Count) characters..." -ForegroundColor Cyan

$count = 0
foreach ($char in $characters) {
    if ($TargetId -and $char.id -ne $TargetId) { continue }
    if ($Limit -gt 0 -and $count -ge $Limit) { break }

    Write-Host "--- Processing: $($char.name) ($($char.id)) ---" -ForegroundColor Cyan

    foreach ($type in $photoTypes) {
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

        # Trait Detection
        $isIndian = ($char.prompt -match "Indian|Mumbai|Delhi|Bangalore|Pune|Saree|Salwar|Kameez|Lehenga|Hinglish|Hindi|Marathi")
        $isMarried = $char.prompt -match "wife|married|matriarch|mother-in-law|bhabhi|saas|mangalsutra|wedding|bride"
        $modernKeywords = "rebellious|college|Gen Z|student|club|model|modern|wild|independent|divorce|brat"
        $isModern = ($char.prompt -match $modernKeywords)

        $extraModifiers = "masterpiece, photorealistic, 8k uhd, cinematic lighting, sharp focus"
        if ($isIndian) { $extraModifiers += ", indian ethnicity, deep cleavage" }
        if ($isMarried) { $extraModifiers += ", wearing thin gold mangalsutra necklace" }
        if ($isModern) { $extraModifiers += ", sparkling navel piercing, exposed navel" }

        # Combine
        $fullPrompt = "$($char.name), $appearance, $($type.prompt), $extraModifiers"
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
            $maxAttempts = 60
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
    $count++
}

Write-Host "⭐ All tasks completed!" -ForegroundColor Cyan
