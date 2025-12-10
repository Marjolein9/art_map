#!/usr/bin/env python3
"""
Convert webp images to jpg, resize to max 800px width, and update CSV/database references
"""

import os
import sqlite3
import csv
from PIL import Image
from pathlib import Path

# Configuration
MAX_WIDTH = 800
QUALITY = 85  # JPEG quality (1-100)
DATABASE_PATH = 'backend/database.db'
IMAGES_BASE_DIR = 'backend/images'

# CSV files to update
CSV_FILES = [
    'backend/data/exports/public_domain_images.csv',
    'backend/data/exports/albert_kahn_images.csv',
    'backend/data/exports/children_artwork_images.csv',
]

# Database tables and their filepath/filename columns
DB_TABLES = [
    {'table': 'public_domain_images', 'filepath_col': 'filepath', 'filename_col': 'filename'},
    {'table': 'albert_kahn_images', 'filepath_col': 'new_filepath', 'filename_col': 'image_filename'},
    {'table': 'children_artwork_images', 'filepath_col': 'filepath', 'filename_col': 'image_path'},
]

def convert_and_resize_image(webp_path, max_width=MAX_WIDTH, quality=QUALITY):
    """
    Convert webp to jpg and resize to max width while maintaining aspect ratio

    Args:
        webp_path: Path to the webp image
        max_width: Maximum width in pixels
        quality: JPEG quality (1-100)

    Returns:
        Path to the new jpg file or None if conversion failed
    """
    try:
        # Open the webp image
        img = Image.open(webp_path)

        # Convert RGBA to RGB if necessary (webp might have alpha channel)
        if img.mode in ('RGBA', 'LA', 'P'):
            # Create a white background
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
            img = background
        elif img.mode != 'RGB':
            img = img.convert('RGB')

        # Resize if width exceeds max_width
        width, height = img.size
        if width > max_width:
            # Calculate new height maintaining aspect ratio
            ratio = max_width / width
            new_height = int(height * ratio)
            img = img.resize((max_width, new_height), Image.LANCZOS)
            print(f"  ↔️  Resized from {width}x{height} to {max_width}x{new_height}")
        else:
            print(f"  ✓ Size {width}x{height} already within limits")

        # Create jpg filename
        jpg_path = str(webp_path).rsplit('.webp', 1)[0] + '.jpg'

        # Save as jpg
        img.save(jpg_path, 'JPEG', quality=quality, optimize=True)

        # Get file sizes for comparison
        webp_size = os.path.getsize(webp_path)
        jpg_size = os.path.getsize(jpg_path)

        print(f"  ✅ Converted: {os.path.basename(jpg_path)}")
        print(f"  📊 Size: {webp_size/1024:.1f}KB (webp) → {jpg_size/1024:.1f}KB (jpg)")

        return jpg_path

    except Exception as e:
        print(f"  ❌ Error converting {webp_path}: {e}")
        return None

def update_csv_files(old_path, new_path):
    """Update CSV files to replace webp references with jpg"""

    # Normalize paths for comparison
    old_filename = os.path.basename(old_path)
    new_filename = os.path.basename(new_path)

    for csv_file in CSV_FILES:
        if not os.path.exists(csv_file):
            continue

        print(f"  📝 Updating {os.path.basename(csv_file)}")

        # Read all rows
        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            fieldnames = reader.fieldnames
            rows = list(reader)

        # Update rows
        updated = 0
        for row in rows:
            # Check all possible filename and filepath columns
            for col in ['filename', 'filepath', 'file_path', 'new_filepath', 'image_filename', 'image_path']:
                if col in row and row[col]:
                    if old_filename in row[col]:
                        row[col] = row[col].replace(old_filename, new_filename)
                        updated += 1
                    if old_path in row[col]:
                        row[col] = row[col].replace(old_path, new_path)
                        updated += 1

        if updated > 0:
            # Write back to CSV
            with open(csv_file, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(rows)
            print(f"    ✅ Updated {updated} references")
        else:
            print(f"    ℹ️  No changes needed")

def update_database(old_path, new_path):
    """Update database tables to replace webp references with jpg"""

    if not os.path.exists(DATABASE_PATH):
        print(f"  ⚠️  Database not found: {DATABASE_PATH}")
        return

    # Normalize paths for comparison
    old_filename = os.path.basename(old_path)
    new_filename = os.path.basename(new_path)

    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    total_updates = 0

    for table_info in DB_TABLES:
        table = table_info['table']
        filepath_col = table_info['filepath_col']
        filename_col = table_info['filename_col']

        try:
            # Update filepath column
            cursor.execute(f'''
                UPDATE {table}
                SET {filepath_col} = REPLACE({filepath_col}, ?, ?)
                WHERE {filepath_col} LIKE ?
            ''', (old_filename, new_filename, f'%{old_filename}%'))

            updates1 = cursor.rowcount

            # Update filename column
            cursor.execute(f'''
                UPDATE {table}
                SET {filename_col} = REPLACE({filename_col}, ?, ?)
                WHERE {filename_col} LIKE ?
            ''', (old_filename, new_filename, f'%{old_filename}%'))

            updates2 = cursor.rowcount

            if updates1 > 0 or updates2 > 0:
                print(f"  📝 Updated {table}: {updates1 + updates2} records")
                total_updates += updates1 + updates2

        except sqlite3.Error as e:
            print(f"  ⚠️  Error updating {table}: {e}")

    if total_updates > 0:
        conn.commit()
        print(f"  ✅ Database updated: {total_updates} total records")
    else:
        print(f"  ℹ️  No database changes needed")

    conn.close()

def find_webp_images(base_dir=IMAGES_BASE_DIR):
    """Find all webp images recursively"""
    webp_files = []

    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if file.lower().endswith('.webp'):
                webp_files.append(os.path.join(root, file))

    return webp_files

def main():
    print("=" * 60)
    print("Image Conversion Script")
    print("Converting webp → jpg, resizing to max 800px width")
    print("=" * 60)

    # Find all webp images
    webp_images = find_webp_images()

    if not webp_images:
        print("\n✅ No webp images found!")
        return

    print(f"\n📸 Found {len(webp_images)} webp images to convert\n")

    converted = 0
    failed = 0

    for i, webp_path in enumerate(webp_images, 1):
        print(f"\n[{i}/{len(webp_images)}] Processing: {os.path.basename(webp_path)}")

        # Convert and resize
        jpg_path = convert_and_resize_image(webp_path)

        if jpg_path:
            # Update CSV files
            update_csv_files(webp_path, jpg_path)

            # Update database
            update_database(webp_path, jpg_path)

            # Delete old webp file
            try:
                os.remove(webp_path)
                print(f"  🗑️  Deleted: {os.path.basename(webp_path)}")
            except Exception as e:
                print(f"  ⚠️  Could not delete webp: {e}")

            converted += 1
        else:
            failed += 1

    print("\n" + "=" * 60)
    print(f"✅ Conversion complete!")
    print(f"   Converted: {converted}")
    print(f"   Failed: {failed}")
    print("=" * 60)

    # Show how to load smaller versions
    print("\n💡 How to load smaller image versions:")
    print("   1. Images are already optimized to max 800px width")
    print("   2. For thumbnails, create a separate function:")
    print("      - Load image with PIL: Image.open(filepath)")
    print("      - Resize to thumbnail size: img.thumbnail((200, 200))")
    print("      - Save to separate thumbnail directory")
    print("   3. For web delivery, consider:")
    print("      - Using responsive images with srcset attribute")
    print("      - Implementing lazy loading")
    print("      - Serving via CDN with automatic resizing")

if __name__ == '__main__':
    main()
