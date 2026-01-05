#!/usr/bin/env python3
"""
Met Museum Data Fetcher
Fetches artwork data from the Metropolitan Museum of Art Collection API
and downloads images for the Art Map application.
"""

import os
import csv
import json
import time
import logging
import requests
from pathlib import Path
from PIL import Image
from io import BytesIO

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
MET_API_BASE = "https://collectionapi.metmuseum.org/public/collection/v1/objects"
MET_CSV_PATH = "data/met.csv"
OUTPUT_CSV_PATH = "data/met_metadata.csv"
JSON_DIR = "data/met_json"
IMAGES_BASE_DIR = "images"
REQUEST_DELAY = 0.1  # 100ms delay between requests (well below 80 req/sec limit)
MAX_IMAGE_SIZE = 1200  # Max dimension in pixels
JPEG_QUALITY = 85

def ensure_directories():
    """Create necessary directories if they don't exist"""
    Path(JSON_DIR).mkdir(parents=True, exist_ok=True)
    print(f"✓ Created/verified directory: {JSON_DIR}")

def fetch_object_data(object_id):
    """
    Fetch object data from Met Museum API
    Returns: (success, data_dict or error_message)
    """
    url = f"{MET_API_BASE}/{object_id}"
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            return True, response.json()
        elif response.status_code == 404:
            return False, f"Object {object_id} not found (404)"
        else:
            return False, f"HTTP {response.status_code}"
    except requests.exceptions.RequestException as e:
        return False, f"Request error: {str(e)}"

def download_and_process_image(image_url, output_path):
    """
    Download image from URL and process it (resize if needed, convert to JPEG)
    Ensures final image is under 1MB and dimensions are under 1200px
    Returns: (success, error_message)
    """
    try:
        # Download image
        response = requests.get(image_url, timeout=30)
        if response.status_code != 200:
            return False, f"Failed to download (HTTP {response.status_code})"

        # Open image with PIL
        img = Image.open(BytesIO(response.content))

        # Convert RGBA to RGB if needed
        if img.mode == 'RGBA':
            # Create white background
            background = Image.new('RGB', img.size, (255, 255, 255))
            background.paste(img, mask=img.split()[3])  # Use alpha channel as mask
            img = background
        elif img.mode != 'RGB':
            img = img.convert('RGB')

        # Resize if dimensions too large
        width, height = img.size
        if width > MAX_IMAGE_SIZE or height > MAX_IMAGE_SIZE:
            # Calculate new dimensions maintaining aspect ratio
            if width > height:
                new_width = MAX_IMAGE_SIZE
                new_height = int(height * (MAX_IMAGE_SIZE / width))
            else:
                new_height = MAX_IMAGE_SIZE
                new_width = int(width * (MAX_IMAGE_SIZE / height))

            img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            print(f"    Resized from {width}x{height} to {new_width}x{new_height}")

        # Save as JPEG with quality check
        img.save(output_path, 'JPEG', quality=JPEG_QUALITY, optimize=True)

        # Check file size and reduce quality if over 1MB
        file_size = os.path.getsize(output_path)
        if file_size > 1024 * 1024:  # 1MB
            print(f"    File size {file_size / 1024 / 1024:.2f}MB, reducing quality...")
            quality = JPEG_QUALITY
            while file_size > 1024 * 1024 and quality > 50:
                quality -= 5
                img.save(output_path, 'JPEG', quality=quality, optimize=True)
                file_size = os.path.getsize(output_path)
            print(f"    Reduced to {file_size / 1024 / 1024:.2f}MB (quality={quality})")

        return True, None

    except Exception as e:
        return False, f"Processing error: {str(e)}"

def process_met_data():
    """
    Main function to process Met Museum data:
    1. Read met.csv
    2. Fetch data from API for each object_id
    3. Download images
    4. Generate met_metadata.csv
    """
    ensure_directories()

    # Read met.csv
    print(f"\n📖 Reading {MET_CSV_PATH}...")
    met_entries = []
    nudity_map = {}  # Map object_id to nudity value
    with open(MET_CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Extract object_id from source_link URL
            source_link = row.get('source_link', '').strip()
            nudity_value = row.get('Nudity', '').strip()
            if source_link and '/search/' in source_link:
                # Extract numeric ID from URL like: https://www.metmuseum.org/art/collection/search/316173
                try:
                    object_id = source_link.rstrip('/').split('/')[-1]
                    if object_id.isdigit():
                        met_entries.append({
                            'iso3': row.get('iso3', '').strip(),
                            'country': row.get('country', '').strip(),
                            'object_id': object_id,
                            'accession_number': row.get('Object_id', '').strip()
                        })
                        # Store nudity value for this object_id
                        if nudity_value:
                            nudity_map[object_id] = nudity_value
                except (ValueError, TypeError) as e:
                    logger.warning(f"Invalid object ID format in row: {row.get('Object_id', 'N/A')}, error: {e}")
                    continue

    print(f"✓ Found {len(met_entries)} entries with object IDs")
    print(f"✓ Found {len(nudity_map)} entries with nudity data")

    if len(met_entries) == 0:
        print("⚠️  No entries with object IDs found in met.csv")
        return

    # Process each entry
    results = []
    successful = 0
    failed = 0

    print(f"\n🔄 Processing {len(met_entries)} Met Museum objects...\n")

    for idx, entry in enumerate(met_entries, 1):
        object_id = entry['object_id']
        iso3 = entry['iso3']
        country = entry['country']

        print(f"[{idx}/{len(met_entries)}] Processing {country} ({iso3}) - Object ID: {object_id}")

        # Fetch object data from API
        success, data = fetch_object_data(object_id)

        if not success:
            print(f"  ✗ Failed to fetch data: {data}")
            failed += 1
            time.sleep(REQUEST_DELAY)
            continue

        # Save JSON response
        json_filename = f"{object_id}.json"
        json_path = os.path.join(JSON_DIR, json_filename)
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"  ✓ Saved JSON: {json_path}")

        # Check if image is available
        primary_image = data.get('primaryImage', '').strip()
        if not primary_image:
            print(f"  ⚠️  No primary image available, skipping download")
            # Still save metadata without image
            results.append({
                'object_id': object_id,
                'iso3': iso3,
                'country_name': country,
                'title': data.get('title', ''),
                'artist_name': data.get('artistDisplayName', ''),
                'object_date': data.get('objectDate', ''),
                'medium': data.get('medium', ''),
                'department': data.get('department', ''),
                'culture': data.get('culture', ''),
                'nudity': nudity_map.get(object_id, ''),
                'object_url': data.get('objectURL', ''),
                'primary_image_url': primary_image,
                'filepath': '',
                'json_file': json_path
            })
            failed += 1
            time.sleep(REQUEST_DELAY)
            continue

        # Prepare image directory
        image_dir = os.path.join(IMAGES_BASE_DIR, iso3, 'met')
        Path(image_dir).mkdir(parents=True, exist_ok=True)

        # Determine image filename
        image_filename = f"{object_id}.jpg"
        image_path = os.path.join(image_dir, image_filename)

        # Download image if it doesn't exist
        if os.path.exists(image_path):
            print(f"  ✓ Image already exists: {image_path}")
        else:
            print(f"  ⬇️  Downloading image...")
            success, error = download_and_process_image(primary_image, image_path)
            if success:
                print(f"  ✓ Saved image: {image_path}")
            else:
                print(f"  ✗ Failed to download image: {error}")
                failed += 1
                time.sleep(REQUEST_DELAY)
                continue

        # Add to results
        results.append({
            'object_id': object_id,
            'iso3': iso3,
            'country_name': country,
            'title': data.get('title', ''),
            'artist_name': data.get('artistDisplayName', ''),
            'object_date': data.get('objectDate', ''),
            'medium': data.get('medium', ''),
            'department': data.get('department', ''),
            'culture': data.get('culture', ''),
            'nudity': nudity_map.get(object_id, ''),
            'object_url': data.get('objectURL', ''),
            'primary_image_url': primary_image,
            'filepath': image_path,
            'json_file': json_path
        })

        successful += 1
        print(f"  ✓ Successfully processed {country} ({iso3})\n")

        # Rate limiting delay
        time.sleep(REQUEST_DELAY)

    # Write met_metadata.csv
    if results:
        print(f"\n📝 Writing metadata to {OUTPUT_CSV_PATH}...")
        with open(OUTPUT_CSV_PATH, 'w', newline='', encoding='utf-8') as f:
            fieldnames = [
                'object_id', 'iso3', 'country_name', 'title', 'artist_name',
                'object_date', 'medium', 'department', 'culture', 'nudity', 'object_url',
                'primary_image_url', 'filepath', 'json_file'
            ]
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(results)
        print(f"✓ Wrote {len(results)} rows to {OUTPUT_CSV_PATH}")

    # Summary
    print("\n" + "="*60)
    print("PROCESSING SUMMARY")
    print("="*60)
    print(f"Total entries processed: {len(met_entries)}")
    print(f"Successful: {successful}")
    print(f"Failed/Skipped: {failed}")
    print(f"Metadata CSV: {OUTPUT_CSV_PATH}")
    print(f"JSON files: {JSON_DIR}/")
    print(f"Images: {IMAGES_BASE_DIR}/*/met/")
    print("="*60)

if __name__ == "__main__":
    print("="*60)
    print("Met Museum Data Fetcher")
    print("="*60)
    process_met_data()
    print("\n✅ Done!")
