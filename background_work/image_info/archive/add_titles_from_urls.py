#!/usr/bin/env python3
"""
Add titles to existing metadata JSON files by extracting from URL slugs
"""

import json
import os
from pathlib import Path
from urllib.parse import urlparse, unquote


def extract_title_from_url(url):
    """
    Extract title from URL slug.

    Example:
    URL: https://collections.albert-kahn.../document/combattant-druze-des-forces-arabes/...
    Returns: "Combattant Druze Des Forces Arabes"
    """
    parsed = urlparse(url)
    path_parts = parsed.path.split('/')

    if len(path_parts) >= 3 and path_parts[1] == 'document':
        slug = path_parts[2]
        # Decode URL encoding
        slug = unquote(slug)
        # Replace hyphens with spaces
        title = slug.replace('-', ' ').strip()
        # Capitalize first letter of each word
        title = ' '.join(word.capitalize() for word in title.split())
        return title

    return ""


def update_json_files(base_dir='images_by_location'):
    """
    Update all metadata JSON files with titles extracted from URLs.
    """
    print(f"🔍 Searching for JSON files in: {base_dir}")

    # Find all metadata JSON files
    json_files = list(Path(base_dir).rglob('*_metadata.json'))

    print(f"📊 Found {len(json_files)} JSON files to update\n")

    updated = 0
    skipped = 0
    errors = 0

    for json_path in json_files:
        try:
            # Read JSON file
            with open(json_path, 'r', encoding='utf-8') as f:
                metadata = json.load(f)

            # Check if title is missing or empty
            current_title = metadata.get('title', '')

            if not current_title or current_title == '404':
                # Extract title from URL
                page_url = metadata.get('page_url', '')
                if page_url:
                    new_title = extract_title_from_url(page_url)

                    if new_title:
                        metadata['title'] = new_title

                        # Save updated JSON
                        with open(json_path, 'w', encoding='utf-8') as f:
                            json.dump(metadata, f, indent=2, ensure_ascii=False)

                        print(f"✅ Updated: {json_path.name}")
                        print(f"   Title: {new_title}")
                        updated += 1
                    else:
                        print(f"⚠️  Could not extract title from URL: {json_path.name}")
                        skipped += 1
                else:
                    print(f"⚠️  No page_url found: {json_path.name}")
                    skipped += 1
            else:
                print(f"⏭️  Already has title: {json_path.name} - '{current_title}'")
                skipped += 1

        except Exception as e:
            print(f"❌ Error processing {json_path.name}: {e}")
            errors += 1

    # Summary
    print(f"\n{'='*60}")
    print(f"✅ Summary:")
    print(f"{'='*60}")
    print(f"   Updated: {updated}")
    print(f"   Skipped: {skipped}")
    print(f"   Errors: {errors}")
    print(f"   Total: {len(json_files)}")
    print(f"{'='*60}\n")


def main():
    import argparse

    parser = argparse.ArgumentParser(
        description='Add titles to metadata JSON files from URL slugs'
    )

    parser.add_argument(
        '--dir',
        default='images_by_location',
        help='Base directory containing metadata JSON files'
    )

    args = parser.parse_args()

    if not os.path.exists(args.dir):
        print(f"❌ Directory not found: {args.dir}")
        return 1

    update_json_files(args.dir)
    return 0


if __name__ == '__main__':
    exit(main())
