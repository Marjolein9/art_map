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
from config import (
    DATABASE_PATH,
    M49_JSON_PATH,
    EXPORTS_DIR,
    BORDERS_CSV_PATH,
    ALBERT_KAHN_CSV_PATH,
    CHILDREN_ARTWORK_CSV_PATH,
    PUBLIC_DOMAIN_CSV_PATH
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

    # Create albert_kahn_images table
    print("🖼️  Creating albert_kahn_images table...")
    cursor.execute('''
        CREATE TABLE albert_kahn_images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            alpha3 TEXT NOT NULL,
            image_filename TEXT,
            filepath TEXT,
            title_en TEXT,
            location TEXT,
            date TEXT,
            operator TEXT,
            inventory_number TEXT,
            FOREIGN KEY (alpha3) REFERENCES countries(iso3)
        )
    ''')
    cursor.execute('CREATE INDEX idx_albert_kahn_alpha3 ON albert_kahn_images(alpha3)')

    # Create children_artwork_images table
    print("🎨 Creating children_artwork_images table...")
    cursor.execute('''
        CREATE TABLE children_artwork_images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            alpha3 TEXT NOT NULL,
            artist_name TEXT,
            artist_nationality TEXT,
            work_title TEXT,
            filepath TEXT,
            image_path TEXT,
            FOREIGN KEY (alpha3) REFERENCES countries(iso3)
        )
    ''')
    cursor.execute('CREATE INDEX idx_children_artwork_alpha3 ON children_artwork_images(alpha3)')

    # Create public_domain_images table
    print("📚 Creating public_domain_images table...")
    cursor.execute('''
        CREATE TABLE public_domain_images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            alpha3 TEXT NOT NULL,
            title TEXT,
            country TEXT,
            filepath TEXT,
            source_link TEXT,
            FOREIGN KEY (alpha3) REFERENCES countries(iso3)
        )
    ''')
    cursor.execute('CREATE INDEX idx_public_domain_alpha3 ON public_domain_images(alpha3)')

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

    # Load Albert Kahn images
    print(f"🖼️  Loading Albert Kahn images from: {ALBERT_KAHN_CSV_PATH}")
    albert_kahn_count = 0

    with open(ALBERT_KAHN_CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        for row in reader:
            alpha3 = row.get('alpha3', '').strip()
            filepath = row.get('new_filepath', '').strip()

            if not alpha3 or not filepath:
                continue

            # Strip "backend/" prefix from filepath
            if filepath.startswith('backend/'):
                filepath = filepath[8:]  # Remove "backend/"

            cursor.execute('''
                INSERT INTO albert_kahn_images (
                    alpha3, image_filename, filepath, title_en, location,
                    date, operator, inventory_number
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                alpha3,
                row.get('image_filename', ''),
                filepath,
                row.get('title_en', ''),
                row.get('location', ''),
                row.get('date', ''),
                row.get('operator', ''),
                row.get('inventory_number', '')
            ))
            albert_kahn_count += 1

    print(f"✅ Inserted {albert_kahn_count} Albert Kahn images")

    # Load Children Artwork images (only rows with Keep="keep")
    print(f"🎨 Loading Children Artwork from: {CHILDREN_ARTWORK_CSV_PATH}")
    children_artwork_count = 0

    with open(CHILDREN_ARTWORK_CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        for row in reader:
            keep_status = row.get('Keep', '').strip().lower()
            if keep_status != 'keep':
                continue

            alpha3 = row.get('iso3 artist', '').strip()
            filepath = row.get('filepath', '').strip()

            if not alpha3 or not filepath:
                continue

            # Strip "backend/" prefix from filepath
            if filepath.startswith('backend/'):
                filepath = filepath[8:]  # Remove "backend/"

            cursor.execute('''
                INSERT INTO children_artwork_images (
                    alpha3, artist_name, artist_nationality, work_title,
                    filepath, image_path
                ) VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                alpha3,
                row.get('artist_name', ''),
                row.get('Artist Nationality', ''),
                row.get('work_title', ''),
                filepath,
                row.get('image_path', '')
            ))
            children_artwork_count += 1

    print(f"✅ Inserted {children_artwork_count} children artwork images")

    # Load Public Domain images (skip rows with Remove="yes")
    print(f"📚 Loading Public Domain images from: {PUBLIC_DOMAIN_CSV_PATH}")
    public_domain_count = 0

    with open(PUBLIC_DOMAIN_CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        for row in reader:
            remove_status = row.get('Remove', '').strip().lower()
            if remove_status == 'yes':
                continue

            alpha3 = row.get('Alpha Code', '').strip()
            filepath = row.get('filepath', '').strip()

            if not alpha3 or not filepath:
                continue

            # Strip "backend/" prefix from filepath
            if filepath.startswith('backend/'):
                filepath = filepath[8:]  # Remove "backend/"

            cursor.execute('''
                INSERT INTO public_domain_images (
                    alpha3, title, country, filepath, source_link
                ) VALUES (?, ?, ?, ?, ?)
            ''', (
                alpha3,
                row.get('Public Domain Title', ''),
                row.get('Country', ''),
                filepath,
                row.get('Source Link', '')
            ))
            public_domain_count += 1

    print(f"✅ Inserted {public_domain_count} public domain images")

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

    conn.commit()

    # Export tables to CSV
    print(f"\n💾 Exporting tables to CSV...")
    os.makedirs(EXPORTS_DIR, exist_ok=True)

    export_table_to_csv(conn, 'countries', EXPORTS_DIR)
    export_table_to_csv(conn, 'albert_kahn_images', EXPORTS_DIR)
    export_table_to_csv(conn, 'children_artwork_images', EXPORTS_DIR)
    export_table_to_csv(conn, 'public_domain_images', EXPORTS_DIR)
    export_table_to_csv(conn, 'country_borders', EXPORTS_DIR)

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
