#!/usr/bin/env python3
"""
Process public domain images from public_review_images.csv
- Copy files from downloads folder
- Rename based on Public Domain Title
- Organize by country alpha3 code
- Save to backend/images/{alpha3}/public_domain/
"""

import csv
import json
import os
import shutil
import re
from pathlib import Path


def load_m49_data(m49_path='backend/data/m49-list.json'):
    """Load M49 country list for country name -> alpha3 lookup."""
    with open(m49_path, 'r', encoding='utf-8') as f:
        m49_data = json.load(f)

    countries = m49_data.get('countries', [])

    # Create lookup dictionary: Country name -> alpha3
    country_lookup = {}
    for country in countries:
        name = country.get('name', '').strip()
        alpha3 = country.get('alpha3', '').strip()

        if name and alpha3:
            country_lookup[name.lower()] = alpha3

    # Add common name variations
    fallbacks = {
        'czech republic': 'CZE',
        'czechia': 'CZE',
        'russia': 'RUS',
        'russian federation': 'RUS',
        'palestine': 'PSE',
        'state of palestine': 'PSE',
        'united states': 'USA',
        'united states of america': 'USA',
        'usa': 'USA',
        'uk': 'GBR',
        'united kingdom': 'GBR',
        'south korea': 'KOR',
        'korea': 'KOR',
        'north korea': 'PRK',
        'vietnam': 'VNM',
        'viet nam': 'VNM',
    }

    country_lookup.update(fallbacks)

    return country_lookup


def clean_filename(text, max_length=100):
    """Create safe filename from text."""
    if not text:
        return None

    # Remove newlines and extra whitespace
    text = ' '.join(text.split())

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


def process_public_domain_images(csv_path='public_review_images.csv',
                                  downloads_dir='downloads',
                                  output_dir='backend/images'):
    """
    Process public domain images and organize by country.
    """
    print("\n" + "="*60)
    print("🖼️  PROCESSING PUBLIC DOMAIN IMAGES")
    print("="*60 + "\n")

    # Load M49 country data
    print("📚 Loading country codes from M49 list...")
    country_lookup = load_m49_data()
    print(f"   Loaded {len(country_lookup)} countries\n")

    # Read CSV
    rows = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames)
        rows = list(reader)

    # Add filepath column if not present
    if 'filepath' not in fieldnames:
        fieldnames.append('filepath')

    processed = 0
    skipped = 0
    errors = 0

    print(f"📊 Found {len(rows)} total records\n")

    for idx, row in enumerate(rows, 1):
        try:
            # Check if should be removed
            remove_status = row.get('Remove', '').strip().lower()
            if remove_status == 'yes':
                row['filepath'] = ''
                skipped += 1
                continue

            # Get data from row
            country_name = row.get('Country', '').strip()
            alpha_code = row.get('Alpha Code', '').strip()
            filename = row.get('Filename', '').strip()
            public_domain_title = row.get('Public Domain Title', '').strip()

            if not filename:
                print(f"⚠️  [{idx}/{len(rows)}] No filename")
                row['filepath'] = ''
                skipped += 1
                continue

            if not country_name:
                print(f"⚠️  [{idx}/{len(rows)}] No country name")
                row['filepath'] = ''
                skipped += 1
                continue

            # Get or look up alpha3 code
            if not alpha_code:
                # Look up in M49 data
                alpha_code = country_lookup.get(country_name.lower(), '')
                if alpha_code:
                    row['Alpha Code'] = alpha_code
                    print(f"✅ [{idx}/{len(rows)}] Looked up {country_name} -> {alpha_code}")
                else:
                    print(f"⚠️  [{idx}/{len(rows)}] Could not find alpha3 code for: {country_name}")
                    row['filepath'] = ''
                    skipped += 1
                    continue

            # Check source file exists
            source_path = os.path.join(downloads_dir, filename)
            if not os.path.exists(source_path):
                print(f"❌ [{idx}/{len(rows)}] Source file not found: {source_path}")
                row['filepath'] = ''
                errors += 1
                continue

            # Generate new filename from public domain title
            if public_domain_title:
                base_filename = clean_filename(public_domain_title)
            else:
                base_filename = clean_filename(filename.rsplit('.', 1)[0])

            if not base_filename:
                base_filename = f"image_{idx}"

            # Get extension from original filename
            ext = os.path.splitext(filename)[1]
            if not ext:
                ext = '.jpg'

            new_filename = f"{base_filename}{ext}"

            # Create directory: backend/images/{alpha3}/public_domain/
            country_dir = os.path.join(output_dir, alpha_code, 'public_domain')
            Path(country_dir).mkdir(parents=True, exist_ok=True)

            # Copy file
            dest_path = os.path.join(country_dir, new_filename)

            # Skip if already exists
            if os.path.exists(dest_path):
                print(f"⏭️  [{idx}/{len(rows)}] Already exists: {alpha_code}/public_domain/{new_filename}")
                row['filepath'] = dest_path
                skipped += 1
                continue

            shutil.copy2(source_path, dest_path)

            file_size = os.path.getsize(dest_path) / 1024
            print(f"✅ [{idx}/{len(rows)}] Copied: {alpha_code}/public_domain/{new_filename} ({file_size:.1f} KB)")

            # Update row
            row['filepath'] = dest_path

            processed += 1

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

    print(f"\n✅ Public domain image processing complete:")
    print(f"   Processed: {processed}")
    print(f"   Skipped: {skipped}")
    print(f"   Errors: {errors}\n")


def main():
    import argparse

    parser = argparse.ArgumentParser(
        description='Process public domain images from CSV'
    )

    parser.add_argument(
        '--csv',
        default='public_review_images.csv',
        help='Input CSV file'
    )

    parser.add_argument(
        '--downloads-dir',
        default='downloads',
        help='Downloads directory containing source images'
    )

    parser.add_argument(
        '--output-dir',
        default='backend/images',
        help='Output directory for organized images'
    )

    args = parser.parse_args()

    if not os.path.exists(args.csv):
        print(f"❌ CSV file not found: {args.csv}")
        return 1

    if not os.path.exists(args.downloads_dir):
        print(f"❌ Downloads directory not found: {args.downloads_dir}")
        return 1

    try:
        process_public_domain_images(args.csv, args.downloads_dir, args.output_dir)

        # Show final structure
        print("\n" + "="*60)
        print("📁 Final folder structure:")
        print("="*60)
        if os.path.exists(args.output_dir):
            for country_folder in sorted(os.listdir(args.output_dir)):
                country_path = os.path.join(args.output_dir, country_folder)
                if os.path.isdir(country_path):
                    public_domain_path = os.path.join(country_path, 'public_domain')
                    if os.path.exists(public_domain_path) and os.path.isdir(public_domain_path):
                        file_count = len([f for f in os.listdir(public_domain_path)
                                        if os.path.isfile(os.path.join(public_domain_path, f))])
                        if file_count > 0:
                            print(f"   {country_folder}/public_domain/ ({file_count} images)")

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
