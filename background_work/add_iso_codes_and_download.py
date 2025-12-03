import csv
import json
import requests
import os
from pathlib import Path
import time
import hashlib
import pycountry
from urllib.parse import unquote, quote
import re

def get_iso3_code(country_name):
    """Get ISO3 code for a country using pycountry"""
    try:
        # Try exact match first
        country = pycountry.countries.get(name=country_name)
        if country:
            return country.alpha_3

        # Try fuzzy search
        country = pycountry.countries.search_fuzzy(country_name)
        if country:
            return country[0].alpha_3
    except (AttributeError, LookupError):
        pass

    # Manual mappings for special cases
    special_cases = {
        "North Korea": "PRK",
        "South Korea": "KOR",
        "Russia": "RUS",
        "Syria": "SYR",
        "Iran": "IRN",
        "Venezuela": "VEN",
        "Bolivia": "BOL",
        "Tanzania": "TZA",
        "Democratic Republic of the Congo": "COD",
        "Republic of the Congo": "COG",
        "Ivory Coast": "CIV",
        "Laos": "LAO",
        "Vietnam": "VNM"
    }

    return special_cases.get(country_name, "UNK")

def is_flickr_url(url):
    """Check if URL is from Flickr"""
    return 'flickr.com' in url.lower()

def extract_flickr_image_url(flickr_url):
    """Extract the direct image URL from a Flickr page"""
    try:
        # Extract photo ID from Flickr URL
        match = re.search(r'flickr\.com/photos/[^/]+/(\d+)', flickr_url)
        if not match:
            print(f"  ✗ Could not extract photo ID from {flickr_url}")
            return flickr_url

        photo_id = match.group(1)

        # Flickr has a direct URL pattern for images
        # Try to fetch the page and extract the actual image URL
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }

        response = requests.get(flickr_url, headers=headers, timeout=10)
        response.raise_for_status()

        # Look for the og:image meta tag which contains the direct image URL
        match = re.search(r'<meta property="og:image" content="([^"]+)"', response.text)
        if match:
            image_url = match.group(1)
            print(f"  ✓ Extracted Flickr image URL")
            return image_url

        print(f"  ✗ Could not extract image from Flickr page")
        return flickr_url

    except Exception as e:
        print(f"  ✗ Error extracting Flickr URL: {e}")
        return flickr_url

def is_wikimedia_commons_url(url):
    """Check if URL is from Wikimedia Commons"""
    return 'commons.wikimedia.org' in url.lower()

def extract_wikimedia_image_url(wiki_url):
    """Extract the actual image URL from a Wikimedia Commons wiki page"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }

        filename = None

        # Try to get the filename from the URL - handle both /File: and /Special:FilePath/
        if '/File:' in wiki_url or '/file:' in wiki_url:
            # Extract filename from URL like /wiki/File:filename.jpg
            match = re.search(r'/[Ff]ile:([^?#]+)', wiki_url)
            if match:
                filename = unquote(match.group(1))
        elif '/Special:FilePath/' in wiki_url or '/special:filepath/' in wiki_url:
            # Extract filename from URL like /wiki/Special:FilePath/filename.jpg
            match = re.search(r'/[Ss]pecial:[Ff]ile[Pp]ath/([^?#]+)', wiki_url)
            if match:
                filename = unquote(match.group(1))

        if filename:
            # Use Wikimedia Commons API to get the actual image URL
            api_url = 'https://commons.wikimedia.org/w/api.php'
            params = {
                'action': 'query',
                'titles': f'File:{filename}',
                'prop': 'imageinfo',
                'iiprop': 'url',
                'format': 'json'
            }

            response = requests.get(api_url, params=params, headers=headers, timeout=10)
            response.raise_for_status()
            data = response.json()

            # Extract image URL from response
            pages = data.get('query', {}).get('pages', {})
            for page_id, page_data in pages.items():
                if page_id != '-1':  # -1 means page not found
                    imageinfo = page_data.get('imageinfo', [])
                    if imageinfo and len(imageinfo) > 0:
                        image_url = imageinfo[0].get('url')
                        if image_url:
                            print(f"  ✓ Extracted Wikimedia image URL")
                            return image_url

        print(f"  ✗ Could not extract image URL from {wiki_url}")
        return wiki_url  # Return original if extraction fails

    except Exception as e:
        print(f"  ✗ Error extracting Wikimedia URL: {e}")
        return wiki_url  # Return original URL if extraction fails

def download_image(url, country, artist_name, work_title, images_dir):
    """Download an image and return the local filename"""
    try:
        # Create a unique filename based on URL hash
        url_hash = hashlib.md5(url.encode()).hexdigest()[:12]
        # Sanitize names for filename
        safe_country = "".join(c for c in country if c.isalnum() or c in (' ', '-', '_')).strip()
        safe_artist = "".join(c for c in artist_name if c.isalnum() or c in (' ', '-', '_')).strip()[:30]

        # Get file extension from URL
        ext = '.jpg'  # default
        if '.' in url.split('/')[-1]:
            ext = '.' + url.split('/')[-1].split('.')[-1].split('?')[0]
            if ext not in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
                ext = '.jpg'

        filename = f"{safe_country}_{safe_artist}_{url_hash}{ext}"
        filepath = images_dir / filename

        # Skip if already downloaded
        if filepath.exists():
            print(f"  ✓ Already downloaded: {filename}")
            return filename

        # Download image
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()

        # Save image
        with open(filepath, 'wb') as f:
            f.write(response.content)

        print(f"  ✓ Downloaded: {filename}")
        return filename

    except Exception as e:
        print(f"  ✗ Failed to download {url}: {e}")
        return None

def main():
    # Create images directory
    images_dir = Path('artwork_images')
    images_dir.mkdir(exist_ok=True)

    print("Adding ISO3 codes and downloading images...")
    print(f"Images will be saved to: {images_dir.absolute()}\n")

    # Read combined CSV
    input_file = 'children_combined_here.csv'
    output_file = 'children_combined_with_iso3.csv'

    artists = []

    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()

        # Skip first line if it's not a proper header
        start_line = 0
        if lines and not lines[0].strip().startswith('artist_name'):
            start_line = 1

        # Read from the header line onwards
        reader = csv.DictReader(lines[start_line:])
        for row in reader:
            # Only include rows that have country and either artist_name or work_url
            if row.get('country', '').strip() and (row.get('artist_name', '').strip() or row.get('work_url', '').strip()):
                artists.append(row)

    print(f"Loaded {len(artists)} artworks (filtered from empty rows)")

    # Count Flickr and Wikimedia URLs
    flickr_count = sum(1 for a in artists if a.get('work_url') and is_flickr_url(a['work_url']))
    wikimedia_count = sum(1 for a in artists if a.get('work_url') and is_wikimedia_commons_url(a['work_url']))
    print(f"Found {flickr_count} Flickr URLs that need processing")
    print(f"Found {wikimedia_count} Wikimedia Commons URLs that need processing")

    print("\nExtracting image URLs from Flickr and Wikimedia Commons...")

    for i, artist in enumerate(artists, 1):
        country = artist['country']

        # Get ISO3 code using pycountry
        iso3 = get_iso3_code(country)
        artist['iso3'] = iso3

        work_url = artist.get('work_url', '')

        # Handle different URL types
        if work_url and is_flickr_url(work_url):
            # Extract actual image URL from Flickr page
            print(f"[{i}/{len(artists)}] Extracting Flickr: {country} - {artist['artist_name']}")
            actual_image_url = extract_flickr_image_url(work_url)
            artist['image_path'] = actual_image_url
            artist['is_local'] = 'false'

            # Be respectful - small delay between requests
            if i % 10 == 0:
                time.sleep(0.5)

        elif work_url and is_wikimedia_commons_url(work_url):
            # Extract actual image URL from Wikimedia Commons wiki page
            print(f"[{i}/{len(artists)}] Extracting Wikimedia: {country} - {artist['artist_name']}")
            actual_image_url = extract_wikimedia_image_url(work_url)
            artist['image_path'] = actual_image_url
            artist['is_local'] = 'false'

            # Be respectful - small delay between API calls
            if i % 10 == 0:
                time.sleep(0.5)

        elif work_url:
            # Other images: just use the URL
            artist['image_path'] = work_url
            artist['is_local'] = 'false'
        else:
            artist['image_path'] = ''
            artist['is_local'] = 'false'

    # Save updated CSV - preserve all original columns plus new ones
    if artists:
        # Get all unique fieldnames from the data
        original_fieldnames = list(artists[0].keys())
        # Add new fields if they don't exist
        for field in ['iso3', 'image_path', 'is_local']:
            if field not in original_fieldnames:
                original_fieldnames.append(field)

        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=original_fieldnames)
            writer.writeheader()
            writer.writerows(artists)

    print(f"\n✓ Saved {output_file}")

    # Also save as JSON
    json_file = 'children_combined_with_iso3.json'
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(artists, f, ensure_ascii=False, indent=2)

    print(f"✓ Saved {json_file}")

    # Print statistics
    countries_with_iso3 = sum(1 for a in artists if a['iso3'] != 'UNK')
    images_flickr = sum(1 for a in artists if a.get('work_url') and is_flickr_url(a.get('work_url', '')))
    images_wikimedia = sum(1 for a in artists if a.get('work_url') and is_wikimedia_commons_url(a.get('work_url', '')))
    total_with_images = sum(1 for a in artists if a.get('image_path', ''))

    print(f"\n✓ Total artworks: {len(artists)}")
    print(f"✓ Countries with ISO3 codes: {countries_with_iso3}/{len(artists)}")
    print(f"✓ Flickr URLs processed: {images_flickr}")
    print(f"✓ Wikimedia Commons URLs processed: {images_wikimedia}")
    print(f"✓ Total with image paths: {total_with_images}")

    # List countries without ISO3 codes
    unknown_countries = set(a['country'] for a in artists if a['iso3'] == 'UNK')
    if unknown_countries:
        print(f"\n⚠️  Countries without ISO3 codes: {', '.join(sorted(unknown_countries))}")

if __name__ == "__main__":
    main()
