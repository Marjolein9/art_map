#!/usr/bin/env python3
"""
1. Move Albert Kahn images to albert_kahn subfolder
2. Download children artwork images to children subfolder
"""

import csv
import os
import shutil
import requests
import random
import re
from pathlib import Path
from urllib.parse import urlparse


def clean_filename(text, max_length=100):
    """Create safe filename from text."""
    if not text:
        return None

    # Remove special characters
    text = re.sub(r'[^\w\s-]', '', text)
    # Replace spaces with underscores
    text = text.replace(' ', '_')
    # Remove multiple underscores
    text = re.sub(r'_+', '_', text)
    # Limit length
    if len(text) > max_length:
        text = text[:max_length]

    return text.strip('_') or None


def move_albert_kahn_images(csv_path='albert_kahn_metadata.csv'):
    """
    Move Albert Kahn images from backend/images/{ALPHA3}/
    to backend/images/{ALPHA3}/albert_kahn/
    """
    print("\n" + "="*60)
    print("📦 MOVING ALBERT KAHN IMAGES TO SUBFOLDER")
    print("="*60 + "\n")

    # Read CSV
    rows = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    moved = 0
    skipped = 0
    errors = 0

    for idx, row in enumerate(rows, 1):
        try:
            old_filepath = row.get('new_filepath', '')
            alpha3 = row.get('alpha3', '').strip()
            image_filename = row.get('image_filename', '')

            if not alpha3 or not old_filepath:
                skipped += 1
                continue

            # Old path: backend/images/{ALPHA3}/{filename}
            # New path: backend/images/{ALPHA3}/albert_kahn/{filename}

            if not os.path.exists(old_filepath):
                print(f"⚠️  [{idx}/{len(rows)}] File not found: {old_filepath}")
                skipped += 1
                continue

            # Create albert_kahn subfolder
            new_dir = os.path.join('backend/images', alpha3, 'albert_kahn')
            Path(new_dir).mkdir(parents=True, exist_ok=True)

            # Move file
            new_filepath = os.path.join(new_dir, image_filename)
            shutil.move(old_filepath, new_filepath)

            # Update row
            row['new_filepath'] = new_filepath

            print(f"✅ [{idx}/{len(rows)}] Moved {alpha3}/{image_filename} → albert_kahn/")
            moved += 1

        except Exception as e:
            print(f"❌ [{idx}/{len(rows)}] Error: {e}")
            errors += 1

    # Write updated CSV
    print(f"\n💾 Updating CSV: {csv_path}")
    with open(csv_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"\n✅ Albert Kahn images moved:")
    print(f"   Moved: {moved}")
    print(f"   Skipped: {skipped}")
    print(f"   Errors: {errors}\n")


def download_children_artwork(csv_path='children_combined_with_iso3.csv',
                               output_dir='backend/images'):
    """
    Download children artwork images and organize by country.
    """
    print("\n" + "="*60)
    print("🎨 DOWNLOADING CHILDREN ARTWORK")
    print("="*60 + "\n")

    # Read CSV
    rows = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames)
        rows = list(reader)

    # Add new_filename column if not present
    if 'new_filename' not in fieldnames:
        fieldnames.append('new_filename')

    downloaded = 0
    skipped = 0
    errors = 0

    print(f"📊 Found {len(rows)} records to process\n")

    for idx, row in enumerate(rows, 1):
        try:
            image_url = row.get('image_path', '').strip()
            iso3 = row.get('iso3', '').strip()
            work_title = row.get('work_title', '').strip()
            is_local = row.get('is_local', '').strip().lower()

            # Skip if no URL or already local
            if not image_url or is_local == 'true':
                row['new_filename'] = ''
                skipped += 1
                continue

            if not iso3:
                print(f"⚠️  [{idx}/{len(rows)}] No iso3 code")
                row['new_filename'] = ''
                skipped += 1
                continue

            # Generate filename
            if work_title:
                base_filename = clean_filename(work_title)
            else:
                base_filename = f"artwork_{random.randint(10000, 99999)}"

            if not base_filename:
                base_filename = f"artwork_{random.randint(10000, 99999)}"

            # Get extension from URL
            parsed_url = urlparse(image_url)
            path = parsed_url.path
            ext = os.path.splitext(path)[1]

            if not ext or ext not in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
                ext = '.jpg'  # Default

            filename = f"{base_filename}{ext}"

            # Create directory: backend/images/{ISO3}/children/
            country_dir = os.path.join(output_dir, iso3, 'children')
            Path(country_dir).mkdir(parents=True, exist_ok=True)

            # Download image
            dest_path = os.path.join(country_dir, filename)

            # Skip if already exists
            if os.path.exists(dest_path):
                print(f"⏭️  [{idx}/{len(rows)}] Already exists: {iso3}/children/{filename}")
                row['new_filename'] = filename
                skipped += 1
                continue

            print(f"⬇️  [{idx}/{len(rows)}] Downloading: {iso3}/children/{filename}...")

            headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }

            response = requests.get(image_url, headers=headers, stream=True, timeout=30)
            response.raise_for_status()

            with open(dest_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)

            file_size = os.path.getsize(dest_path) / 1024
            print(f"   ✅ Downloaded ({file_size:.1f} KB)")

            # Update row
            row['new_filename'] = filename

            downloaded += 1

        except Exception as e:
            print(f"❌ [{idx}/{len(rows)}] Error: {e}")
            row['new_filename'] = ''
            errors += 1

    # Write updated CSV
    print(f"\n💾 Updating CSV: {csv_path}")
    with open(csv_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"\n✅ Children artwork download complete:")
    print(f"   Downloaded: {downloaded}")
    print(f"   Skipped: {skipped}")
    print(f"   Errors: {errors}\n")


def main():
    import argparse

    parser = argparse.ArgumentParser(
        description='Reorganize images and download children artwork'
    )

    parser.add_argument(
        '--skip-move',
        action='store_true',
        help='Skip moving Albert Kahn images'
    )

    parser.add_argument(
        '--skip-download',
        action='store_true',
        help='Skip downloading children artwork'
    )

    args = parser.parse_args()

    try:
        # Step 1: Move Albert Kahn images to subfolder
        if not args.skip_move:
            move_albert_kahn_images()

        # Step 2: Download children artwork
        if not args.skip_download:
            download_children_artwork()

        print("\n" + "="*60)
        print("✅ ALL TASKS COMPLETE!")
        print("="*60)

        # Show final structure
        print("\n📁 Final folder structure:")
        if os.path.exists('backend/images'):
            for country_folder in sorted(os.listdir('backend/images')):
                country_path = os.path.join('backend/images', country_folder)
                if os.path.isdir(country_path):
                    subfolders = [f for f in os.listdir(country_path) if os.path.isdir(os.path.join(country_path, f))]
                    if subfolders:
                        print(f"   {country_folder}/")
                        for subfolder in sorted(subfolders):
                            subfolder_path = os.path.join(country_path, subfolder)
                            file_count = len([f for f in os.listdir(subfolder_path) if os.path.isfile(os.path.join(subfolder_path, f))])
                            print(f"      {subfolder}/ ({file_count} images)")

        return 0

    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted")
        return 1

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == '__main__':
    exit(main())
