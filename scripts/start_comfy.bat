@echo off
set TQDM_DISABLE=1
start "" "C:\Users\rgira\AppData\Roaming\uv\python\cpython-3.12.11-windows-x86_64-none\python.exe" "C:\Users\rgira\AppData\Local\Programs\ComfyUI\resources\ComfyUI\main.py" --listen 0.0.0.0 --port 8000 --enable-cors-header --extra-model-paths-config "C:\Users\rgira\AppData\Local\Temp\extra_model_paths.yaml" --input-directory "C:\Users\rgira\Documents\ComfyUI\input" --output-directory "C:\Users\rgira\Documents\ComfyUI\output" --user-directory "C:\Users\rgira\Documents\ComfyUI\user"
