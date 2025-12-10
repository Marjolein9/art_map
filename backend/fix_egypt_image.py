#!/usr/bin/env python3
"""
Fix the corrupted Egypt image by downloading the correct one
"""

import os
import sqlite3
import csv
import requests
from PIL import Image
from io import BytesIO

# Configuration
IMAGE_URL = "https://tile.loc.gov/image-services/iiif/service:gdc:gdcwdl:wd:l_:08:93:3:wdl_08933:bsb00045958_00192/full/pct:25/0/default.jpg"
OUTPUT_DIR = "backend/images/EGY/public_domain"
FILENAME = "Travelling_Tales_Kalilah_wa-Dimnah_and_the_Animal_Fable.jpg"
OLD_FILENAME = "iiif-service_gdc_gdcwdl_wd_l__08_93_3_wdl_08933_bsb00045958_00192-full-pct_25-0-default.webp"
MAX_WIDTH = 800
QUALITY = 85

def download_and_resize_image():
    """Download and resize the Egypt manuscript image"""
    try:
        print("📥 Downloading Egypt manuscript image...")

        # Download the image
        response = requests.get(IMAGE_URL, timeout=30, headers={
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        })
        response.raise_for_status()

        # Open image from bytes
        img = Image.open(BytesIO(response.content))

        # Convert to RGB if necessary
        if img.mode != 'RGB':
            img = img.convert('RGB')

        # Resize if needed
        width, height = img.size
        if width > MAX_WIDTH:
            ratio = MAX_WIDTH / width
            new_height = int(height * ratio)
            img = img.resize((MAX_WIDTH, new_height), Image.LANCZOS)
            print(f"  ↔️  Resized from {width}x{height} to {MAX_WIDTH}x{new_height}")
        else:
            print(f"  ✓ Size {width}x{height} already within limits")

        # Create directory if needed
        os.makedirs(OUTPUT_DIR, exist_ok=True)

        # Save as jpg
        output_path = os.path.join(OUTPUT_DIR, FILENAME)
        img.save(output_path, 'JPEG', quality=QUALITY, optimize=True)

        file_size = os.path.getsize(output_path)
        print(f"  ✅ Saved: {FILENAME}")
        print(f"  📊 Size: {file_size/1024:.1f}KB")

        return output_path

    except Exception as e:
        print(f"  ❌ Error: {e}")
        return None

def update_csv():
    """Update CSV file with new filename"""
    csv_file = 'backend/data/exports/public_domain_images.csv'

    print(f"\n📝 Updating {os.path.basename(csv_file)}...")

    # Read all rows
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    # Update the Egypt entry
    updated = 0
    for row in rows:
        if row.get('filename') == OLD_FILENAME:
            row['filename'] = FILENAME
            row['filepath'] = f"images/EGY/public_domain/{FILENAME}"
            updated += 1
            print(f"  ✅ Updated row {row['id']}")

    # Write back to CSV
    with open(csv_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"  ✅ CSV updated: {updated} records")

def update_database():
    """Update database with new filename"""
    db_path = 'backend/database.db'

    if not os.path.exists(db_path):
        print(f"\n⚠️  Database not found: {db_path}")
        return

    print(f"\n📝 Updating database...")

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Update filepath
        cursor.execute('''
            UPDATE public_domain_images
            SET filepath = ?, filename = ?
            WHERE filename = ?
        ''', (f"images/EGY/public_domain/{FILENAME}", FILENAME, OLD_FILENAME))

        updates = cursor.rowcount

        if updates > 0:
            conn.commit()
            print(f"  ✅ Database updated: {updates} records")
        else:
            print(f"  ℹ️  No database changes needed")

    except sqlite3.Error as e:
        print(f"  ⚠️  Error updating database: {e}")
    finally:
        conn.close()

def main():
    print("=" * 60)
    print("Fix Egypt Image")
    print("=" * 60)

    # Download and resize
    result = download_and_resize_image()

    if result:
        # Update CSV
        update_csv()

        # Update database
        update_database()

        print("\n" + "=" * 60)
        print("✅ Egypt image fixed successfully!")
        print("=" * 60)
    else:
        print("\n❌ Failed to fix Egypt image")

if __name__ == '__main__':
    main()
