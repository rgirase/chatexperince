# start_final.ps1
Write-Host "Starting Chat Experience Development Environment..."

$VITE_PORT = 5173
$COMFY_PORT = 8000
$LM_STUDIO_PORT = 1234

function Test-PortStatus {
    param($port)
    try {
        $conn = New-Object System.Net.Sockets.TcpClient
        $result = $conn.BeginConnect("127.0.0.1", $port, $null, $null)
        if ($result.AsyncWaitHandle.WaitOne(500)) {
            $conn.EndConnect($result)
            $conn.Close()
            return $true
        }
        return $false
    } catch {
        return $false
    }
}

# --- LAUNCH COMFYUI ---
if (-not (Test-PortStatus -port $COMFY_PORT)) {
    Write-Host "Launching ComfyUI backend..."
    if (Test-Path ".\scripts\start_comfy.bat") {
        Start-Process "cmd.exe" -ArgumentList "/c .\scripts\start_comfy.bat" -WindowStyle Hidden
    }
} else {
    Write-Host "ComfyUI OK"
}

# --- LAUNCH VITE ---
if (-not (Test-PortStatus -port $VITE_PORT)) {
    Write-Host "Launching Vite..."
    Start-Process "npm.cmd" -ArgumentList "run dev" -WindowStyle Hidden
} else {
    Write-Host "Vite OK"
}

# --- DASHBOARD ---
$attempts = 0
while ($attempts -lt 15) {
    $vStatus = if (Test-PortStatus -port $VITE_PORT) { "READY" } else { "STARTING..." }
    $cStatus = if (Test-PortStatus -port $COMFY_PORT) { "READY" } else { "STARTING..." }
    $lStatus = if (Test-PortStatus -port $LM_STUDIO_PORT) { "READY" } else { "OFFLINE" }

    Write-Host "Status: Vite: $vStatus | ComfyUI: $cStatus | LM Studio: $lStatus"
    
    if ($vStatus -eq "READY" -and $cStatus -eq "READY") {
        Write-Host "All systems are ONLINE!"
        Write-Host "Frontend: http://localhost:$VITE_PORT"
        Write-Host "ComfyUI: http://localhost:$COMFY_PORT"
        Start-Process "http://localhost:$VITE_PORT"
        break
    }
    Start-Sleep -Seconds 2
    $attempts++
}

if ($attempts -ge 15) { Write-Host "Startup timed out." }

Write-Host "Execution Success."
