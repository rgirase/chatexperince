import json
import re
import os

def update_personas():
    results_path = 'scripts/gallery_results.json'
    personas_path = 'src/data/personas.js'
    
    if not os.path.exists(results_path):
        print(f"Results file {results_path} not found yet.")
        return

    with open(results_path, 'r') as f:
        gallery_results = json.load(f)

    with open(personas_path, 'r') as f:
        content = f.read()

    for char_id, new_images in gallery_results.items():
        # Find the character object block
        # This regex looks for an object with a specific id
        pattern = rf'(id:\s*"{char_id}",.*?)(\n\s*\]|\n\s*\}})'
        
        # We need a more robust way to find the specific character object and update its properties
        # Searching for the block starting with id: "char_id"
        char_pattern = re.compile(rf'({{\s*id:\s*"{char_id}"(.*?)\s*}})', re.DOTALL)
        match = char_pattern.search(content)
        
        if match:
            char_block = match.group(1)
            original_block = char_block
            
            # Update image field - DISABLED per user request
            # image_match = re.search(r'image:\s*"(.*?)"', char_block)
            # if image_match and new_images:
            #     char_block = char_block.replace(image_match.group(0), f'image: "{new_images[0]}"')
            
            # Update gallery array
            gallery_match = re.search(r'gallery:\s*\[(.*?)\]', char_block, re.DOTALL)
            if gallery_match:
                existing_gallery_str = gallery_match.group(1).strip()
                # Clean up existing gallery into a list of strings
                existing_images = [img.strip().strip('"').strip("'") for img in existing_gallery_str.split(',') if img.strip()]
                
                # Filter out those already in new_images if they exist (to avoid duplicates)
                filtered_existing = [img for img in existing_images if img not in new_images]
                
                # Combine: New images first, then existing ones
                all_images = new_images + filtered_existing
                new_gallery_str = ",\n      ".join([f'"{img}"' for img in all_images])
                char_block = char_block.replace(gallery_match.group(0), f'gallery: [\n      {new_gallery_str}\n    ]')
            else:
                # If gallery doesn't exist, add it
                new_gallery_str = ",\n      ".join([f'"{img}"' for img in new_images])
                char_block = char_block.replace(f'id: "{char_id}",', f'id: "{char_id}",\n    gallery: [\n      {new_gallery_str}\n    ],')

            content = content.replace(original_block, char_block)

    with open(personas_path, 'w') as f:
        f.write(content)
    
    print("Successfully updated personas.js with new gallery images.")

if __name__ == "__main__":
    update_personas()
