#!/bin/bash

# Configuration
LMS_BIN="/home/rahul/.lmstudio/bin/lms"
PORT=1234
GPU_ID=1
LOG_FILE="/home/rahul/Documents/Aura/chatexperince/lmstudio.log"

echo "--- LM Studio Network-Ready Launcher ---"
echo "Targeting GPU: $GPU_ID"
echo "Logging to: $LOG_FILE"

# Pin to the second GPU
export CUDA_VISIBLE_DEVICES=$GPU_ID
export LMS_PASSKEY=antigravity # Attempting to force a passkey

# Stop any existing server first
$LMS_BIN server stop &> /dev/null

# Start the server and capture output
# Redirecting both stdout and stderr to a local log file
$LMS_BIN server start --port $PORT --bind 0.0.0.0 --cors > "$LOG_FILE" 2>&1 &

echo "Server starting in background. Check $LOG_FILE for initialization logs."
