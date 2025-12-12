#!/usr/bin/env python3
"""
Script to clean up unwanted image files:
1. Remove all smithsonian folders and images
2. Remove all .backup files
"""

import os
import shutil
from pathlib import Path

def cleanup_images(base_path):
    """Remove smithsonian folders and .backup files"""
    base_path = Path(base_path)

    smithsonian_removed = []
    backup_removed = []

    # Walk through the directory tree
    for root, dirs, files in os.walk(base_path, topdown=False):
        root_path = Path(root)

        # Remove .backup files
        for file in files:
            file_path = root_path / file
            if file.endswith('.backup'):
                print(f"Removing backup file: {file_path}")
                file_path.unlink()
                backup_removed.append(str(file_path))

        # Remove smithsonian directories
        for dir_name in dirs:
            if dir_name == 'smithsonian':
                dir_path = root_path / dir_name
                print(f"Removing smithsonian folder: {dir_path}")
                shutil.rmtree(dir_path)
                smithsonian_removed.append(str(dir_path))

    # Print summary
    print("\n" + "="*60)
    print("CLEANUP SUMMARY")
    print("="*60)
    print(f"\nSmithsonian folders removed: {len(smithsonian_removed)}")
    for path in smithsonian_removed:
        print(f"  - {path}")

    print(f"\nBackup files removed: {len(backup_removed)}")
    for path in backup_removed:
        print(f"  - {path}")

    print(f"\nTotal items removed: {len(smithsonian_removed) + len(backup_removed)}")

if __name__ == "__main__":
    images_path = "images"

    if os.path.exists(images_path):
        print(f"Starting cleanup in: {os.path.abspath(images_path)}\n")
        cleanup_images(images_path)
        print("\nCleanup completed successfully!")
    else:
        print(f"Error: Path not found: {images_path}")
