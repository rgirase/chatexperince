import imageio
import numpy as np
from PIL import Image
import os

img_path = r'c:\Users\rgira\chatexperince\public\gallery\ritu_bold_bhabhi_shower.png'
out_path = r'c:\Users\rgira\chatexperince\public\gallery\ritu_bold_bhabhi_clip.mp4'

if os.path.exists(img_path):
    img = Image.open(img_path).resize((512, 512))
    img_data = np.array(img)
    
    # Create 2 seconds of video at 8 fps (16 frames)
    # Using libx264 and yuv420p for maximum browser compatibility
    writer = imageio.get_writer(out_path, fps=8, codec='libx264', pixelformat='yuv420p')
    for _ in range(16):
        writer.append_data(img_data)
    writer.close()
    print(f"Successfully created {out_path} (Encoded with libx264/yuv420p)")
else:
    print(f"Image not found at {img_path}")
