#!/usr/bin/env python3
"""
Batch Process Albert Kahn URLs - Organize by Location

Reads URLs from CSV and downloads images organized by location folders.
"""

import csv
import os
import sys
import time
import re
from pathlib import Path
from scrape_complete import extract_all_metadata, download_image, clean_filename
import json


def clean_folder_name(text):
    """Create a safe folder name from location text."""
    if not text:
        return "Unknown_Location"

    # Remove special characters
    text = re.sub(r'[^\w\s-]', '', text)
    # Replace spaces with underscores
    text = text.replace(' ', '_')
    # Remove multiple underscores
    text = re.sub(r'_+', '_', text)
    # Limit length
    if len(text) > 50:
        text = text[:50]
    return text.strip('_') or "Unknown_Location"


def process_csv(
    csv_path='countries_public_review.csv',
    url_column='Archive planet',
    base_output_dir='images_by_location',
    delay=3,
    limit=None
):
    """
    Process CSV file and download images organized by location.
    """
    print(f"📁 Loading CSV: {csv_path}")

    # Read CSV
    rows_with_urls = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        # Check if column exists
        if url_column not in reader.fieldnames:
            print(f"❌ Error: Column '{url_column}' not found")
            print(f"Available columns: {', '.join(reader.fieldnames)}")
            return

        for row in reader:
            url = row.get(url_column, '').strip()
            if url:
                rows_with_urls.append(row)
                if limit and len(rows_with_urls) >= limit:
                    break

    print(f"\n🔍 Found {len(rows_with_urls)} rows with URLs")

    if len(rows_with_urls) == 0:
        print("❌ No URLs to process")
        return

    # Create base output directory
    Path(base_output_dir).mkdir(parents=True, exist_ok=True)

    # Process each URL
    total = len(rows_with_urls)
    successful = 0
    failed = 0

    print(f"\n🚀 Starting batch processing...")
    print(f"   Base directory: {base_output_dir}")
    print(f"   Delay between requests: {delay}s\n")

    for idx, row in enumerate(rows_with_urls, 1):
        url = row[url_column]
        country_name = row.get('name', 'Unknown')

        print(f"\n{'='*60}")
        print(f"[{idx}/{total}] Processing: {country_name}")
        print(f"{'='*60}")
        print(f"URL: {url[:80]}...")

        try:
            # Extract metadata
            print("\n🌐 Scraping metadata...")
            metadata = extract_all_metadata(url)

            # Get location for folder name
            location = metadata.get('location', '')
            if not location:
                location = metadata.get('country', '')
            if not location:
                location = country_name

            # Clean location for folder name
            folder_name = clean_folder_name(location)
            output_dir = os.path.join(base_output_dir, folder_name)

            print(f"\n📂 Creating folder: {output_dir}")
            Path(output_dir).mkdir(parents=True, exist_ok=True)

            # Download image
            if metadata.get('image_url'):
                # Generate filename from title
                if metadata.get('title'):
                    base_fn = clean_filename(metadata['title'])
                    ext = os.path.splitext(metadata['image_url'])[1] or '.jpg'
                    filename = f"{base_fn}{ext}"
                else:
                    filename = None

                filepath = download_image(
                    metadata['image_url'],
                    output_dir,
                    filename
                )

                if filepath:
                    metadata['downloaded_filename'] = os.path.basename(filepath)
                    metadata['downloaded_path'] = filepath

                    # Save metadata as JSON
                    json_filename = os.path.splitext(os.path.basename(filepath))[0] + '_metadata.json'
                    json_path = os.path.join(output_dir, json_filename)

                    with open(json_path, 'w', encoding='utf-8') as f:
                        json.dump(metadata, f, indent=2, ensure_ascii=False)

                    print(f"💾 Saved metadata: {json_path}")
                    successful += 1
                else:
                    print("⚠️  Failed to download image")
                    failed += 1
            else:
                print("⚠️  No image URL found")
                failed += 1

            # Rate limiting
            if idx < total:
                print(f"\n⏳ Waiting {delay}s...")
                time.sleep(delay)

        except Exception as e:
            print(f"\n❌ Error: {e}")
            import traceback
            traceback.print_exc()
            failed += 1
            time.sleep(delay)

    # Final summary
    print(f"\n{'='*60}")
    print(f"✅ Batch processing complete!")
    print(f"{'='*60}")
    print(f"   Total: {total}")
    print(f"   Successful: {successful}")
    print(f"   Failed: {failed}")
    print(f"   Output: {base_output_dir}")
    print(f"{'='*60}\n")

    # Show folders
    print("📁 Created folders:")
    for folder in sorted(os.listdir(base_output_dir)):
        folder_path = os.path.join(base_output_dir, folder)
        if os.path.isdir(folder_path):
            files = len([f for f in os.listdir(folder_path) if not f.startswith('.')])
            print(f"   {folder}/ ({files} files)")


def main():
    import argparse

    parser = argparse.ArgumentParser(
        description='Batch process Albert Kahn URLs - organize by location'
    )

    parser.add_argument(
        '--csv',
        default='countries_public_review.csv',
        help='CSV file path'
    )

    parser.add_argument(
        '--column',
        default='Archive planet',
        help='URL column name'
    )

    parser.add_argument(
        '--output',
        default='images_by_location',
        help='Output directory'
    )

    parser.add_argument(
        '--delay',
        type=float,
        default=3.0,
        help='Delay between requests (seconds)'
    )

    parser.add_argument(
        '--limit',
        type=int,
        help='Process only first N URLs (for testing)'
    )

    args = parser.parse_args()

    if not os.path.exists(args.csv):
        print(f"❌ File not found: {args.csv}")
        return 1

    # Count URLs
    url_count = 0
    with open(args.csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get(args.column, '').strip():
                url_count += 1
                if args.limit and url_count >= args.limit:
                    break

    print(f"\n📊 Preview:")
    print(f"   CSV: {args.csv}")
    print(f"   Column: '{args.column}'")
    print(f"   URLs to process: {url_count}")
    print(f"   Output: {args.output}")
    print(f"\n⚠️  This will download {url_count} images")
    print(f"   Estimated time: ~{url_count * args.delay / 60:.1f} minutes")

    response = input("\nContinue? [y/N]: ")
    if response.lower() not in ['y', 'yes']:
        print("Cancelled.")
        return 0

    try:
        process_csv(
            args.csv,
            args.column,
            args.output,
            args.delay,
            args.limit
        )
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
