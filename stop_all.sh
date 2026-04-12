#!/bin/bash

echo "--- Stopping Services ---"

# Step 1: Kill Vite processes
echo "Stopping Vite frontend..."
pkill -9 -f "vite --host --host" || true
fuser -k 5173/tcp >/dev/null 2>&1 || true

# Step 2: Kill ComfyUI processes
echo "Stopping ComfyUI backend..."
pkill -9 -f "main.py.*--port 8000" || true
fuser -k 8000/tcp >/dev/null 2>&1 || true

echo "------------------------"
echo "All services stopped."
