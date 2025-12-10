#!/usr/bin/env python3
"""
Copy images to backend/images organized by alpha3 country code
and update CSV with new file paths
"""

import csv
import os
import shutil
from pathlib import Path


def organize_images(csv_path='albert_kahn_metadata.csv',
                    output_dir='backend/images',
                    output_csv='albert_kahn_metadata.csv'):
    """
    Copy images to organized folder structure and update CSV.
    """
    print(f"📁 Reading CSV: {csv_path}")

    # Read CSV
    rows = []
    fieldnames = []

    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    print(f"📊 Found {len(rows)} records")

    # Add new_filepath to fieldnames if not present
    if 'new_filepath' not in fieldnames:
        fieldnames = list(fieldnames) + ['new_filepath']

    # Create base output directory
    Path(output_dir).mkdir(parents=True, exist_ok=True)

    # Process each row
    copied = 0
    skipped = 0
    errors = 0

    print(f"\n🚀 Starting image organization...")
    print(f"   Output directory: {output_dir}\n")

    for idx, row in enumerate(rows, 1):
        try:
            # Get image source path
            file_path = row.get('file_path', '')
            image_filename = row.get('image_filename', '')
            alpha3 = row.get('alpha3', '').strip()

            if not alpha3:
                # Skip if no country code
                print(f"⚠️  [{idx}/{len(rows)}] No alpha3 code for: {image_filename}")
                row['new_filepath'] = ''
                skipped += 1
                continue

            # Construct source image path
            if file_path:
                # Get directory of JSON file
                json_dir = os.path.dirname(file_path)
                # Image should be in the same directory
                source_image_path = os.path.join(json_dir, image_filename)
            else:
                print(f"⚠️  [{idx}/{len(rows)}] No file_path for: {image_filename}")
                row['new_filepath'] = ''
                skipped += 1
                continue

            # Check if source exists
            if not os.path.exists(source_image_path):
                print(f"❌ [{idx}/{len(rows)}] Source not found: {source_image_path}")
                row['new_filepath'] = ''
                errors += 1
                continue

            # Create country folder
            country_dir = os.path.join(output_dir, alpha3)
            Path(country_dir).mkdir(parents=True, exist_ok=True)

            # Destination path
            dest_path = os.path.join(country_dir, image_filename)
            new_filepath_relative = os.path.join(output_dir, alpha3, image_filename)

            # Copy file
            shutil.copy2(source_image_path, dest_path)

            # Update row
            row['new_filepath'] = new_filepath_relative

            print(f"✅ [{idx}/{len(rows)}] {alpha3}/{image_filename}")
            copied += 1

        except Exception as e:
            print(f"❌ [{idx}/{len(rows)}] Error: {e}")
            row['new_filepath'] = ''
            errors += 1

    # Write updated CSV
    print(f"\n💾 Writing updated CSV: {output_csv}")

    with open(output_csv, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    # Summary
    print(f"\n{'='*60}")
    print(f"✅ Organization complete!")
    print(f"{'='*60}")
    print(f"   Copied: {copied}")
    print(f"   Skipped: {skipped}")
    print(f"   Errors: {errors}")
    print(f"   Total: {len(rows)}")
    print(f"   Output: {output_dir}")
    print(f"{'='*60}\n")

    # Show folder summary
    print("📁 Country folders created:")
    if os.path.exists(output_dir):
        folders = sorted([f for f in os.listdir(output_dir) if os.path.isdir(os.path.join(output_dir, f))])
        for folder in folders:
            folder_path = os.path.join(output_dir, folder)
            file_count = len([f for f in os.listdir(folder_path) if os.path.isfile(os.path.join(folder_path, f))])
            print(f"   {folder}/ ({file_count} images)")


def main():
    import argparse

    parser = argparse.ArgumentParser(
        description='Organize images by country code and update CSV'
    )

    parser.add_argument(
        '--csv',
        default='albert_kahn_metadata.csv',
        help='Input CSV file'
    )

    parser.add_argument(
        '--output-dir',
        default='backend/images',
        help='Output directory for organized images'
    )

    parser.add_argument(
        '--output-csv',
        default='albert_kahn_metadata.csv',
        help='Output CSV file (can be same as input to update in place)'
    )

    args = parser.parse_args()

    if not os.path.exists(args.csv):
        print(f"❌ CSV file not found: {args.csv}")
        return 1

    organize_images(args.csv, args.output_dir, args.output_csv)
    return 0


if __name__ == '__main__':
    exit(main())
