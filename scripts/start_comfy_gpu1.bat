@echo off
set TQDM_DISABLE=1
title ComfyUI GPU 1 (Port 8001)
"C:\Users\rgira\AppData\Roaming\uv\python\cpython-3.12.11-windows-x86_64-none\python.exe" "C:\Users\rgira\AppData\Local\Programs\ComfyUI\resources\ComfyUI\main.py" --listen 0.0.0.0 --port 8001 --enable-cors-header --cuda-device 1 --extra-model-paths-config "C:\Users\rgira\AppData\Local\Temp\extra_model_paths.yaml" --input-directory "C:\Users\rgira\Documents\ComfyUI\input" --output-directory "C:\Users\rgira\Documents\ComfyUI\output_gpu1" --user-directory "C:\Users\rgira\Documents\ComfyUI\user_gpu1" --force-fp16
