#!/usr/bin/env python3
"""
Download children artwork from artwork_final.csv
Only process rows with 'Keep' in the Keep column
Organize by artist nationality (iso3_artist)
"""

import csv
import os
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


def download_children_artwork(csv_path='artwork_final.csv',
                               output_dir='backend/images'):
    """
    Download children artwork images and organize by artist nationality.
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

    # Add filepath column if not present
    if 'filepath' not in fieldnames:
        fieldnames.append('filepath')

    downloaded = 0
    skipped = 0
    errors = 0

    print(f"📊 Found {len(rows)} total records")

    # Count how many have 'Keep'
    keep_rows = [r for r in rows if r.get('Keep', '').strip().lower() == 'keep']
    print(f"📋 Processing {len(keep_rows)} records marked as 'Keep'\n")

    for idx, row in enumerate(rows, 1):
        try:
            # Only process rows with 'Keep' in Keep column
            keep_status = row.get('Keep', '').strip()
            if keep_status.lower() != 'keep':
                row['filepath'] = ''
                skipped += 1
                continue

            image_url = row.get('image_path', '').strip()
            iso3_artist = row.get('iso3 artist', '').strip()
            work_title = row.get('work_title', '').strip()
            is_local = row.get('is_local', '').strip().lower()

            # Skip if no URL or already local
            if not image_url or is_local == 'true':
                row['filepath'] = ''
                skipped += 1
                continue

            if not iso3_artist:
                print(f"⚠️  [{idx}/{len(rows)}] No iso3_artist code")
                row['filepath'] = ''
                skipped += 1
                continue

            # Generate filename from work_title
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

            # Create directory: backend/images/{iso3_artist}/children_artwork/
            country_dir = os.path.join(output_dir, iso3_artist, 'children_artwork')
            Path(country_dir).mkdir(parents=True, exist_ok=True)

            # Download image
            dest_path = os.path.join(country_dir, filename)

            # Skip if already exists
            if os.path.exists(dest_path):
                print(f"⏭️  [{idx}/{len(rows)}] Already exists: {iso3_artist}/children_artwork/{filename}")
                row['filepath'] = dest_path
                skipped += 1
                continue

            print(f"⬇️  [{idx}/{len(rows)}] Downloading: {iso3_artist}/children_artwork/{filename}...")

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
            row['filepath'] = dest_path

            downloaded += 1

        except Exception as e:
            print(f"❌ [{idx}/{len(rows)}] Error: {e}")
            row['filepath'] = ''
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
        description='Download children artwork from artwork_final.csv'
    )

    parser.add_argument(
        '--csv',
        default='artwork_final.csv',
        help='Input CSV file'
    )

    parser.add_argument(
        '--output-dir',
        default='backend/images',
        help='Output directory for images'
    )

    args = parser.parse_args()

    if not os.path.exists(args.csv):
        print(f"❌ CSV file not found: {args.csv}")
        return 1

    try:
        download_children_artwork(args.csv, args.output_dir)

        # Show final structure
        print("\n" + "="*60)
        print("📁 Final folder structure:")
        print("="*60)
        if os.path.exists(args.output_dir):
            for country_folder in sorted(os.listdir(args.output_dir)):
                country_path = os.path.join(args.output_dir, country_folder)
                if os.path.isdir(country_path):
                    children_artwork_path = os.path.join(country_path, 'children_artwork')
                    if os.path.exists(children_artwork_path) and os.path.isdir(children_artwork_path):
                        file_count = len([f for f in os.listdir(children_artwork_path)
                                        if os.path.isfile(os.path.join(children_artwork_path, f))])
                        if file_count > 0:
                            print(f"   {country_folder}/children_artwork/ ({file_count} images)")

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
