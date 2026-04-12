#!/bin/bash

# Configuration
PROJECT_DIR="/home/rahul/Documents/Aura/chatexperince"
COMFY_SCRIPT="./start_comfy.sh"
VITE_LOG="vite.log"
COMFY_LOG="comfyui.log"

# Function to check if a port is in use
check_port() {
  local port=$1
  if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
    return 0 # Port is in use
  else
    return 1 # Port is free
  fi
}

echo "--- Starting Services ---"

# Step 1: Check Ports
if check_port 8000; then
  echo "[WARNING] Port 8000 (ComfyUI) is already in use. Attempting to start anyway..."
fi
if check_port 5173; then
  echo "[WARNING] Port 5173 (Vite) is already in use. Attempting to start anyway..."
fi

# Step 2: Start ComfyUI
echo "[1/2] Launching ComfyUI backend..."
$COMFY_SCRIPT > "$COMFY_LOG" 2>&1 &
COMFY_PID=$!
echo "      ComfyUI PID: $COMFY_PID (Logs: $COMFY_LOG)"

# Step 3: Start Vite Frontend
echo "[2/2] Launching Chat Experience frontend..."
npm run dev -- --host > "$VITE_LOG" 2>&1 &
VITE_PID=$!
echo "      Vite PID: $VITE_PID (Logs: $VITE_LOG)"

echo "------------------------"
echo "Services are starting!"
echo "- Frontend: http://localhost:5173"
echo "- Backend:  http://localhost:8000"
echo ""
echo "To stop all services, run: ./stop_all.sh"
echo "To watch logs, run: tail -f $VITE_LOG $COMFY_LOG"
