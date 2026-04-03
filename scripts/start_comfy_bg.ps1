# start_comfy_bg.ps1
# Starts ComfyUI in the background and logs to comfyui.log

$PYTHON = "C:\Users\rgira\Documents\ComfyUI\.venv\Scripts\python.exe"
$MAIN_PY = "C:\Users\rgira\AppData\Local\Programs\ComfyUI\resources\ComfyUI\main.py"
$EXTRA_CONFIG = "C:\Users\rgira\AppData\Local\Temp\extra_model_paths.yaml"
$USER_DIR = "C:\Users\rgira\Documents\ComfyUI\user"
$INPUT_DIR = "C:\Users\rgira\Documents\ComfyUI\input"
$OUTPUT_DIR = "C:\Users\rgira\Documents\ComfyUI\output"
$LOG_FILE = "C:\Users\rgira\chatexperince\comfyui.log"

Write-Host "🚀 Checking for existing ComfyUI process..." -ForegroundColor Cyan

# Kill existing process on 8000
$portProcess = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue 
if ($portProcess) {
    Write-Host "⚠️ Port 8000 is busy. Closing existing ComfyUI (PID: $($portProcess.OwningProcess[0]))..." -ForegroundColor Yellow
    Stop-Process -Id $portProcess.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

Write-Host "🚀 Starting ComfyUI in background..." -ForegroundColor Cyan
# Start process in background
Start-Process -FilePath $PYTHON -ArgumentList "$MAIN_PY --listen 0.0.0.0 --port 8000 --enable-cors-header --force-fp16 --fp16-vae --fp16-text-enc --extra-model-paths-config $EXTRA_CONFIG --input-directory $INPUT_DIR --output-directory $OUTPUT_DIR --user-directory $USER_DIR" -RedirectStandardOutput $LOG_FILE -RedirectStandardError "C:\Users\rgira\chatexperince\comfy_error.log" -NoNewWindow

Write-Host "⏳ Waiting for ComfyUI to initialize (checking port 8000)..." -ForegroundColor Cyan
$timeout = 30 # seconds
$elapsed = 0
while ($elapsed -lt $timeout) {
    if (Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue) {
        Write-Host "✅ ComfyUI is up and running!" -ForegroundColor Green
        return
    }
    Start-Sleep -Seconds 2
    $elapsed += 2
}

Write-Warning "❌ ComfyUI failed to start within $timeout seconds. Check $LOG_FILE for details."
