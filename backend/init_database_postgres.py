#!/usr/bin/env python3
"""
PostgreSQL Database Initialization Script

Initializes PostgreSQL database for production deployment (Render, Heroku, etc.)
Reads UN M49 country data, artworks CSVs, borders, child mortality data, and Met Museum collection

This script ONLY:
- Creates database schema (tables, indexes, foreign keys)
- Loads data from existing CSV files
- Does NOT fetch new data from external APIs
- Does NOT clean up orphaned images

For maintenance tasks, use these separate scripts:
- cleanup_orphaned_images.py - Remove image files not in database
- fetch_met_data.py - Fetch new Met Museum data from API

Usage:
    export DATABASE_URL="postgresql://user:pass@host:port/dbname"
    python3 init_database_postgres.py

Environment Variables Required:
    DATABASE_URL - PostgreSQL connection string (e.g., from Render)
"""

import os
import psycopg2
from psycopg2.extras import RealDictCursor
import csv
import json
import requests
import time
import shutil
from urllib.parse import urlparse, unquote
from pathlib import Path
from PIL import Image
from config import (
    M49_JSON_PATH,
    EXPORTS_DIR,
    BORDERS_CSV_PATH,
    ALBERT_KAHN_CSV_PATH,
    CHILDREN_ARTWORK_CSV_PATH,
    PUBLIC_DOMAIN_CSV_PATH,
    MET_METADATA_CSV_PATH,
    MAX_IMAGE_DIMENSION,
    JPEG_QUALITY
)

# Try to import pycountry for common names
try:
    import pycountry
except ImportError:
    print("⚠️  pycountry not installed, using official names only")
    pycountry = None

# UN M49 Region code to continent name
REGION_NAMES = {
    2: "Africa",
    9: "Oceania",
    19: "Americas",
    142: "Asia",
    150: "Europe"
}#830

# UN M49 SubRegion codes to subregion names
SUBREGION_NAMES = {
    # Africa subregions
    15: "Northern Africa",
    11: "Western Africa",
    17: "Middle Africa",
    14: "Eastern Africa",
    18: "Southern Africa",
    202: "Sub-Saharan Africa",  # sometimes used

    # Asia subregions
    143: "Central Asia",
    30: "Eastern Asia",
    34: "Southern Asia",
    35: "Southeast Asia",
    145: "Western Asia",  # often called Middle East

    # Europe subregions
    151: "Eastern Europe",
    154: "Northern Europe",
    39: "Southern Europe",
    155: "Western Europe",

    # Americas subregions
    29: "Caribbean",
    13: "Central America",
    5: "South America",
    21: "Northern America",
    419: "Latin America and the Caribbean",  # macro grouping

    # Oceania subregions
    53: "Australia New Zealand Indo",
    54: "Melanesia",
    57: "Micronesia",
    61: "Polynesia"
}

# Optional: Full list of all M49 intermediate or macro subregions
MACRO_SUBREGIONS = {
    419: "Latin America and the Caribbean",
    202: "Sub-Saharan Africa"
}


def get_common_name(official_name, iso3, iso2):
    """Get the common name for a country using pycountry"""
    # Special cases where pycountry doesn't have the best common name
    special_cases = {
        'USA': 'United States',
        'GBR': 'United Kingdom',
        'BOL': 'Bolivia',
        'VEN': 'Venezuela',
        'TZA': 'Tanzania',
        'COD': 'Democratic Republic of the Congo',
        'COG': 'Republic of the Congo',
        'MDA': 'Moldova',
        'KOR': 'South Korea',
        'PRK': 'North Korea',
        'RUS': 'Russia',
        'IRN': 'Iran',
        'SYR': 'Syria',
        'LAO': 'Laos',
        'VNM': 'Vietnam',
        'CIV': 'Ivory Coast',
        'PSE': 'Palestine',
        'VAT': 'Vatican City',
    }

    # Check special cases first
    if iso3 in special_cases:
        return special_cases[iso3]

    # Try pycountry lookup if available
    if pycountry:
        if iso2:
            try:
                country = pycountry.countries.get(alpha_2=iso2.upper())
                if country:
                    return getattr(country, 'common_name', country.name)
            except:
                pass
        if iso3:
            try:
                country = pycountry.countries.get(alpha_3=iso3.upper())
                if country:
                    return getattr(country, 'common_name', country.name)
            except:
                pass

    # Fallback to cleaning up the official name
    name = official_name
    if '(' in name:
        name = name.split('(')[0].strip()
    name = name.replace('Republic of ', '')
    name = name.replace('Kingdom of ', '')
    name = name.replace('Plurinational State of ', '')
    name = name.replace('Islamic Republic of ', '')
    name = name.replace('Bolivarian Republic of ', '')
    name = name.replace('United Republic of ', '')
    name = name.replace('Democratic Republic of the ', '')
    name = name.replace("People's Democratic Republic", '')
    name = name.replace('Federated States of ', '')
    return name.strip()

# Image processing configuration
MAX_IMAGE_SIZE_MB = 1  # Maximum file size in MB before optimization

def get_file_size_mb(filepath):
    """Get file size in megabytes."""
    return os.path.getsize(filepath) / (1024 * 1024)

def sanitize_filename(title):
    """Convert title to safe filename with underscores"""
    if not title:
        return None
    # Replace spaces with underscores, remove unsafe characters
    safe = title.replace(' ', '_').replace('/', '_').replace('\\', '_')
    safe = ''.join(c for c in safe if c.isalnum() or c in ('_', '-', '.'))
    return safe + '.jpg' if not safe.endswith('.jpg') else safe

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

def process_image(filepath, max_dimension=None):
    """
    Process an image file:
    - Convert webp to jpeg (deletes original webp)
    - Resize if > 1MB or larger than max_dimension
    - Convert RGBA to RGB

    Args:
        filepath: Full path to image file
        max_dimension: Optional max dimension in pixels (defaults to MAX_IMAGE_DIMENSION from config)

    Returns:
        New filepath (jpg) if format changed, or original filepath
    """
    try:
        # Use MAX_IMAGE_DIMENSION if max_dimension not specified
        effective_max_dimension = max_dimension if max_dimension is not None else MAX_IMAGE_DIMENSION

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
        if original_size > MAX_IMAGE_SIZE_MB or width > effective_max_dimension or height > effective_max_dimension:
            print(f"  ↕️ Resizing image: {original_size:.2f}MB / {width}x{height}px")

            # Calculate new dimensions
            if width > height:
                if width > effective_max_dimension:
                    new_width = effective_max_dimension
                    new_height = int((effective_max_dimension / width) * height)
                else:
                    new_width, new_height = width, height
            else:
                if height > effective_max_dimension:
                    new_height = effective_max_dimension
                    new_width = int((effective_max_dimension / height) * width)
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

def copy_local_image(local_path, iso3, collection_type, target_filename=None, max_dimension=None):
    """
    Copy a local image file to the correct folder structure.

    Args:
        local_path: Local file path (e.g., /Users/.../image.jpg)
        iso3: Country ISO3 code
        collection_type: Collection type ('albert_kahn', 'children_artwork', or 'public_domain')
        target_filename: Optional filename to use (will use original filename if not provided)
        max_dimension: Optional max dimension in pixels for resizing

    Returns:
        Relative filepath (e.g., 'images/USA/children_artwork/image.jpg') or None if copy fails
    """
    if not local_path or not os.path.exists(local_path):
        print(f"  ⚠️  Local file does not exist: {local_path}")
        return None

    try:
        # Get filename - use target_filename if provided, otherwise use original
        if target_filename:
            filename = target_filename
        else:
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
        processed_filepath = process_image(filepath_full, max_dimension=max_dimension)

        # Get final filename (may have changed from .webp to .jpg)
        final_filename = os.path.basename(processed_filepath)

        # Return relative path
        return f"images/{iso3}/{collection_type}/{final_filename}"

    except Exception as e:
        print(f"  ❌ Error copying {local_path}: {e}")
        return None

def download_image(url, iso3, collection_type, target_filename=None, max_dimension=None):
    """
    Download an image from URL and save it to the correct folder structure.

    Args:
        url: URL of the image to download
        iso3: Country ISO3 code
        collection_type: Collection type ('albert_kahn', 'children_artwork', or 'public_domain')
        target_filename: Optional filename to use (will extract from URL if not provided)
        max_dimension: Optional max dimension in pixels for resizing

    Returns:
        Relative filepath (e.g., 'images/USA/public_domain/image.jpg') or None if download fails
    """
    if not url or url.startswith('http') == False:
        return None

    try:
        # Get filename - use target_filename if provided, otherwise extract from URL
        if target_filename:
            filename = target_filename
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
        processed_filepath = process_image(filepath_full, max_dimension=max_dimension)

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
        iso3 = country.get('iso3')
        if not iso3:
            continue

        region_code = country.get('region')
        subregion_code = country.get('subRegion')
        intermediate_code = country.get('intermediateRegion')

        # Get continent name
        continent = REGION_NAMES.get(region_code, 'World')

        # For Africa, prefer intermediateRegion if it exists (more specific)
        if intermediate_code and int(intermediate_code) != 830:
            subregion = SUBREGION_NAMES.get(intermediate_code, continent)
        else:
            subregion = SUBREGION_NAMES.get(subregion_code, continent)

        alpha2 = country.get('alpha2', '')
        name = country.get('name', '')
        # Read common_name and is_country directly from JSON (added by add_common_names.py)
        common_name = country.get('common_name', name)
        is_country = country.get('is_country', False)

        # Set include_in_quiz based on is_country status
        include_in_quiz = is_country

        # Override for territories with geometries in TopoJSON (clickable on globe)
        # Only include territories that have separate geometries in world-atlas TopoJSON
        territory_overrides = [
            'GRL',  # Greenland (Denmark)
            'PRI',  # Puerto Rico (United States)
            'PYF',  # French Polynesia (France)
            'NCL',  # New Caledonia (France)
            'GUM',  # Guam (United States)
            'CUW',  # Curaçao (Netherlands)
            'ABW',  # Aruba (Netherlands)
        ]
        if iso3 in territory_overrides:
            include_in_quiz = True

        # Set parent country for territories
        parent_country_iso3 = None
        parent_mapping = {
            'PYF': 'FRA',  # French Polynesia → France
            'NCL': 'FRA',  # New Caledonia → France
            'GRL': 'DNK',  # Greenland → Denmark
            'CUW': 'NLD',  # Curaçao → Netherlands
            'ABW': 'NLD',  # Aruba → Netherlands
            'PRI': 'USA',  # Puerto Rico → United States
            'GUM': 'USA',  # Guam → United States
        }
        if iso3 in parent_mapping:
            parent_country_iso3 = parent_mapping[iso3]

        countries.append({
            'iso3': iso3,
            'iso2': alpha2,
            'name': name,
            'common_name': common_name,
            'm49': country.get('m49code', ''),
            'continent': continent,
            'subregion': subregion,
            'is_country': is_country,
            'include_in_quiz': include_in_quiz,
            'parent_country_iso3': parent_country_iso3
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

    # Get column names from cursor description (PostgreSQL compatible)
    columns = [desc[0] for desc in cursor.description]

    # Write to CSV
    output_path = os.path.join(output_dir, f'{table_name}.csv')
    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(columns)
        # Write rows (handle both dict-like and tuple-like rows)
        for row in rows:
            if isinstance(row, dict):
                writer.writerow([row.get(col) for col in columns])
            else:
                writer.writerow(row)

    print(f"  📄 Exported {table_name}: {len(rows)} rows → {output_path}")

def init_database():
    """Initialize database from UN M49 and artworks CSV"""

    # Load UN M49 country data
    m49_countries = load_m49_data()

    # Load country borders data
    borders_data = load_borders_data(m49_countries)

    # Get DATABASE_URL from environment
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ ERROR: DATABASE_URL environment variable not set!")
        print("Usage: export DATABASE_URL='postgresql://user:pass@host:port/dbname'")
        exit(1)

    # Handle Render's postgres:// URL format (convert to postgresql://)
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)

    # Add SSL parameters to URL for remote PostgreSQL (not localhost)
    if 'localhost' not in database_url and '127.0.0.1' not in database_url:
        if '?' in database_url:
            database_url += '&sslmode=require'
        else:
            database_url += '?sslmode=require'

    # Connect to PostgreSQL
    print(f"📦 Connecting to PostgreSQL database...")
    conn = psycopg2.connect(database_url)
    conn.autocommit = False  # Use transactions
    cursor = conn.cursor()

    # Drop existing tables (CASCADE to handle foreign keys)
    print("🗑️  Dropping existing tables if they exist...")
    cursor.execute('DROP TABLE IF EXISTS country_borders CASCADE')
    cursor.execute('DROP TABLE IF EXISTS met_images CASCADE')
    cursor.execute('DROP TABLE IF EXISTS public_domain_images CASCADE')
    cursor.execute('DROP TABLE IF EXISTS children_artwork_images CASCADE')
    cursor.execute('DROP TABLE IF EXISTS albert_kahn_images CASCADE')
    cursor.execute('DROP TABLE IF EXISTS countries CASCADE')
    conn.commit()

    # Create countries table
    print("🌍 Creating countries table...")
    cursor.execute('''
        CREATE TABLE countries (
            iso3 TEXT PRIMARY KEY,
            iso2 TEXT,
            name TEXT NOT NULL,
            common_name TEXT,
            m49 INTEGER,
            continent TEXT NOT NULL,
            subregion TEXT NOT NULL,
            is_country BOOLEAN NOT NULL DEFAULT FALSE,
            include_in_quiz BOOLEAN DEFAULT FALSE,
            parent_country_iso3 TEXT,
            CONSTRAINT fk_parent_country FOREIGN KEY (parent_country_iso3) REFERENCES countries(iso3)
        )
    ''')

    # Create index on parent_country_iso3
    cursor.execute('''
        CREATE INDEX idx_countries_parent ON countries(parent_country_iso3)
    ''')

    # Create albert_kahn_images table with ALL columns from CSV
    print("🖼️  Creating albert_kahn_images table...")
    cursor.execute('''
        CREATE TABLE albert_kahn_images (
            id SERIAL PRIMARY KEY,
            file_path TEXT,
            image_filename TEXT,
            inventory_number TEXT,
            title_fr TEXT,
            title_en TEXT,
            location TEXT,
            country_fr TEXT,
            country_en TEXT,
            m49code INTEGER,
            iso2 TEXT,
            iso3 TEXT NOT NULL,
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
            filepath TEXT,
            FOREIGN KEY (iso3) REFERENCES countries(iso3)
        )
    ''')
    cursor.execute('CREATE INDEX idx_albert_kahn_iso3 ON albert_kahn_images(iso3)')

    # Create children_artwork_images table with ALL columns from CSV
    print("🎨 Creating children_artwork_images table...")
    cursor.execute('''
        CREATE TABLE children_artwork_images (
            id SERIAL PRIMARY KEY,
            artist_name TEXT,
            author_wikilink TEXT,
            artist_nationality TEXT,
            artist_iso3 TEXT NOT NULL,
            country_of_subject TEXT,
            subject_iso3 TEXT,
            title TEXT,
            keep TEXT,
            image_url TEXT,
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
            FOREIGN KEY (artist_iso3) REFERENCES countries(iso3)
        )
    ''')
    cursor.execute('CREATE INDEX idx_children_artwork_artist_iso3 ON children_artwork_images(artist_iso3)')

    # Create public_domain_images table with ALL columns from CSV
    print("📚 Creating public_domain_images table...")
    cursor.execute('''
        CREATE TABLE public_domain_images (
            id SERIAL PRIMARY KEY,
            source_url TEXT,
            title TEXT,
            description TEXT,
            source_link TEXT,
            country TEXT,
            iso3 TEXT NOT NULL,
            image_url TEXT,
            remove TEXT,
            filepath TEXT,
            FOREIGN KEY (iso3) REFERENCES countries(iso3)
        )
    ''')
    cursor.execute('CREATE INDEX idx_public_domain_iso3 ON public_domain_images(iso3)')

    # Create met_images table
    print("🏛️  Creating met_images table...")
    cursor.execute('''
        CREATE TABLE met_images (
            id SERIAL PRIMARY KEY,
            object_id TEXT NOT NULL,
            iso3 TEXT NOT NULL,
            country_name TEXT,
            title TEXT,
            artist_name TEXT,
            object_date TEXT,
            medium TEXT,
            department TEXT,
            culture TEXT,
            object_url TEXT,
            image_url TEXT,
            filepath TEXT,
            json_file TEXT,
            FOREIGN KEY (iso3) REFERENCES countries(iso3)
        )
    ''')
    cursor.execute('CREATE INDEX idx_met_iso3 ON met_images(iso3)')

    # Create country_borders table
    print("🗺️  Creating country_borders table...")
    cursor.execute('''
        CREATE TABLE country_borders (
            id SERIAL PRIMARY KEY,
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

    # Insert countries from M49 data in two passes to handle foreign key constraints
    # First pass: Insert countries without parent territories
    print(f"🌍 Inserting countries (first pass - parent countries)...")
    parent_countries = [c for c in m49_countries if c['parent_country_iso3'] is None]
    for country in parent_countries:
        cursor.execute('''
            INSERT INTO countries (iso3, iso2, name, common_name, m49, continent, subregion, is_country, include_in_quiz, parent_country_iso3)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ''', (
            country['iso3'],
            country['iso2'],
            country['name'],
            country['common_name'],
            country['m49'],
            country['continent'],
            country['subregion'],
            country['is_country'],
            country['include_in_quiz'],
            country['parent_country_iso3']
        ))
    print(f"✅ Inserted {len(parent_countries)} parent countries")

    # Second pass: Insert territories with parent countries
    print(f"🌍 Inserting territories (second pass - with parent references)...")
    territories = [c for c in m49_countries if c['parent_country_iso3'] is not None]
    for country in territories:
        cursor.execute('''
            INSERT INTO countries (iso3, iso2, name, common_name, m49, continent, subregion, is_country, include_in_quiz, parent_country_iso3)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ''', (
            country['iso3'],
            country['iso2'],
            country['name'],
            country['common_name'],
            country['m49'],
            country['continent'],
            country['subregion'],
            country['is_country'],
            country['include_in_quiz'],
            country['parent_country_iso3']
        ))
    print(f"✅ Inserted {len(territories)} territories")
    print(f"✅ Total inserted: {len(m49_countries)} countries")

    # Load Albert Kahn images - use image_url column
    print(f"🖼️  Loading Albert Kahn images from: {ALBERT_KAHN_CSV_PATH}")
    albert_kahn_count = 0
    downloads_folder = os.path.expanduser('~/Downloads')
    base_dir = os.path.dirname(os.path.abspath(__file__))

    with open(ALBERT_KAHN_CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        for row in reader:
            # Only process rows with Keep="keep"
            keep_status = row.get('Keep', '').strip()
            if keep_status != 'Keep':
                continue

            iso3 = row.get('iso3', '').strip()
            image_url = row.get('image_url', '').strip()

            if not iso3 or not image_url:
                continue

            filepath = None

            # Determine source and check if file already exists
            if image_url.startswith('http'):
                # Get expected filename from URL
                parsed_url = urlparse(image_url)
                filename = unquote(os.path.basename(parsed_url.path))
                # Check for both .jpg and original extension
                expected_path_jpg = os.path.join(base_dir, 'images', iso3, 'albert_kahn', filename.replace('.webp', '.jpg') if filename.endswith('.webp') else filename)
                expected_path_original = os.path.join(base_dir, 'images', iso3, 'albert_kahn', filename)

                if os.path.exists(expected_path_jpg):
                    filepath = f"images/{iso3}/albert_kahn/{os.path.basename(expected_path_jpg)}"
                elif os.path.exists(expected_path_original):
                    filepath = f"images/{iso3}/albert_kahn/{filename}"
                else:
                    # Download from URL
                    print(f"  🔄 Downloading from URL...")
                    filepath = download_image(image_url, iso3, 'albert_kahn')
            else:
                # Assume it's in Downloads folder
                local_path = os.path.join(downloads_folder, image_url)
                filename = os.path.basename(local_path)
                # Check for both .jpg and original extension
                expected_path_jpg = os.path.join(base_dir, 'images', iso3, 'albert_kahn', filename.replace('.webp', '.jpg') if filename.endswith('.webp') else filename)
                expected_path_original = os.path.join(base_dir, 'images', iso3, 'albert_kahn', filename)

                if os.path.exists(expected_path_jpg):
                    filepath = f"images/{iso3}/albert_kahn/{os.path.basename(expected_path_jpg)}"
                elif os.path.exists(expected_path_original):
                    filepath = f"images/{iso3}/albert_kahn/{filename}"
                else:
                    # Copy from Downloads folder
                    print(f"  🔄 Copying from Downloads folder...")
                    filepath = copy_local_image(local_path, iso3, 'albert_kahn')

            # If filepath acquisition failed, skip
            if not filepath:
                print(f"  ⏭️  Skipping row due to failed image acquisition")
                continue

            cursor.execute('''
                INSERT INTO albert_kahn_images (
                    file_path, image_filename, inventory_number, title_fr, title_en,
                    location, country_fr, country_en, m49code, iso2, iso3,
                    operator, author, mission, date, theme, sub_theme, description,
                    domain, process, support, denomination, format, dimensions,
                    ownership, license, page_url, image_url, filepath
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
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
                row.get('iso2', ''),
                iso3,
                row.get('operator', ''),
                row.get('author', ''),
                row.get('Mission', ''),
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
                filepath
            ))
            albert_kahn_count += 1

    print(f"✅ Inserted {albert_kahn_count} Albert Kahn images")

    # Load Children Artwork images (only rows with Keep="keep")
    # Use image_url to download, title to rename, filepath to save location
    print(f"🎨 Loading Children Artwork from: {CHILDREN_ARTWORK_CSV_PATH}")
    children_artwork_count = 0

    with open(CHILDREN_ARTWORK_CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        for row in reader:
            # Only process rows with Keep="keep"
            keep_status = row.get('Keep', '').strip().lower()
            if keep_status != 'keep':
                continue

            artist_iso3 = row.get('artist_iso3', '').strip()
            image_url = row.get('image_url', '').strip()
            title = row.get('title', '').strip()

            if not artist_iso3 or not image_url or not title:
                continue

            # Step 1: Create sanitized filename from title
            target_filename = sanitize_filename(title)
            if not target_filename:
                continue

            # Step 2: Check if image already exists at expected path
            expected_path = os.path.join(base_dir, 'images', artist_iso3, 'children_artwork', target_filename)
            filepath = None

            # IMPORTANT: Also check for URL-based filename (happens if file was manually downloaded)
            # This prevents orphan cleanup from deleting manually downloaded files with different names
            if not os.path.exists(expected_path) and image_url.startswith('http'):
                # Get the URL's filename
                parsed_url = urlparse(image_url)
                url_filename = unquote(os.path.basename(parsed_url.path))
                url_based_path = os.path.join(base_dir, 'images', artist_iso3, 'children_artwork', url_filename)

                # If file exists with URL filename, rename it to standardized filename
                if os.path.exists(url_based_path) and url_filename != target_filename:
                    print(f"  ♻️  Renaming {url_filename} -> {target_filename}")
                    os.rename(url_based_path, expected_path)

            if os.path.exists(expected_path):
                # Image already exists, use it
                filepath = f"images/{artist_iso3}/children_artwork/{target_filename}"
            else:
                # Step 3: Image doesn't exist, download/copy from image_url
                if image_url.startswith('http'):
                    # Download from URL with sanitized filename
                    print(f"  🔄 Downloading: {title}")
                    filepath = download_image(image_url, artist_iso3, 'children_artwork', target_filename=target_filename)
                else:
                    # Handle local file paths
                    if image_url.startswith('/') or image_url.startswith('~'):
                        local_path = os.path.expanduser(image_url)
                    else:
                        local_path = os.path.join(downloads_folder, image_url)

                    # Copy with sanitized filename
                    print(f"  🔄 Copying: {title}")
                    filepath = copy_local_image(local_path, artist_iso3, 'children_artwork', target_filename=target_filename)

            # If filepath acquisition failed, skip
            if not filepath:
                print(f"  ⏭️  Skipping '{title}' - failed to acquire image")
                continue

            # Step 4: Save filepath to database
            cursor.execute('''
                INSERT INTO children_artwork_images (
                    artist_name, author_wikilink, artist_nationality, artist_iso3,
                    country_of_subject, subject_iso3, title, keep, image_url, work_url,
                    location_reason, author_background, birth_date, death_date, birth_place,
                    source, tags, more_info, is_local, filepath
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ''', (
                row.get('artist_name', ''),
                row.get('Author WikiLink', ''),
                row.get('Artist Nationality', ''),
                artist_iso3,
                row.get('Country of Subject: ', ''),
                row.get('subject_iso3', ''),
                row.get('title', ''),
                row.get('Keep', ''),
                row.get('image_url', ''),
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

    # Load Public Domain images (skip rows with Remove="yes") - use local_path column
    print(f"📚 Loading Public Domain images from: {PUBLIC_DOMAIN_CSV_PATH}")
    public_domain_count = 0

    with open(PUBLIC_DOMAIN_CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        for row in reader:
            # Skip rows marked for removal
            remove_status = row.get('Remove', '').strip().lower()
            if remove_status == 'yes':
                continue

            iso3 = row.get('iso3', '').strip()
            filepath_col = row.get('filepath', '').strip()
            local_path = row.get('local_path', '').strip()
            title = row.get('title', '').strip()

            # Validate required fields
            if not iso3:
                print(f"  ⚠️  Skipping row: missing iso3")
                continue

            # Determine source: filepath first, then local_path
            source_path = filepath_col if filepath_col else local_path

            if not source_path:
                print(f"  ⚠️  Skipping row for {iso3}: both filepath and local_path are empty")
                continue

            if not title:
                print(f"  ⚠️  Skipping row for {iso3}: missing title")
                continue

            # Create sanitized filename from title
            target_filename = sanitize_filename(title)
            if not target_filename:
                print(f"  ⚠️  Skipping row for {iso3}: could not sanitize title '{title}'")
                continue

            # Check if image already exists at expected path
            expected_path = os.path.join(base_dir, 'images', iso3, 'public_domain', target_filename)
            filepath = None

            # Handle renaming if file exists with different name
            if not os.path.exists(expected_path) and source_path.startswith('http'):
                # Check for URL-based filename
                parsed_url = urlparse(source_path)
                url_filename = unquote(os.path.basename(parsed_url.path))
                # Also check for .jpg version if URL was .webp
                if url_filename.endswith('.webp'):
                    url_filename_jpg = url_filename[:-5] + '.jpg'
                    url_based_path_jpg = os.path.join(base_dir, 'images', iso3, 'public_domain', url_filename_jpg)
                    if os.path.exists(url_based_path_jpg) and url_filename_jpg != target_filename:
                        print(f"  ♻️  Renaming {url_filename_jpg} -> {target_filename}")
                        os.rename(url_based_path_jpg, expected_path)

                url_based_path = os.path.join(base_dir, 'images', iso3, 'public_domain', url_filename)
                if os.path.exists(url_based_path) and url_filename != target_filename:
                    print(f"  ♻️  Renaming {url_filename} -> {target_filename}")
                    os.rename(url_based_path, expected_path)

            if os.path.exists(expected_path):
                # Image already exists with correct name
                filepath = f"images/{iso3}/public_domain/{target_filename}"
            else:
                # Download or copy image with 500px max dimension
                if source_path.startswith('http'):
                    # Download from URL
                    print(f"  🔄 Downloading: {title}")
                    filepath = download_image(
                        source_path,
                        iso3,
                        'public_domain',
                        target_filename=target_filename,
                        max_dimension=500
                    )
                else:
                    # Copy from Downloads folder
                    if source_path.startswith('/') or source_path.startswith('~'):
                        local_file_path = os.path.expanduser(source_path)
                    else:
                        local_file_path = os.path.join(downloads_folder, source_path)

                    print(f"  🔄 Copying: {title}")
                    filepath = copy_local_image(
                        local_file_path,
                        iso3,
                        'public_domain',
                        target_filename=target_filename,
                        max_dimension=500
                    )

            # If filepath acquisition failed, skip
            if not filepath:
                print(f"  ⏭️  Skipping '{title}' - failed to acquire image")
                continue

            # Insert into database
            cursor.execute('''
                INSERT INTO public_domain_images (
                    source_url, title, description, source_link,
                    country, iso3, image_url, remove, filepath
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ''', (
                row.get('source_url', ''),
                row.get('title', ''),
                row.get('description', ''),
                row.get('Source Link', ''),
                row.get('Country', ''),
                iso3,
                row.get('image_url', ''),
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
                iso3 = row.get('iso3', '').strip()
                filepath = row.get('filepath', '').strip()

                # Skip if no iso3 or filepath
                if not iso3 or not filepath:
                    continue

                # Verify image exists
                if not os.path.exists(filepath):
                    print(f"  ⚠️  Image not found: {filepath}")
                    continue

                cursor.execute('''
                    INSERT INTO met_images (
                        object_id, iso3, country_name, title, artist_name,
                        object_date, medium, department, culture, object_url,
                        image_url, filepath, json_file
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ''', (
                    row.get('object_id', ''),
                    iso3,
                    row.get('country_name', ''),
                    row.get('title', ''),
                    row.get('artist_name', ''),
                    row.get('object_date', ''),
                    row.get('medium', ''),
                    row.get('department', ''),
                    row.get('culture', ''),
                    row.get('object_url', ''),
                    row.get('image_url', ''),
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
            VALUES (%s, %s, %s, %s)
        ''', (
            border['country_iso3'],
            border['country_m49'],
            border['neighbor_iso3'],
            border['neighbor_m49']
        ))

    print(f"✅ Inserted {len(borders_data)} border relationships")

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

    conn.close()

    print(f"\n✅ Database initialized successfully!")
    print(f"   - {len(m49_countries)} countries")
    print(f"   - {albert_kahn_count} Albert Kahn images")
    print(f"   - {children_artwork_count} children artwork images")
    print(f"   - {public_domain_count} public domain images")
    print(f"   - {len(borders_data)} border relationships")
    print(f"   - Database: PostgreSQL (DATABASE_URL)")
    print(f"   - CSV exports: {EXPORTS_DIR}")

if __name__ == '__main__':
    try:
        init_database()
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        import traceback
        traceback.print_exc()
