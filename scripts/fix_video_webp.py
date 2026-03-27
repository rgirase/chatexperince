import imageio
import numpy as np
from PIL import Image
import os

img_path = r'c:\Users\rgira\chatexperince\public\gallery-assets\ritu_bold_bhabhi_shower.png'
out_path = r'c:\Users\rgira\chatexperince\public\gallery-assets\ritu_bold_bhabhi_clip.webp'

if os.path.exists(img_path):
    img = Image.open(img_path).resize((512, 512))
    img_data = np.array(img)
    
    # Create 2 seconds of video at 8 fps (16 frames)
    # Using imageio to save as animated WEBP
    writer = imageio.get_writer(out_path, fps=8, duration=0.125)
    for _ in range(16):
        writer.append_data(img_data)
    writer.close()
    print(f"Successfully created {out_path}")
else:
    print(f"Image not found at {img_path}")
