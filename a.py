import json
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm import tqdm
import os

# Load the JSON data from the file
with open('public/all_wanted_objects.json', 'r') as file:
    data = json.load(file)

# List to hold artworks with images
artworks_with_images = []

# Function to check if an artwork has an image
def has_image(artwork):
    artwork_id = artwork['objectID']
    department_id = artwork['departmentId']
    response = requests.get(f'https://collectionapi.metmuseum.org/public/collection/v1/objects/{artwork_id}')
    
    if response.status_code == 200:
        artwork_data = response.json()
        # Check if primaryImage is not None and not an empty string
        if artwork_data.get('primaryImage') not in [None, ""]:
            return {'objectID': artwork_id, 'departmentId': department_id}
    return None

# Function to process a chunk of artworks
def process_chunk(start_index, end_index):
    chunk_results = []
    with ThreadPoolExecutor(max_workers=30) as executor:
        futures = {executor.submit(has_image, artwork): artwork for artwork in data[start_index:end_index]}
        
        for future in tqdm(as_completed(futures), total=len(futures), desc=f"Processing Artworks {start_index + 1} to {end_index}"):
            result = future.result()
            if result:
                chunk_results.append(result)
    
    return chunk_results

# Load existing results if the script was interrupted
if os.path.exists('public/artworks_with_images.json'):
    with open('public/artworks_with_images.json', 'r') as file:
        artworks_with_images = json.load(file)

# Load the last processed chunk index
last_processed_chunk = 0
if os.path.exists('last_processed_chunk.txt'):
    with open('last_processed_chunk.txt', 'r') as file:
        last_processed_chunk = int(file.read().strip())

# Process artworks in chunks
chunk_size = 50000
total_artworks = len(data)

for start in range(last_processed_chunk, total_artworks, chunk_size):
    end = min(start + chunk_size, total_artworks)
    print(f"Processing chunk from {start + 1} to {end}...")
    
    # Process the current chunk
    chunk_results = process_chunk(start, end)
    
    # Append the results to the main list
    artworks_with_images.extend(chunk_results)
    
    # Save the results after processing each chunk
    with open('public/artworks_with_images.json', 'w') as file:
        json.dump(artworks_with_images, file, indent=2)

    # Save the last processed chunk index
    with open('last_processed_chunk.txt', 'w') as file:
        file.write(str(end))

# Final save and summary
print(f"Total artworks processed: {total_artworks}")
print(f"Total artworks with images saved: {len(artworks_with_images)}")