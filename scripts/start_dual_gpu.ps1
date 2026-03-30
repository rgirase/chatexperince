# scripts/start_dual_gpu.ps1
# Use this script to start dual ComfyUI instances on GPU 0 (Port 8000) and GPU 1 (Port 8001).

$PYTHON = "C:\Users\rgira\Documents\ComfyUI\.venv\Scripts\python.exe"
$MAIN_PY = "C:\Users\rgira\AppData\Local\Programs\ComfyUI\resources\ComfyUI\main.py"
$EXTRA_CONFIG = "C:\Users\rgira\AppData\Local\Temp\extra_model_paths.yaml"
$USER_DIR = "C:\Users\rgira\Documents\ComfyUI\user"
$INPUT_DIR = "C:\Users\rgira\Documents\ComfyUI\input"
$OUTPUT_DIR = "C:\Users\rgira\Documents\ComfyUI\output"

Write-Host "Starting Dual-GPU ComfyUI Instances..." -ForegroundColor Cyan

# Kill existing processes on 8000 and 8001
$ports = 8000, 8001
foreach ($port in $ports) {
    try {
        $portProcess = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($portProcess) {
            Write-Host "Warning: Port $port is busy. Closing existing process..." -ForegroundColor Yellow
            Stop-Process -Id $portProcess.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    } catch {}
}

# Start GPU 0 on Port 8000
Write-Host "Starting GPU 0 (Port 8000)..." -ForegroundColor Green
Start-Process $PYTHON -ArgumentList "$MAIN_PY --listen 0.0.0.0 --port 8000 --enable-cors-header --cuda-device 0 --extra-model-paths-config $EXTRA_CONFIG --input-directory $INPUT_DIR --output-directory $OUTPUT_DIR --user-directory $USER_DIR --force-fp16 --fp16-vae --fp16-text-enc" -NoNewWindow

# Start GPU 1 on Port 8001
Write-Host "Starting GPU 1 (Port 8001)..." -ForegroundColor Green
Start-Process $PYTHON -ArgumentList "$MAIN_PY --listen 0.0.0.0 --port 8001 --enable-cors-header --cuda-device 1 --extra-model-paths-config $EXTRA_CONFIG --input-directory $INPUT_DIR --output-directory $OUTPUT_DIR --user-directory $USER_DIR --force-fp16 --fp16-vae --fp16-text-enc" -NoNewWindow

Write-Host "Both GPUs initialized. Waiting for servers to be ready..." -ForegroundColor Cyan
