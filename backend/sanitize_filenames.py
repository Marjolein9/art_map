#!/usr/bin/env python3
"""
Sanitize Image Filenames Script

Renames image files to clean, sanitized names and updates all references in CSV files.
This ensures consistency across filesystem, CSVs, and database.

Usage:
    python3 sanitize_filenames.py [--dry-run]

The script will:
1. Read CSV files to find image entries
2. Locate actual files on disk
3. Generate sanitized filenames from titles
4. Rename files on disk
5. Update CSV files with new filepaths
6. Database will be updated when init_database_postgres.py runs next

--dry-run: Show what would be renamed without actually doing it
"""

import os
import csv
import re
from pathlib import Path
from config import BASE_DIR
from filename_utils import sanitize_filename


def find_image_in_directory(directory, exclude_files=None):
    """
    Find any image file in the given directory.

    Args:
        directory: Path to search
        exclude_files: Set of filenames to exclude

    Returns:
        Path to first image file found, or None
    """
    if not os.path.exists(directory):
        return None

    exclude_files = exclude_files or set()

    for filename in os.listdir(directory):
        if filename in exclude_files:
            continue

        if filename.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
            return os.path.join(directory, filename)

    return None


def sanitize_children_artwork_csv(dry_run=False):
    """
    Sanitize filenames for children artwork images.

    Process:
    1. Read children_artwork_images.csv
    2. For each entry with Keep="keep":
       - Find actual file on disk
       - Generate sanitized filename from title
       - Rename file
       - Update filepath in CSV
    """
    csv_path = os.path.join(BASE_DIR, 'data', 'exports', 'children_artwork_images.csv')

    if not os.path.exists(csv_path):
        print(f"⚠️  CSV not found: {csv_path}")
        return

    print(f"🎨 Processing: children_artwork_images.csv")

    # Read all rows
    rows = []
    renamed_count = 0

    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames

        for row in reader:
            # Only process rows with Keep="Keep"
            if row.get('keep', '').strip().lower() != 'keep':
                rows.append(row)
                continue

            artist_iso3 = row.get('artist_iso3', '').strip()
            title = row.get('title', '').strip()

            if not artist_iso3 or not title:
                rows.append(row)
                continue

            # Generate sanitized filename
            sanitized_name = sanitize_filename(title)
            if not sanitized_name:
                print(f"  ⚠️  Could not sanitize: {title}")
                rows.append(row)
                continue

            # Directory where image should be
            image_dir = os.path.join(BASE_DIR, 'images', artist_iso3, 'children_artwork')

            # First, try to use filepath from CSV if it exists
            existing_file = None
            csv_filepath = row.get('filepath', '').strip()

            if csv_filepath:
                csv_file_abs = os.path.join(BASE_DIR, csv_filepath)
                if os.path.exists(csv_file_abs):
                    existing_file = csv_file_abs

            # If not found via CSV filepath, search directory for any image
            if not existing_file:
                existing_file = find_image_in_directory(image_dir)

            if not existing_file:
                # No file found - will be downloaded by init_database
                new_filepath = f"images/{artist_iso3}/children_artwork/{sanitized_name}"
                row['filepath'] = new_filepath
                rows.append(row)
                continue

            existing_filename = os.path.basename(existing_file)

            # Check if already sanitized
            if existing_filename == sanitized_name:
                # Already has correct name
                row['filepath'] = f"images/{artist_iso3}/children_artwork/{sanitized_name}"
                rows.append(row)
                continue

            # Need to rename
            new_path = os.path.join(image_dir, sanitized_name)

            if dry_run:
                print(f"  [DRY RUN] {artist_iso3}: {existing_filename} → {sanitized_name}")
            else:
                try:
                    os.rename(existing_file, new_path)
                    print(f"  ✓ {artist_iso3}: {existing_filename} → {sanitized_name}")
                    renamed_count += 1
                except Exception as e:
                    print(f"  ❌ Error renaming {existing_filename}: {e}")

            # Update filepath in row
            row['filepath'] = f"images/{artist_iso3}/children_artwork/{sanitized_name}"
            rows.append(row)

    # Write updated CSV
    if not dry_run and renamed_count > 0:
        with open(csv_path, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)
        print(f"  💾 Updated CSV with {renamed_count} new filepaths")

    return renamed_count


def main():
    """Main entry point"""
    import sys

    dry_run = '--dry-run' in sys.argv

    print("🔧 Starting filename sanitization...")
    print(f"   Mode: {'DRY RUN (no changes)' if dry_run else 'LIVE (files will be renamed)'}\n")

    # Process children artwork
    children_count = sanitize_children_artwork_csv(dry_run=dry_run)

    print()
    if dry_run:
        print(f"✅ Dry run complete. Would rename {children_count} files.")
        print("\n💡 Tip: Run without --dry-run to actually rename files")
    else:
        print(f"✅ Sanitization complete. Renamed {children_count} files.")
        print("\n📝 Next steps:")
        print("   1. Run: python3 init_database_postgres.py")
        print("   2. Database will now have sanitized filepaths")
        print("   3. Run: python3 cleanup_orphaned_images.py")
        print("   4. Remove any orphaned files")


if __name__ == '__main__':
    main()
