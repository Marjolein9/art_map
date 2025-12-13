#!/usr/bin/env python3
"""
Database initialization script
Reads UN M49 country data and artworks CSV to populate the database
Run this whenever data is updated: python3 init_database.py
"""

import sqlite3
import csv
import json
import os
import requests
import time
import shutil
from urllib.parse import urlparse, unquote
from pathlib import Path
from PIL import Image
from config import (
    DATABASE_PATH,
    M49_JSON_PATH,
    EXPORTS_DIR,
    BORDERS_CSV_PATH,
    ALBERT_KAHN_CSV_PATH,
    CHILDREN_ARTWORK_CSV_PATH,
    PUBLIC_DOMAIN_CSV_PATH,
    MET_METADATA_CSV_PATH
)

# UN M49 Region code to continent name
REGION_NAMES = {
    2: "Africa",
    9: "Oceania",
    19: "Americas",
    142: "Asia",
    150: "Europe"
}

# UN M49 SubRegion codes to subregion names
SUBREGION_NAMES = {
    # Africa subregions
    15: "North Africa",
    11: "West Africa",
    17: "Middle Africa",
    14: "East Africa",
    18: "Southern Africa",
    202: "Southern Africa",  # Sub-Saharan Africa (map to Southern)

    # Asia subregions
    143: "Central Asia",
    30: "East Asia",
    34: "South Asia",
    35: "Southeast Asia",
    145: "Middle East",  # Western Asia

    # Europe subregions
    151: "Eastern Europe",
    154: "Northern Europe",
    39: "Southern Europe",
    155: "Western Europe",

    # Americas subregions
    29: "Caribbean",
    13: "Central America",
    5: "South America",
    21: "North America",
    419: "Caribbean",  # Latin America and the Caribbean

    # Oceania subregions
    53: "Oceania",  # Australia and New Zealand
    54: "Oceania",  # Melanesia
    57: "Oceania",  # Micronesia
    61: "Oceania",  # Polynesia
}

# Image processing configuration
MAX_IMAGE_SIZE_MB = 1
MAX_DIMENSION = 1200
JPEG_QUALITY = 85

def get_file_size_mb(filepath):
    """Get file size in megabytes."""
    return os.path.getsize(filepath) / (1024 * 1024)

def check_image_exists(filepath):
    """
    Check if an image file exists, also checking for .jpg version if path ends in .webp

    Args:
        filepath: Relative or absolute path to check

    Returns:
        Tuple of (exists, actual_path) where actual_path may differ from input if webp->jpg conversion happened
    """
    if os.path.exists(filepath):
        return True, filepath

    # If path ends in .webp, also check for .jpg version
    if filepath.lower().endswith('.webp'):
        jpg_path = filepath[:-5] + '.jpg'  # Replace .webp with .jpg
        if os.path.exists(jpg_path):
            return True, jpg_path

    return False, filepath

def process_image(filepath):
    """
    Process an image file:
    - Convert webp to jpeg (deletes original webp)
    - Resize if > 1MB
    - Convert RGBA to RGB

    Args:
        filepath: Full path to image file

    Returns:
        New filepath (jpg) if format changed, or original filepath
    """
    try:
        original_filepath = filepath
        original_size = get_file_size_mb(filepath)

        # Open image
        img = Image.open(filepath)
        needs_save = False
        format_changed = False

        # Convert webp to jpeg
        if filepath.lower().endswith('.webp'):
            print(f"  🔄 Converting webp to jpeg: {os.path.basename(filepath)}")
            new_filepath = filepath[:-5] + '.jpg'  # Remove .webp, add .jpg
            filepath = new_filepath
            format_changed = True
            needs_save = True

        # Check if needs resizing
        width, height = img.size
        if original_size > MAX_IMAGE_SIZE_MB or width > MAX_DIMENSION or height > MAX_DIMENSION:
            print(f"  ↕️ Resizing image: {original_size:.2f}MB / {width}x{height}px")

            # Calculate new dimensions
            if width > height:
                if width > MAX_DIMENSION:
                    new_width = MAX_DIMENSION
                    new_height = int((MAX_DIMENSION / width) * height)
                else:
                    new_width, new_height = width, height
            else:
                if height > MAX_DIMENSION:
                    new_height = MAX_DIMENSION
                    new_width = int((MAX_DIMENSION / height) * width)
                else:
                    new_width, new_height = width, height

            if new_width != width or new_height != height:
                img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
                needs_save = True

        # Convert RGBA to RGB if saving as JPEG
        if img.mode == 'RGBA':
            background = Image.new('RGB', img.size, (255, 255, 255))
            background.paste(img, mask=img.split()[3])
            img = background
            needs_save = True
        elif img.mode != 'RGB':
            img = img.convert('RGB')
            needs_save = True

        # Save if any changes were made
        if needs_save:
            img.save(filepath, 'JPEG', quality=JPEG_QUALITY, optimize=True)
            new_size = get_file_size_mb(filepath)
            print(f"  ✅ Processed: {new_size:.2f}MB")

            # Delete original webp file after conversion
            if format_changed and os.path.exists(original_filepath):
                os.remove(original_filepath)
                print(f"  🗑️  Deleted webp file: {os.path.basename(original_filepath)}")

        return filepath

    except Exception as e:
        print(f"  ❌ Error processing image {filepath}: {e}")
        return filepath  # Return original path on error

def copy_local_image(local_path, iso3, collection_type):
    """
    Copy a local image file to the correct folder structure.

    Args:
        local_path: Local file path (e.g., /Users/.../image.jpg)
        iso3: Country ISO3 code
        collection_type: Collection type ('albert_kahn', 'children_artwork', or 'public_domain')

    Returns:
        Relative filepath (e.g., 'images/USA/children_artwork/image.jpg') or None if copy fails
    """
    if not local_path or not os.path.exists(local_path):
        print(f"  ⚠️  Local file does not exist: {local_path}")
        return None

    try:
        # Get filename from path
        filename = os.path.basename(local_path)

        # If no filename could be determined, skip
        if not filename or filename == '':
            print(f"  ⚠️  Could not determine filename from path: {local_path}")
            return None

        # Create directory structure: images/{ISO3}/{collection_type}/
        base_dir = os.path.dirname(os.path.abspath(__file__))
        image_dir = os.path.join(base_dir, 'images', iso3, collection_type)
        os.makedirs(image_dir, exist_ok=True)

        # Full path for saving
        filepath_full = os.path.join(image_dir, filename)

        # Check if file already exists at destination
        if not os.path.exists(filepath_full):
            # Copy the file
            print(f"  📋 Copying local file: {filename}")
            shutil.copy2(local_path, filepath_full)
            print(f"  ✅ Copied: {filename}")
        else:
            print(f"  ✅ File already exists: {filename}")

        # Process image (convert webp, resize if needed)
        processed_filepath = process_image(filepath_full)

        # Get final filename (may have changed from .webp to .jpg)
        final_filename = os.path.basename(processed_filepath)

        # Return relative path
        return f"images/{iso3}/{collection_type}/{final_filename}"

    except Exception as e:
        print(f"  ❌ Error copying {local_path}: {e}")
        return None

def download_image(url, iso3, collection_type, suggested_filename=None):
    """
    Download an image from URL and save it to the correct folder structure.

    Args:
        url: URL of the image to download
        iso3: Country ISO3 code
        collection_type: Collection type ('albert_kahn', 'children_artwork', or 'public_domain')
        suggested_filename: Optional filename to use (will extract from URL if not provided)

    Returns:
        Relative filepath (e.g., 'images/USA/public_domain/image.jpg') or None if download fails
    """
    if not url or url.startswith('http') == False:
        return None

    try:
        # Get filename from URL or use suggested filename
        # Check if suggested_filename is actually a URL (not a filename)
        if suggested_filename and not suggested_filename.startswith('http'):
            filename = suggested_filename
        else:
            parsed_url = urlparse(url)
            filename = unquote(os.path.basename(parsed_url.path))

        # If no filename could be determined, skip
        if not filename or filename == '':
            print(f"  ⚠️  Could not determine filename from URL: {url}")
            return None

        # Create directory structure: images/{ISO3}/{collection_type}/
        base_dir = os.path.dirname(os.path.abspath(__file__))
        image_dir = os.path.join(base_dir, 'images', iso3, collection_type)
        os.makedirs(image_dir, exist_ok=True)

        # Full path for saving
        filepath_full = os.path.join(image_dir, filename)

        # Check if file already exists
        if not os.path.exists(filepath_full):
            # Download the image
            print(f"  📥 Downloading: {filename}")
            response = requests.get(url, timeout=30, headers={
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            })
            response.raise_for_status()

            # Save to file
            with open(filepath_full, 'wb') as f:
                f.write(response.content)

            print(f"  ✅ Saved: {filename}")

            # Brief delay to be respectful to servers
            time.sleep(0.5)
        else:
            print(f"  ✅ File already exists: {filename}")

        # Process image (convert webp, resize if needed)
        processed_filepath = process_image(filepath_full)

        # Get final filename (may have changed from .webp to .jpg)
        final_filename = os.path.basename(processed_filepath)

        # Return relative path
        return f"images/{iso3}/{collection_type}/{final_filename}"

    except requests.RequestException as e:
        print(f"  ❌ Failed to download {url}: {e}")
        return None
    except Exception as e:
        print(f"  ❌ Error processing {url}: {e}")
        return None

def load_m49_data():
    """Load and parse UN M49 country data"""
    print(f"📥 Loading UN M49 data from: {M49_JSON_PATH}")

    with open(M49_JSON_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    countries = []

    for country in data['countries']:
        alpha3 = country.get('alpha3')
        if not alpha3:
            continue

        region_code = country.get('region')
        subregion_code = country.get('subRegion')
        intermediate_code = country.get('intermediateRegion')

        # Get continent name
        continent = REGION_NAMES.get(region_code, 'World')

        # For Africa, prefer intermediateRegion if it exists (more specific)
        if continent == 'Africa' and intermediate_code:
            subregion = SUBREGION_NAMES.get(intermediate_code, continent)
        else:
            subregion = SUBREGION_NAMES.get(subregion_code, continent)

        countries.append({
            'iso3': alpha3,
            'iso2': country.get('alpha2', ''),
            'name': country.get('name', ''),
            'm49': country.get('m49code', ''),
            'continent': continent,
            'subregion': subregion
        })

    print(f"✅ Loaded {len(countries)} countries from UN M49 data")
    return countries

def load_borders_data(m49_countries):
    """Load country borders and map ISO2 to ISO3 and M49 codes"""
    print(f"📥 Loading country borders from: {BORDERS_CSV_PATH}")

    # Create ISO2 -> {ISO3, M49} mapping from M49 data
    iso2_to_country = {}
    for country in m49_countries:
        if country['iso2']:
            iso2_to_country[country['iso2']] = {
                'iso3': country['iso3'],
                'm49': country['m49']
            }

    borders = []
    skipped = set()

    with open(BORDERS_CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        for row in reader:
            country_iso2 = row.get('country_code', '').strip()
            border_iso2 = row.get('country_border_code', '').strip()

            # Skip empty borders (islands, etc.)
            if not country_iso2 or not border_iso2:
                continue

            # Convert ISO2 to ISO3 and M49
            country_data = iso2_to_country.get(country_iso2)
            border_data = iso2_to_country.get(border_iso2)

            if not country_data or not border_data:
                if country_iso2 and border_iso2:
                    skipped.add(f"{country_iso2}->{border_iso2}")
                continue

            borders.append({
                'country_iso3': country_data['iso3'],
                'country_m49': country_data['m49'],
                'neighbor_iso3': border_data['iso3'],
                'neighbor_m49': border_data['m49']
            })

    if skipped:
        print(f"⚠️  Skipped {len(skipped)} border mappings (ISO2 not found in M49)")

    print(f"✅ Loaded {len(borders)} border relationships")
    return borders

def export_table_to_csv(conn, table_name, output_dir):
    """Export a database table to CSV"""
    cursor = conn.cursor()

    # Get all data from table
    cursor.execute(f'SELECT * FROM {table_name}')
    rows = cursor.fetchall()

    if not rows:
        print(f"⚠️  Table {table_name} is empty, skipping export")
        return

    # Get column names
    cursor.execute(f'PRAGMA table_info({table_name})')
    columns = [col[1] for col in cursor.fetchall()]

    # Write to CSV
    output_path = os.path.join(output_dir, f'{table_name}.csv')
    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(columns)
        writer.writerows(rows)

    print(f"  📄 Exported {table_name}: {len(rows)} rows → {output_path}")

def init_database():
    """Initialize database from UN M49 and artworks CSV"""

    # Load UN M49 country data
    m49_countries = load_m49_data()

    # Load country borders data
    borders_data = load_borders_data(m49_countries)

    # Delete old database if exists
    if os.path.exists(DATABASE_PATH):
        print(f"🗑️  Deleting old database: {DATABASE_PATH}")
        os.remove(DATABASE_PATH)

    # Create new database
    print(f"📦 Creating new database: {DATABASE_PATH}")
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    # Create countries table
    print("🌍 Creating countries table...")
    cursor.execute('''
        CREATE TABLE countries (
            iso3 TEXT PRIMARY KEY,
            iso2 TEXT,
            name TEXT NOT NULL,
            m49 INTEGER,
            continent TEXT NOT NULL,
            subregion TEXT NOT NULL
        )
    ''')

    # Create albert_kahn_images table with ALL columns from CSV
    print("🖼️  Creating albert_kahn_images table...")
    cursor.execute('''
        CREATE TABLE albert_kahn_images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_path TEXT,
            image_filename TEXT,
            inventory_number TEXT,
            title_fr TEXT,
            title_en TEXT,
            location TEXT,
            country_fr TEXT,
            country_en TEXT,
            m49code INTEGER,
            alpha2 TEXT,
            alpha3 TEXT NOT NULL,
            operator TEXT,
            author TEXT,
            mission TEXT,
            date TEXT,
            theme TEXT,
            sub_theme TEXT,
            description TEXT,
            domain TEXT,
            process TEXT,
            support TEXT,
            denomination TEXT,
            format TEXT,
            dimensions TEXT,
            ownership TEXT,
            license TEXT,
            page_url TEXT,
            image_url TEXT,
            new_filepath TEXT,
            FOREIGN KEY (alpha3) REFERENCES countries(iso3)
        )
    ''')
    cursor.execute('CREATE INDEX idx_albert_kahn_alpha3 ON albert_kahn_images(alpha3)')

    # Create children_artwork_images table with ALL columns from CSV
    print("🎨 Creating children_artwork_images table...")
    cursor.execute('''
        CREATE TABLE children_artwork_images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            artist_name TEXT,
            author_wikilink TEXT,
            artist_nationality TEXT,
            iso3_artist TEXT NOT NULL,
            country_of_subject TEXT,
            iso3 TEXT,
            work_title TEXT,
            keep TEXT,
            image_path TEXT,
            work_url TEXT,
            location_reason TEXT,
            author_background TEXT,
            birth_date TEXT,
            death_date TEXT,
            birth_place TEXT,
            source TEXT,
            tags TEXT,
            more_info TEXT,
            is_local TEXT,
            filepath TEXT,
            FOREIGN KEY (iso3_artist) REFERENCES countries(iso3)
        )
    ''')
    cursor.execute('CREATE INDEX idx_children_artwork_iso3_artist ON children_artwork_images(iso3_artist)')

    # Create public_domain_images table with ALL columns from CSV
    print("📚 Creating public_domain_images table...")
    cursor.execute('''
        CREATE TABLE public_domain_images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            public_domain_url TEXT,
            public_domain_title TEXT,
            image_info TEXT,
            source_link TEXT,
            country TEXT,
            alpha_code TEXT NOT NULL,
            filename TEXT,
            remove TEXT,
            filepath TEXT,
            FOREIGN KEY (alpha_code) REFERENCES countries(iso3)
        )
    ''')
    cursor.execute('CREATE INDEX idx_public_domain_alpha_code ON public_domain_images(alpha_code)')

    # Create met_images table
    print("🏛️  Creating met_images table...")
    cursor.execute('''
        CREATE TABLE met_images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            object_id TEXT NOT NULL,
            alpha3 TEXT NOT NULL,
            country_name TEXT,
            title TEXT,
            artist_name TEXT,
            object_date TEXT,
            medium TEXT,
            department TEXT,
            culture TEXT,
            object_url TEXT,
            primary_image_url TEXT,
            filepath TEXT,
            json_file TEXT,
            FOREIGN KEY (alpha3) REFERENCES countries(iso3)
        )
    ''')
    cursor.execute('CREATE INDEX idx_met_alpha3 ON met_images(alpha3)')

    # Create country_borders table
    print("🗺️  Creating country_borders table...")
    cursor.execute('''
        CREATE TABLE country_borders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            country_iso3 TEXT NOT NULL,
            country_m49 INTEGER,
            neighbor_iso3 TEXT NOT NULL,
            neighbor_m49 INTEGER,
            FOREIGN KEY (country_iso3) REFERENCES countries(iso3),
            FOREIGN KEY (neighbor_iso3) REFERENCES countries(iso3)
        )
    ''')

    # Create indexes for faster neighbor lookups
    cursor.execute('CREATE INDEX idx_borders_country_iso3 ON country_borders(country_iso3)')
    cursor.execute('CREATE INDEX idx_borders_country_m49 ON country_borders(country_m49)')

    # Create child_mortality table
    print("👶 Creating child_mortality table...")
    cursor.execute('''
        CREATE TABLE child_mortality (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            country_code TEXT NOT NULL,
            country_name TEXT NOT NULL,
            year INTEGER NOT NULL,
            mortality_rate REAL NOT NULL,
            UNIQUE(country_code, year)
        )
    ''')

    # Create index for faster lookups
    cursor.execute('CREATE INDEX idx_mortality_country_code ON child_mortality(country_code)')
    cursor.execute('CREATE INDEX idx_mortality_year ON child_mortality(year)')

    # Insert countries from M49 data
    print(f"🌍 Inserting {len(m49_countries)} countries...")
    for country in m49_countries:
        cursor.execute('''
            INSERT INTO countries (iso3, iso2, name, m49, continent, subregion)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            country['iso3'],
            country['iso2'],
            country['name'],
            country['m49'],
            country['continent'],
            country['subregion']
        ))

    print(f"✅ Inserted {len(m49_countries)} countries")

    # Load Albert Kahn images - use image_url column
    print(f"🖼️  Loading Albert Kahn images from: {ALBERT_KAHN_CSV_PATH}")
    albert_kahn_count = 0
    downloads_folder = os.path.expanduser('~/Downloads')
    base_dir = os.path.dirname(os.path.abspath(__file__))

    with open(ALBERT_KAHN_CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        for row in reader:
            alpha3 = row.get('alpha3', '').strip()
            image_url = row.get('image_url', '').strip()

            if not alpha3 or not image_url:
                continue

            new_filepath = None

            # Determine source and check if file already exists
            if image_url.startswith('http'):
                # Get expected filename from URL
                parsed_url = urlparse(image_url)
                filename = unquote(os.path.basename(parsed_url.path))
                # Check for both .jpg and original extension
                expected_path_jpg = os.path.join(base_dir, 'images', alpha3, 'albert_kahn', filename.replace('.webp', '.jpg') if filename.endswith('.webp') else filename)
                expected_path_original = os.path.join(base_dir, 'images', alpha3, 'albert_kahn', filename)

                if os.path.exists(expected_path_jpg):
                    new_filepath = f"images/{alpha3}/albert_kahn/{os.path.basename(expected_path_jpg)}"
                elif os.path.exists(expected_path_original):
                    new_filepath = f"images/{alpha3}/albert_kahn/{filename}"
                else:
                    # Download from URL
                    print(f"  🔄 Downloading from URL...")
                    new_filepath = download_image(image_url, alpha3, 'albert_kahn')
            else:
                # Assume it's in Downloads folder
                local_path = os.path.join(downloads_folder, image_url)
                filename = os.path.basename(local_path)
                # Check for both .jpg and original extension
                expected_path_jpg = os.path.join(base_dir, 'images', alpha3, 'albert_kahn', filename.replace('.webp', '.jpg') if filename.endswith('.webp') else filename)
                expected_path_original = os.path.join(base_dir, 'images', alpha3, 'albert_kahn', filename)

                if os.path.exists(expected_path_jpg):
                    new_filepath = f"images/{alpha3}/albert_kahn/{os.path.basename(expected_path_jpg)}"
                elif os.path.exists(expected_path_original):
                    new_filepath = f"images/{alpha3}/albert_kahn/{filename}"
                else:
                    # Copy from Downloads folder
                    print(f"  🔄 Copying from Downloads folder...")
                    new_filepath = copy_local_image(local_path, alpha3, 'albert_kahn')

            # If filepath acquisition failed, skip
            if not new_filepath:
                print(f"  ⏭️  Skipping row due to failed image acquisition")
                continue

            cursor.execute('''
                INSERT INTO albert_kahn_images (
                    file_path, image_filename, inventory_number, title_fr, title_en,
                    location, country_fr, country_en, m49code, alpha2, alpha3,
                    operator, author, mission, date, theme, sub_theme, description,
                    domain, process, support, denomination, format, dimensions,
                    ownership, license, page_url, image_url, new_filepath
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                row.get('file_path', ''),
                row.get('image_filename', ''),
                row.get('inventory_number', ''),
                row.get('title_fr', ''),
                row.get('title_en', ''),
                row.get('location', ''),
                row.get('country_fr', ''),
                row.get('country_en', ''),
                row.get('m49code', ''),
                row.get('alpha2', ''),
                alpha3,
                row.get('operator', ''),
                row.get('author', ''),
                row.get('mission', ''),
                row.get('date', ''),
                row.get('theme', ''),
                row.get('sub_theme', ''),
                row.get('description', ''),
                row.get('domain', ''),
                row.get('process', ''),
                row.get('support', ''),
                row.get('denomination', ''),
                row.get('format', ''),
                row.get('dimensions', ''),
                row.get('ownership', ''),
                row.get('license', ''),
                row.get('page_url', ''),
                row.get('image_url', ''),
                new_filepath
            ))
            albert_kahn_count += 1

    print(f"✅ Inserted {albert_kahn_count} Albert Kahn images")

    # Load Children Artwork images (only rows with Keep="keep") - use image_path column
    print(f"🎨 Loading Children Artwork from: {CHILDREN_ARTWORK_CSV_PATH}")
    children_artwork_count = 0

    with open(CHILDREN_ARTWORK_CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        for row in reader:
            keep_status = row.get('Keep', '').strip().lower()
            if keep_status != 'keep':
                continue

            iso3_artist = row.get('iso3 artist', '').strip()
            image_path = row.get('image_path', '').strip()

            if not iso3_artist or not image_path:
                continue

            filepath = None

            # Determine source and check if file already exists
            if image_path.startswith('http'):
                # Get expected filename from URL
                parsed_url = urlparse(image_path)
                filename = unquote(os.path.basename(parsed_url.path))
                # Check for both .jpg and original extension
                expected_path_jpg = os.path.join(base_dir, 'images', iso3_artist, 'children_artwork', filename.replace('.webp', '.jpg') if filename.endswith('.webp') else filename)
                expected_path_original = os.path.join(base_dir, 'images', iso3_artist, 'children_artwork', filename)

                if os.path.exists(expected_path_jpg):
                    filepath = f"images/{iso3_artist}/children_artwork/{os.path.basename(expected_path_jpg)}"
                elif os.path.exists(expected_path_original):
                    filepath = f"images/{iso3_artist}/children_artwork/{filename}"
                else:
                    # Download from URL
                    print(f"  🔄 Downloading from URL...")
                    filepath = download_image(image_path, iso3_artist, 'children_artwork')
            else:
                # Assume it's in Downloads folder
                local_path = os.path.join(downloads_folder, image_path)
                filename = os.path.basename(local_path)
                # Check for both .jpg and original extension
                expected_path_jpg = os.path.join(base_dir, 'images', iso3_artist, 'children_artwork', filename.replace('.webp', '.jpg') if filename.endswith('.webp') else filename)
                expected_path_original = os.path.join(base_dir, 'images', iso3_artist, 'children_artwork', filename)

                if os.path.exists(expected_path_jpg):
                    filepath = f"images/{iso3_artist}/children_artwork/{os.path.basename(expected_path_jpg)}"
                elif os.path.exists(expected_path_original):
                    filepath = f"images/{iso3_artist}/children_artwork/{filename}"
                else:
                    # Copy from Downloads folder
                    print(f"  🔄 Copying from Downloads folder...")
                    filepath = copy_local_image(local_path, iso3_artist, 'children_artwork')

            # If filepath acquisition failed, skip
            if not filepath:
                print(f"  ⏭️  Skipping row due to failed image acquisition")
                continue

            cursor.execute('''
                INSERT INTO children_artwork_images (
                    artist_name, author_wikilink, artist_nationality, iso3_artist,
                    country_of_subject, iso3, work_title, keep, image_path, work_url,
                    location_reason, author_background, birth_date, death_date, birth_place,
                    source, tags, more_info, is_local, filepath
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                row.get('artist_name', ''),
                row.get('Author WikiLink', ''),
                row.get('Artist Nationality', ''),
                iso3_artist,
                row.get('Country of Subject: ', ''),
                row.get('iso3', ''),
                row.get('work_title', ''),
                row.get('Keep', ''),
                row.get('image_path', ''),
                row.get('work_url', ''),
                row.get('Location Reason', ''),
                row.get('Author Background', ''),
                row.get('birth_date', ''),
                row.get('death_date', ''),
                row.get('birth_place', ''),
                row.get('source', ''),
                row.get('tags', ''),
                row.get('More info', ''),
                row.get('is_local', ''),
                filepath
            ))
            children_artwork_count += 1

    print(f"✅ Inserted {children_artwork_count} children artwork images")

    # Load Public Domain images (skip rows with Remove="yes") - use Filename column
    print(f"📚 Loading Public Domain images from: {PUBLIC_DOMAIN_CSV_PATH}")
    public_domain_count = 0

    with open(PUBLIC_DOMAIN_CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        for row in reader:
            remove_status = row.get('Remove', '').strip().lower()
            if remove_status == 'yes':
                continue

            alpha_code = row.get('Alpha Code', '').strip()
            filename_value = row.get('Filename', '').strip()

            if not alpha_code or not filename_value:
                continue

            filepath = None

            # Determine source and check if file already exists
            if filename_value.startswith('http'):
                # Get expected filename from URL
                parsed_url = urlparse(filename_value)
                filename = unquote(os.path.basename(parsed_url.path))
                # Check for both .jpg and original extension
                expected_path_jpg = os.path.join(base_dir, 'images', alpha_code, 'public_domain', filename.replace('.webp', '.jpg') if filename.endswith('.webp') else filename)
                expected_path_original = os.path.join(base_dir, 'images', alpha_code, 'public_domain', filename)

                if os.path.exists(expected_path_jpg):
                    filepath = f"images/{alpha_code}/public_domain/{os.path.basename(expected_path_jpg)}"
                elif os.path.exists(expected_path_original):
                    filepath = f"images/{alpha_code}/public_domain/{filename}"
                else:
                    # Download from URL
                    print(f"  🔄 Downloading from URL...")
                    filepath = download_image(filename_value, alpha_code, 'public_domain')
            else:
                # Assume it's in Downloads folder
                local_path = os.path.join(downloads_folder, filename_value)
                filename = os.path.basename(local_path)
                # Check for both .jpg and original extension
                expected_path_jpg = os.path.join(base_dir, 'images', alpha_code, 'public_domain', filename.replace('.webp', '.jpg') if filename.endswith('.webp') else filename)
                expected_path_original = os.path.join(base_dir, 'images', alpha_code, 'public_domain', filename)

                if os.path.exists(expected_path_jpg):
                    filepath = f"images/{alpha_code}/public_domain/{os.path.basename(expected_path_jpg)}"
                elif os.path.exists(expected_path_original):
                    filepath = f"images/{alpha_code}/public_domain/{filename}"
                else:
                    # Copy from Downloads folder
                    print(f"  🔄 Copying from Downloads folder...")
                    filepath = copy_local_image(local_path, alpha_code, 'public_domain')

            # If filepath acquisition failed, skip
            if not filepath:
                print(f"  ⏭️  Skipping row due to failed image acquisition")
                continue

            cursor.execute('''
                INSERT INTO public_domain_images (
                    public_domain_url, public_domain_title, image_info, source_link,
                    country, alpha_code, filename, remove, filepath
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                row.get('Public Domain URL', ''),
                row.get('Public Domain Title', ''),
                row.get('Image Info', ''),
                row.get('Source Link', ''),
                row.get('Country', ''),
                alpha_code,
                row.get('Filename', ''),
                row.get('Remove', ''),
                filepath
            ))
            public_domain_count += 1

    print(f"✅ Inserted {public_domain_count} public domain images")

    # Load and insert Met Museum images
    print(f"\n🏛️  Loading Met Museum images from {MET_METADATA_CSV_PATH}...")
    met_count = 0

    if os.path.exists(MET_METADATA_CSV_PATH):
        with open(MET_METADATA_CSV_PATH, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                alpha3 = row.get('alpha3', '').strip()
                filepath = row.get('filepath', '').strip()

                # Skip if no alpha3 or filepath
                if not alpha3 or not filepath:
                    continue

                # Verify image exists
                if not os.path.exists(filepath):
                    print(f"  ⚠️  Image not found: {filepath}")
                    continue

                cursor.execute('''
                    INSERT INTO met_images (
                        object_id, alpha3, country_name, title, artist_name,
                        object_date, medium, department, culture, object_url,
                        primary_image_url, filepath, json_file
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    row.get('object_id', ''),
                    alpha3,
                    row.get('country_name', ''),
                    row.get('title', ''),
                    row.get('artist_name', ''),
                    row.get('object_date', ''),
                    row.get('medium', ''),
                    row.get('department', ''),
                    row.get('culture', ''),
                    row.get('object_url', ''),
                    row.get('primary_image_url', ''),
                    filepath,
                    row.get('json_file', '')
                ))
                met_count += 1

        print(f"✅ Inserted {met_count} Met Museum images")
    else:
        print(f"⚠️  Met metadata CSV not found, skipping Met Museum import")

    # Insert country borders
    print(f"🗺️  Inserting {len(borders_data)} border relationships...")
    for border in borders_data:
        cursor.execute('''
            INSERT INTO country_borders (country_iso3, country_m49, neighbor_iso3, neighbor_m49)
            VALUES (?, ?, ?, ?)
        ''', (
            border['country_iso3'],
            border['country_m49'],
            border['neighbor_iso3'],
            border['neighbor_m49']
        ))

    print(f"✅ Inserted {len(borders_data)} border relationships")

    # Insert child mortality data
    child_mortality_csv = os.path.join('data', 'child-mortality.csv')
    if os.path.exists(child_mortality_csv):
        print(f"👶 Reading child mortality data from {child_mortality_csv}...")
        mortality_count = 0
        skipped_count = 0
        with open(child_mortality_csv, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Filter: Only include data from 1989 onwards
                year = int(row['Year'])
                if year < 1989:
                    skipped_count += 1
                    continue

                # Filter: Only include countries with alpha codes (ISO codes)
                country_code = row['Code'].strip()
                if not country_code or len(country_code) != 3 or not country_code.isalpha():
                    skipped_count += 1
                    continue

                cursor.execute('''
                    INSERT OR REPLACE INTO child_mortality (country_code, country_name, year, mortality_rate)
                    VALUES (?, ?, ?, ?)
                ''', (
                    country_code,
                    row['Entity'],
                    year,
                    float(row['Child mortality rate'])
                ))
                mortality_count += 1

        print(f"✅ Inserted {mortality_count} child mortality records (skipped {skipped_count} records before 1989 or without valid ISO codes)")
    else:
        print(f"⚠️  Child mortality CSV not found, skipping child mortality import")

    conn.commit()

    # Export tables to CSV
    print(f"\n💾 Exporting tables to CSV...")
    os.makedirs(EXPORTS_DIR, exist_ok=True)

    export_table_to_csv(conn, 'countries', EXPORTS_DIR)
    export_table_to_csv(conn, 'albert_kahn_images', EXPORTS_DIR)
    export_table_to_csv(conn, 'children_artwork_images', EXPORTS_DIR)
    export_table_to_csv(conn, 'public_domain_images', EXPORTS_DIR)
    export_table_to_csv(conn, 'met_images', EXPORTS_DIR)
    export_table_to_csv(conn, 'country_borders', EXPORTS_DIR)
    export_table_to_csv(conn, 'child_mortality', EXPORTS_DIR)

    conn.close()

    print(f"\n✅ Database initialized successfully!")
    print(f"   - {len(m49_countries)} countries")
    print(f"   - {albert_kahn_count} Albert Kahn images")
    print(f"   - {children_artwork_count} children artwork images")
    print(f"   - {public_domain_count} public domain images")
    print(f"   - {len(borders_data)} border relationships")
    print(f"   - Database: {DATABASE_PATH}")
    print(f"   - CSV exports: {EXPORTS_DIR}")

if __name__ == '__main__':
    try:
        init_database()
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        import traceback
        traceback.print_exc()
