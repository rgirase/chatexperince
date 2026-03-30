@echo off
set python_path=C:\Users\rgira\Documents\ComfyUI\.venv\Scripts\python.exe
cd /d C:\Users\rgira\AppData\Local\Programs\ComfyUI\resources\ComfyUI
%python_path% main.py --port 8000 --force-fp32 --fp32-unet --fp32-vae > c:\Users\rgira\chatexperince\comfy_debug.log 2>&1
