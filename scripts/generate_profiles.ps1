param(
    [int]$Limit = 0,
    [switch]$Force,
    [string]$TargetId
)

# generate_profiles.ps1
# Overhauls profile photos with a sexy and revealing style

$COMFY_URL = "http://127.0.0.1:8000"
$PROMPTS_FILE = "C:\Users\rgira\chatexperince\character_prompts.json"
$OUTPUT_DIR = "C:\Users\rgira\chatexperince\public\assets\profiles"
$WORKFLOW_FILE = "C:\Users\rgira\.gemini\antigravity\brain\8604d1fc-cb0d-4397-a9ec-09a14e5bc98d\comfy_workflow_sdxl.json"

if (-not (Test-Path $OUTPUT_DIR)) { New-Item -ItemType Directory -Path $OUTPUT_DIR -Force }

$characters = Get-Content $PROMPTS_FILE | ConvertFrom-Json
$workflowTemplate = Get-Content $WORKFLOW_FILE -Raw

Write-Host "Starting Profile Photo Overhaul for $($characters.Count) characters..." -ForegroundColor Cyan
Write-Host "Style: Very sexy and revealing, seductive, high quality." -ForegroundColor Yellow

$count = 0
foreach ($char in $characters) {
    if ($TargetId -and $char.id -ne $TargetId) { continue }
    if ($Limit -gt 0 -and $count -ge $Limit) { break }

    $targetPath = Join-Path $OUTPUT_DIR "$($char.id)_profile.png"

    if ((Test-Path $targetPath) -and -not $Force) {
        Write-Host "[$($count+1)/$($characters.Count)] Skipping $($char.name) - Already exists." -ForegroundColor Gray
        $count++
        continue
    }

    Write-Host "[$($count+1)/$($characters.Count)] Generating sexy profile for $($char.name)..." -ForegroundColor Green

    # Extract appearance
    $appearance = ""
    if ($char.prompt -match 'APPEARANCE:\s*(.*?)(?=\n|BACKSTORY:|$)') {
        $appearance = $matches[1]
    }
    $appearance = $appearance.Replace('"', "'")

    # Enhanced Style
    $sexyStyle = 'wearing very revealing sexy clothing, extreme deep cleavage, seductive pose, naughty look, looking at viewer, highly detailed gorgeous face, photorealistic, 8k uhd, cinematic lighting, sharp focus'
    
    # Trait Detection
    $isIndian = $char.prompt.Contains('Indian') -or $char.prompt.Contains('Mumbai') -or $char.prompt.Contains('Saree')
    if ($isIndian) { 
        $sexyStyle = $sexyStyle + ', indian ethnicity, beautiful indian features'
    }

    $fullPrompt = $char.name + ', ' + $appearance + ', ' + $sexyStyle
    $fullPrompt = $fullPrompt.Replace('"', '')

    # Prepare workflow
    $currentWorkflow = $workflowTemplate.Replace('__PROMPT__', $fullPrompt)
    $body = @{ prompt = ($currentWorkflow | ConvertFrom-Json) } | ConvertTo-Json -Depth 20

    # Queue Prompt
    try {
        $res = Invoke-RestMethod -Method Post -Uri "$COMFY_URL/prompt" -Body $body -ContentType 'application/json'
        $promptId = $res.prompt_id
        
        $completed = $false
        $attempts = 0
        $maxAttempts = 60
        while (-not $completed -and $attempts -lt $maxAttempts) {
            Start-Sleep -Seconds 3
            $attempts++
            try {
                $history = Invoke-RestMethod -Method Get -Uri "$COMFY_URL/history/$promptId"
                if ($history.$promptId -and $history.$promptId.outputs) {
                    $outputs = $history.$promptId.outputs
                    foreach ($nodeId in $outputs.PSObject.Properties.Name) {
                        if ($nodeId -eq '9') {
                            $completed = $true
                            $img = $outputs.$nodeId.images[0]
                            $viewUrl = "$COMFY_URL/view?filename=$($img.filename)&subfolder=$($img.subfolder)&type=$($img.type)"
                            Invoke-WebRequest -Uri $viewUrl -OutFile $targetPath
                            Write-Host "    Saved: $($char.id)_profile.png" -ForegroundColor Green
                        }
                    }
                }
            } catch { }
        }
        if (-not $completed) { Write-Host "    Timeout for $($char.name)" -ForegroundColor Red }
    } catch {
        Write-Host "    Failed $($char.name): $($_.Exception.Message)" -ForegroundColor Red
    }
    $count++
}

Write-Host 'Profile generation complete!' -ForegroundColor Cyan
