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
from config import DATABASE_PATH, CSV_PATH, M49_JSON_PATH, EXPORTS_DIR

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

    # Create artworks table
    print("🎨 Creating artworks table...")
    cursor.execute('''
        CREATE TABLE artworks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            iso3 TEXT NOT NULL,
            type TEXT DEFAULT 'Art',
            artist_name TEXT,
            country TEXT,
            location_reason TEXT,
            author_background TEXT,
            birth_date TEXT,
            death_date TEXT,
            birth_place TEXT,
            work_title TEXT,
            work_url TEXT,
            source TEXT,
            tags TEXT,
            more_info TEXT,
            public_domain TEXT,
            image_path TEXT,
            is_local TEXT,
            FOREIGN KEY (iso3) REFERENCES countries(iso3)
        )
    ''')

    # Create index for faster queries
    cursor.execute('CREATE INDEX idx_artworks_iso3 ON artworks(iso3)')

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

    # Read artworks CSV and populate artworks table
    print(f"🎨 Loading artworks from: {CSV_PATH}")
    artworks_count = 0

    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        for row in reader:
            iso3 = row.get('iso3', '').strip()
            country_name = row.get('country', '').strip()

            if not iso3 or not country_name:
                continue

            # Get type from CSV, default to 'Art' if not specified
            artwork_type = row.get('type', '').strip() or 'Art'

            cursor.execute('''
                INSERT INTO artworks (
                    iso3, type, artist_name, country, location_reason,
                    author_background, birth_date, death_date, birth_place,
                    work_title, work_url, source, tags,
                    more_info, public_domain, image_path, is_local
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                iso3,
                artwork_type,
                row.get('artist_name', ''),
                country_name,
                row.get('Location Reason', ''),
                row.get('Author Background', ''),
                row.get('birth_date', ''),
                row.get('death_date', ''),
                row.get('birth_place', ''),
                row.get('work_title', ''),
                row.get('work_url', ''),
                row.get('source', ''),
                row.get('tags', ''),
                row.get('More info', ''),
                row.get('Public Domain?', ''),
                row.get('image_path', ''),
                row.get('is_local', '')
            ))
            artworks_count += 1

    print(f"✅ Inserted {artworks_count} artworks")

    conn.commit()

    # Export tables to CSV
    print(f"\n💾 Exporting tables to CSV...")
    os.makedirs(EXPORTS_DIR, exist_ok=True)

    export_table_to_csv(conn, 'countries', EXPORTS_DIR)
    export_table_to_csv(conn, 'artworks', EXPORTS_DIR)

    conn.close()

    print(f"\n✅ Database initialized successfully!")
    print(f"   - {len(m49_countries)} countries")
    print(f"   - {artworks_count} artworks")
    print(f"   - Database: {DATABASE_PATH}")
    print(f"   - CSV exports: {EXPORTS_DIR}")

if __name__ == '__main__':
    try:
        init_database()
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        import traceback
        traceback.print_exc()
