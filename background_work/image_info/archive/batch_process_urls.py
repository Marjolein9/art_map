#!/usr/bin/env python3
"""
Batch Process URLs from CSV - Simple URL list format
"""

import csv
import os
import sys
import time
from pathlib import Path
from scrape_complete import extract_all_metadata, download_image, clean_filename
import json


def process_url_csv(
    csv_path='archive_url.csv',
    base_output_dir='images_by_location',
    delay=3
):
    """
    Process CSV file with URLs in first column.
    """
    print(f"📁 Loading CSV: {csv_path}")

    # Read URLs from CSV (first column only)
    urls = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        for row in reader:
            if row and row[0].strip():
                url = row[0].strip()
                # Skip header row if exists
                if url.startswith('http'):
                    urls.append(url)

    print(f"\n🔍 Found {len(urls)} URLs to process")

    if len(urls) == 0:
        print("❌ No URLs to process")
        return

    # Create base output directory
    Path(base_output_dir).mkdir(parents=True, exist_ok=True)

    # Process each URL
    total = len(urls)
    successful = 0
    failed = 0

    print(f"\n🚀 Starting batch processing...")
    print(f"   Base directory: {base_output_dir}")
    print(f"   Delay between requests: {delay}s\n")

    for idx, url in enumerate(urls, 1):
        print(f"\n{'='*60}")
        print(f"[{idx}/{total}] Processing URL")
        print(f"{'='*60}")
        print(f"URL: {url[:80]}...")

        try:
            # Extract metadata
            print("\n🌐 Scraping metadata...")
            metadata = extract_all_metadata(url)

            # Get location for folder name (try multiple fields)
            location = (
                metadata.get('location') or
                metadata.get('country') or
                metadata.get('mission', '').split('-')[0].strip() or
                'Unknown'
            )

            # Clean location for folder name
            import re
            folder_name = re.sub(r'[^\w\s-]', '', location)
            folder_name = folder_name.replace(' ', '_')
            folder_name = re.sub(r'_+', '_', folder_name)
            if len(folder_name) > 50:
                folder_name = folder_name[:50]
            folder_name = folder_name.strip('_') or 'Unknown_Location'

            output_dir = os.path.join(base_output_dir, folder_name)

            print(f"\n📂 Creating folder: {output_dir}")
            Path(output_dir).mkdir(parents=True, exist_ok=True)

            # Download image
            if metadata.get('image_url'):
                # Generate filename from title or use default
                if metadata.get('title') and metadata['title'] != '404':
                    base_fn = clean_filename(metadata['title'])
                    ext = os.path.splitext(metadata['image_url'])[1] or '.jpg'
                    filename = f"{base_fn}{ext}"
                else:
                    # Use inventory number or timestamp
                    if metadata.get('inventory_number'):
                        base_fn = clean_filename(metadata['inventory_number'])
                    else:
                        base_fn = f"image_{idx}"
                    ext = os.path.splitext(metadata['image_url'])[1] or '.jpg'
                    filename = f"{base_fn}{ext}"

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
    folders = {}
    for folder in sorted(os.listdir(base_output_dir)):
        folder_path = os.path.join(base_output_dir, folder)
        if os.path.isdir(folder_path):
            files = len([f for f in os.listdir(folder_path) if not f.startswith('.')])
            folders[folder] = files
            print(f"   {folder}/ ({files} files)")

    return successful, failed, folders


def main():
    import argparse

    parser = argparse.ArgumentParser(
        description='Batch process URLs from CSV file'
    )

    parser.add_argument(
        '--csv',
        default='archive_url.csv',
        help='CSV file path (URLs in first column)'
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
        '-y', '--yes',
        action='store_true',
        help='Skip confirmation prompt'
    )

    args = parser.parse_args()

    if not os.path.exists(args.csv):
        print(f"❌ File not found: {args.csv}")
        return 1

    # Count URLs
    url_count = 0
    with open(args.csv, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        for row in reader:
            if row and row[0].strip() and row[0].strip().startswith('http'):
                url_count += 1

    print(f"\n📊 Preview:")
    print(f"   CSV: {args.csv}")
    print(f"   URLs to process: {url_count}")
    print(f"   Output: {args.output}")
    print(f"\n⚠️  This will download {url_count} images")
    print(f"   Estimated time: ~{url_count * args.delay / 60:.1f} minutes")

    if not args.yes:
        response = input("\nContinue? [y/N]: ")
        if response.lower() not in ['y', 'yes']:
            print("Cancelled.")
            return 0
    else:
        print("\n✅ Auto-confirmed (--yes flag)")
        print()

    try:
        process_url_csv(
            args.csv,
            args.output,
            args.delay
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
