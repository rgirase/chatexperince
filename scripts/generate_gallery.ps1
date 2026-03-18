param(
    [int]$Limit = 0
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
    if ($Limit -gt 0 -and $count -ge $Limit) { break }
    
    $charName = $char.name -replace '[^a-zA-Z0-9]', '_'
    $targetPath = Join-Path $OUTPUT_DIR "$($char.id).png"

    if (Test-Path $targetPath) {
        Write-Host "⏭️ Skipping $($char.name) - Already exists." -ForegroundColor Yellow
        $count++
        continue
    }

    # Extract appearance or use a generic fallback
    $appearance = ""
    if ($char.prompt -match 'APPEARANCE:\s*(.*?)(?=\n|BACKSTORY:|$)') {
        $appearance = $matches[1]
    } else {
        $appearance = "Portrait of $($char.name), photorealistic, cinematic"
    }

    $fullPrompt = "$appearance, masterpiece, best quality, highly photorealistic, 8k uhd, cinematic lighting"
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
        while (-not $completed) {
            Start-Sleep -Seconds 5
            $history = Invoke-RestMethod -Method Get -Uri "$COMFY_URL/history/$promptId"
            if ($history.$promptId) {
                $completed = $true
                $img = $history.$promptId.outputs.'9'.images[0]
                $viewUrl = "$COMFY_URL/view?filename=$($img.filename)&subfolder=$($img.subfolder)&type=$($img.type)"
                
                # Download
                Invoke-WebRequest -Uri $viewUrl -OutFile $targetPath
                Write-Host "✅ Saved to $targetPath" -ForegroundColor Green
                $count++
            }
        }
    } catch {
        Write-Host "❌ Failed generating $($char.name): $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "⭐ All tasks completed!" -ForegroundColor Cyan
