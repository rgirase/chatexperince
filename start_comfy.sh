#!/bin/bash

# Configuration
COMFYUI_DIR="/home/rahul/ComfyUI"
VENV_PYTHON="${COMFYUI_DIR}/venv/bin/python"
PORT=8000
LISTEN_ADDR="0.0.0.0"

# Change to ComfyUI directory
cd "${COMFYUI_DIR}" || exit 1

# Start ComfyUI
# Using recommended flags from the project's Windows scripts
# Adapted for Linux paths
exec "${VENV_PYTHON}" main.py \
    --listen "${LISTEN_ADDR}" \
    --port "${PORT}" \
    --enable-cors-header \
    --force-fp16 \
    --fp16-vae \
    --lowvram \
    --input-directory "${COMFYUI_DIR}/input" \
    --output-directory "${COMFYUI_DIR}/output" \
    --user-directory "${COMFYUI_DIR}/user"
