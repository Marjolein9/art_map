#!/usr/bin/env python3
"""
Cleanup Orphaned Images Script

Removes image files from the filesystem that are not referenced in the database.
This helps keep storage clean by removing images from failed imports or deleted entries.

Usage:
    python3 cleanup_orphaned_images.py

The script will:
1. Query all image filepaths from the database (all collections)
2. Scan the images directory for actual files
3. Delete any files not found in the database
4. Report statistics on cleanup

Collections checked:
- Albert Kahn Images
- Children Artwork Images
- Public Domain Images
- Met Museum Images
"""

import os
from db_utils import get_db_connection
from config import BASE_DIR


def get_all_image_filepaths_from_db():
    """Query all image filepaths from all image tables in database"""
    conn = get_db_connection()
    cursor = conn.cursor()

    all_filepaths = set()

    # Get filepaths from all image tables
    tables = [
        'albert_kahn_images',
        'children_artwork_images',
        'public_domain_images',
        'met_images'
    ]

    for table in tables:
        try:
            cursor.execute(f'SELECT filepath FROM {table} WHERE filepath IS NOT NULL')
            rows = cursor.fetchall()
            for row in rows:
                # filepath is stored as relative path like "images/USA/children_artwork/foo.jpg"
                # Convert to absolute path for comparison
                if row[0]:
                    abs_path = os.path.join(BASE_DIR, row[0])
                    all_filepaths.add(abs_path)
        except Exception as e:
            print(f"⚠️  Error querying {table}: {e}")

    conn.close()
    return all_filepaths


def scan_images_directory():
    """Scan the images directory and return all image file paths"""
    images_dir = os.path.join(BASE_DIR, 'images')
    all_files = []

    if not os.path.exists(images_dir):
        print(f"⚠️  Images directory not found: {images_dir}")
        return all_files

    # Walk through all subdirectories
    for root, dirs, files in os.walk(images_dir):
        for filename in files:
            # Skip hidden files and non-image files
            if filename.startswith('.'):
                continue
            if not filename.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
                continue

            file_path = os.path.join(root, filename)
            all_files.append(file_path)

    return all_files


def cleanup_orphaned_images(dry_run=False):
    """
    Remove orphaned images from filesystem

    Args:
        dry_run: If True, only report what would be deleted without actually deleting
    """
    print("🧹 Starting orphaned images cleanup...")
    print(f"   Mode: {'DRY RUN (no files will be deleted)' if dry_run else 'LIVE (files will be deleted)'}\n")

    # Get all filepaths from database
    print("📊 Querying database for image filepaths...")
    db_filepaths = get_all_image_filepaths_from_db()
    print(f"   Found {len(db_filepaths)} images in database\n")

    # Scan filesystem for actual files
    print("📂 Scanning filesystem for image files...")
    filesystem_files = scan_images_directory()
    print(f"   Found {len(filesystem_files)} image files on disk\n")

    # Find orphaned files (in filesystem but not in database)
    orphaned_files = []
    for file_path in filesystem_files:
        if file_path not in db_filepaths:
            orphaned_files.append(file_path)

    # Report and optionally delete
    if not orphaned_files:
        print("✅ No orphaned images found!")
        return

    print(f"🗑️  Found {len(orphaned_files)} orphaned images:\n")

    deleted_count = 0
    for file_path in orphaned_files:
        # Get relative path for display
        rel_path = os.path.relpath(file_path, os.path.join(BASE_DIR, 'images'))

        if dry_run:
            print(f"   [DRY RUN] Would delete: {rel_path}")
        else:
            try:
                os.remove(file_path)
                print(f"   🗑️  Deleted: {rel_path}")
                deleted_count += 1
            except Exception as e:
                print(f"   ❌ Error deleting {rel_path}: {e}")

    print()
    if dry_run:
        print(f"✅ Dry run complete. {len(orphaned_files)} files would be deleted.")
    else:
        print(f"✅ Cleanup complete. Deleted {deleted_count}/{len(orphaned_files)} orphaned images.")


def main():
    """Main entry point"""
    import sys

    # Check for --dry-run flag
    dry_run = '--dry-run' in sys.argv

    cleanup_orphaned_images(dry_run=dry_run)

    if dry_run:
        print("\n💡 Tip: Run without --dry-run flag to actually delete files")


if __name__ == '__main__':
    main()
