@echo off
set TQDM_DISABLE=1
title ComfyUI GPU 0 (Port 8000)
"C:\Users\rgira\Documents\ComfyUI\.venv\Scripts\python.exe" "C:\Users\rgira\AppData\Local\Programs\ComfyUI\resources\ComfyUI\main.py" --listen 0.0.0.0 --port 8000 --enable-cors-header --cuda-device 0 --extra-model-paths-config "C:\Users\rgira\AppData\Local\Temp\extra_model_paths.yaml" --input-directory "C:\Users\rgira\Documents\ComfyUI\input" --output-directory "C:\Users\rgira\Documents\ComfyUI\output" --user-directory "C:\Users\rgira\Documents\ComfyUI\user" --bf16-unet --fp16-vae
