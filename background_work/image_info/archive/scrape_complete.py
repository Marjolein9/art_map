#!/usr/bin/env python3
"""
Complete Albert Kahn Museum Scraper

Extracts ALL metadata and downloads the image from a single URL.
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from bs4 import BeautifulSoup
import requests
import json
import os
import re
from urllib.parse import urljoin, urlparse
import time
from pathlib import Path


def setup_driver(headless=True):
    """Setup Chrome WebDriver."""
    chrome_options = Options()
    if headless:
        chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--window-size=1920,1080')
    chrome_options.add_argument('user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')

    return webdriver.Chrome(options=chrome_options)


def extract_all_metadata(url):
    """
    Extract ALL metadata from the page in French.

    Returns:
        dict: Complete metadata with all available fields
    """
    print(f"🌐 Loading page: {url}")

    driver = setup_driver(headless=True)

    try:
        driver.get(url)

        # Wait for page to load
        print("⏳ Waiting for content to load...")
        time.sleep(3)  # Give JavaScript time to render

        # Initialize metadata with all fields
        metadata = {
            'page_url': url,
            'title': '',
            'location': '',
            'country': '',
            'author': '',
            'operator': '',
            'description': '',
            'mission': '',
            'theme': '',
            'sub_theme': '',
            'image_url': '',
            'license': '',
            'date': '',
            'inventory_number': '',
            'domain': '',
            'process': '',
            'support': '',
            'denomination': '',
            'format': '',
            'dimensions': '',
            'ownership': '',
            'collection': ''
        }

        # Get page HTML
        print("\n" + "="*60)
        print("📋 EXTRACTING METADATA")
        print("="*60)

        html = driver.page_source
        soup = BeautifulSoup(html, 'html.parser')

        # Extract title
        print("📝 Extracting title...")
        h1 = soup.find('h1')
        if h1:
            title_text = h1.get_text(strip=True)
            if title_text and title_text != '404':
                metadata['title'] = title_text
                print(f"   ✅ Title: {metadata['title']}")

        # Fallback: Extract title from URL slug if h1 not found
        if not metadata['title']:
            import re
            from urllib.parse import urlparse, unquote
            parsed = urlparse(url)
            path_parts = parsed.path.split('/')
            if len(path_parts) >= 3 and path_parts[1] == 'document':
                slug = path_parts[2]
                # Decode URL encoding and convert slug to title
                slug = unquote(slug)
                # Replace hyphens with spaces and capitalize
                title = slug.replace('-', ' ').strip()
                # Capitalize first letter of each word
                title = ' '.join(word.capitalize() for word in title.split())
                metadata['title'] = title
                print(f"   ✅ Title (from URL): {title}")

        # Extract metadata from label-field divs
        print("📋 Extracting metadata fields...")
        label_fields = soup.find_all('div', class_='label-field')

        for label_div in label_fields:
            label = label_div.get_text(strip=True).lower()
            next_elem = label_div.find_next_sibling()
            if not next_elem:
                continue

            value = next_elem.get_text(strip=True)

            # Match French labels to metadata fields
            if any(x in label for x in ['lieu', 'lieux']):
                metadata['location'] = value
                print(f"   ✅ Location: {value}")

                # Extract country from location
                if ',' in value:
                    parts = [p.strip() for p in value.split(',')]
                    if len(parts) > 0:
                        potential_country = parts[-1]
                        if potential_country and len(potential_country) > 2:
                            metadata['country'] = potential_country
                            print(f"   ✅ Country (from location): {potential_country}")

            elif 'pays' in label:
                metadata['country'] = value
                print(f"   ✅ Country: {value}")

            elif any(x in label for x in ['auteur', 'photographe', 'créateur']):
                metadata['author'] = value
                print(f"   ✅ Author: {value}")

            elif 'opérateur' in label:
                metadata['operator'] = value
                print(f"   ✅ Operator: {value}")

            elif any(x in label for x in ['description', 'résumé']):
                metadata['description'] = value

            elif 'mission' in label:
                metadata['mission'] = value
                print(f"   ✅ Mission: {value}")

            elif 'thème' in label and 'sous' not in label:
                if metadata.get('theme'):
                    metadata['theme'] += '; ' + value
                else:
                    metadata['theme'] = value
                print(f"   ✅ Theme: {value}")

            elif any(x in label for x in ['sous-thème', 'sous thème']):
                if metadata.get('sub_theme'):
                    metadata['sub_theme'] += '; ' + value
                else:
                    metadata['sub_theme'] = value
                print(f"   ✅ Sub-theme: {value}")

        # Extract image URL - find the largest image
        print("🖼️  Extracting image URL...")

        images = driver.find_elements(By.TAG_NAME, 'img')
        largest_img = None
        max_size = 0

        for img in images:
            src = img.get_attribute('src') or img.get_attribute('data-src')

            # Skip logos, icons, thumbnails
            if not src or any(x in src.lower() for x in ['logo', 'icon', 'thumb', 'favicon']):
                continue

            # Look for "big" or "large" in URL (common pattern)
            if 'big' in src or 'large' in src or 'original' in src:
                largest_img = src
                break

            # Otherwise track by size
            try:
                width = int(img.get_attribute('naturalWidth') or img.get_attribute('width') or 0)
                height = int(img.get_attribute('naturalHeight') or img.get_attribute('height') or 0)
                size = width * height

                if size > max_size:
                    max_size = size
                    largest_img = src
            except:
                if not largest_img:
                    largest_img = src

        if largest_img:
            metadata['image_url'] = urljoin(url, largest_img)
            print(f"   ✅ Image: {metadata['image_url']}")

        # Extract language-independent fields (license, date, inventory, etc.)
        print("📋 Extracting language-independent metadata...")

        label_fields = soup.find_all('div', class_='label-field')

        for label_div in label_fields:
            label = label_div.get_text(strip=True).lower()
            next_elem = label_div.find_next_sibling()
            if not next_elem:
                continue

            value = next_elem.get_text(strip=True)

            # Only extract language-independent fields here
            if 'licence' in label or 'license' in label:
                metadata['license'] = value
                print(f"   ✅ License: {value}")

            elif 'date' in label:
                metadata['date'] = value
                print(f"   ✅ Date: {value}")

            elif any(x in label for x in ['numéro d\'inventaire', 'inventaire', 'inventory']):
                metadata['inventory_number'] = value
                print(f"   ✅ Inventory Number: {value}")

            elif 'domaine' in label or 'domain' in label:
                metadata['domain'] = value
                print(f"   ✅ Domain: {value}")

            elif 'procédé' in label or 'procede' in label or 'process' in label:
                metadata['process'] = value
                print(f"   ✅ Process: {value}")

            elif 'support' in label:
                metadata['support'] = value
                print(f"   ✅ Support: {value}")

            elif 'dénomination' in label or 'denomination' in label:
                metadata['denomination'] = value
                print(f"   ✅ Denomination: {value}")

            elif 'format d\'origine' in label or 'format' in label:
                metadata['format'] = value
                print(f"   ✅ Format: {value}")

            elif 'dimension' in label:
                metadata['dimensions'] = value
                print(f"   ✅ Dimensions: {value}")

            elif 'appartenance' in label or 'ownership' in label:
                metadata['ownership'] = value
                print(f"   ✅ Ownership: {value}")

        return metadata

    finally:
        driver.quit()


def clean_filename(text):
    """Create a safe filename from text."""
    text = re.sub(r'[^\w\s-]', '', text)
    text = text.replace(' ', '_')
    text = re.sub(r'_+', '_', text)
    if len(text) > 100:
        text = text[:100]
    return text.strip('_')


def download_image(image_url, output_dir='images', filename=None):
    """Download an image from a URL."""
    if not image_url:
        print("❌ No image URL provided")
        return None

    Path(output_dir).mkdir(parents=True, exist_ok=True)

    print(f"📥 Downloading image...")

    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Referer': 'https://collections.albert-kahn.hauts-de-seine.fr/'
    }

    response = requests.get(image_url, headers=headers, stream=True)
    response.raise_for_status()

    if not filename:
        parsed_url = urlparse(image_url)
        path = parsed_url.path
        ext = os.path.splitext(path)[1]

        if not ext or ext not in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
            content_type = response.headers.get('content-type', '')
            ext_map = {
                'image/jpeg': '.jpg',
                'image/jpg': '.jpg',
                'image/png': '.png',
                'image/gif': '.gif',
                'image/webp': '.webp'
            }
            ext = ext_map.get(content_type, '.jpg')

        filename = f"image_{os.path.basename(path).split('.')[0]}{ext}"

    filename = clean_filename(os.path.splitext(filename)[0]) + os.path.splitext(filename)[1]
    filepath = os.path.join(output_dir, filename)

    with open(filepath, 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)

    file_size = os.path.getsize(filepath) / 1024
    print(f"✅ Saved image: {filepath} ({file_size:.1f} KB)")
    return filepath


def scrape_url(url, output_dir='images', download=True):
    """
    Complete scraping: extract ALL metadata and download image.

    Args:
        url: URL to scrape
        output_dir: Directory to save image
        download: Whether to download the image

    Returns:
        dict: Complete metadata with downloaded_path if download=True
    """
    print("="*60)
    print("🚀 Starting complete scrape")
    print("="*60)
    print()

    # Extract metadata
    metadata = extract_all_metadata(url)

    # Download image if requested
    if download and metadata['image_url']:
        # Generate filename from title
        if metadata['title']:
            base_filename = clean_filename(metadata['title'])
            ext = os.path.splitext(urlparse(metadata['image_url']).path)[1]
            if not ext:
                ext = '.jpg'
            filename = f"{base_filename}{ext}"
        else:
            filename = None

        filepath = download_image(metadata['image_url'], output_dir, filename)
        if filepath:
            metadata['downloaded_filename'] = os.path.basename(filepath)
            metadata['downloaded_path'] = filepath

    print()
    print("="*60)
    print("✅ Complete!")
    print("="*60)
    print()
    print("📊 Extracted Metadata:")
    for key, value in metadata.items():
        if value:
            print(f"   {key}: {value}")

    return metadata


if __name__ == '__main__':
    import sys

    if len(sys.argv) < 2:
        print("Usage: python scrape_complete.py <url> [output_dir]")
        sys.exit(1)

    url = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else 'images'

    result = scrape_url(url, output_dir)

    # Save to JSON
    import json
    json_path = os.path.join(output_dir, 'metadata.json')
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    print(f"\n💾 Metadata saved to: {json_path}")
