#!/usr/bin/env python3
"""
Database initialization script
Reads children_combined_with_iso3.csv and populates the database
Run this whenever the CSV is updated: python3 init_database.py
"""

import sqlite3
import csv
import json
import os
from config import DATABASE_PATH, CSV_PATH, REGIONS_JSON_PATH

def init_database():
    """Initialize database from CSV file"""

    # Load region mappings from JSON
    with open(REGIONS_JSON_PATH, 'r', encoding='utf-8') as f:
        ISO3_TO_REGION = json.load(f)

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
            name TEXT NOT NULL,
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

    # Read CSV and populate tables
    print(f"📖 Reading CSV file: {CSV_PATH}")
    countries = {}  # Track unique countries
    artworks_count = 0

    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        for row in reader:
            iso3 = row.get('iso3', '').strip()
            country_name = row.get('country', '').strip()

            if not iso3 or not country_name:
                continue

            # Add to countries dict if not exists
            if iso3 not in countries:
                # Get region info from mapping
                region_info = ISO3_TO_REGION.get(iso3, {
                    'continent': 'World',
                    'subregion': 'World'
                })

                countries[iso3] = {
                    'name': country_name,
                    'continent': region_info['continent'],
                    'subregion': region_info['subregion']
                }

            # Insert artwork
            cursor.execute('''
                INSERT INTO artworks (
                    iso3, artist_name, country, location_reason,
                    author_background, birth_date, death_date, birth_place,
                    work_title, work_url, source, tags,
                    more_info, public_domain, image_path, is_local
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                iso3,
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

    # Insert countries
    print(f"🌍 Inserting {len(countries)} countries...")
    for iso3, country_data in countries.items():
        cursor.execute('''
            INSERT INTO countries (iso3, name, continent, subregion)
            VALUES (?, ?, ?, ?)
        ''', (iso3, country_data['name'], country_data['continent'], country_data['subregion']))

    conn.commit()
    conn.close()

    print(f"✅ Database initialized successfully!")
    print(f"   - {len(countries)} countries")
    print(f"   - {artworks_count} artworks")
    print(f"   - Database location: {DATABASE_PATH}")

if __name__ == '__main__':
    try:
        init_database()
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        import traceback
        traceback.print_exc()
