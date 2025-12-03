#!/usr/bin/env python3
"""
Database initialization script
Reads children_combined_with_iso3.csv and populates the database
Run this whenever the CSV is updated: python3 init_database.py
"""

import sqlite3
import csv
import os

# Manual ISO3 to region mapping (matching WorldMap REGION_VIEWS)
ISO3_TO_REGION = {
    'ALB': {'continent': 'Europe', 'subregion': 'Southern Europe'},
    'DZA': {'continent': 'Africa', 'subregion': 'North Africa'},
    'AUS': {'continent': 'Oceania', 'subregion': 'Oceania'},
    'AUT': {'continent': 'Europe', 'subregion': 'Western Europe'},
    'BGD': {'continent': 'Asia', 'subregion': 'South Asia'},
    'BEL': {'continent': 'Europe', 'subregion': 'Western Europe'},
    'BOL': {'continent': 'Americas', 'subregion': 'South America'},
    'BRA': {'continent': 'Americas', 'subregion': 'South America'},
    'BGR': {'continent': 'Europe', 'subregion': 'Eastern Europe'},
    'KHM': {'continent': 'Asia', 'subregion': 'Southeast Asia'},
    'CMR': {'continent': 'Africa', 'subregion': 'West Africa'},
    'CAN': {'continent': 'Americas', 'subregion': 'North America'},
    'CHL': {'continent': 'Americas', 'subregion': 'South America'},
    'CHN': {'continent': 'Asia', 'subregion': 'East Asia'},
    'COL': {'continent': 'Americas', 'subregion': 'South America'},
    'CRI': {'continent': 'Americas', 'subregion': 'Central America'},
    'HRV': {'continent': 'Europe', 'subregion': 'Southern Europe'},
    'CUB': {'continent': 'Americas', 'subregion': 'Caribbean'},
    'CZE': {'continent': 'Europe', 'subregion': 'Eastern Europe'},
    'DNK': {'continent': 'Europe', 'subregion': 'Northern Europe'},
    'ECU': {'continent': 'Americas', 'subregion': 'South America'},
    'EGY': {'continent': 'Africa', 'subregion': 'North Africa'},
    'EST': {'continent': 'Europe', 'subregion': 'Northern Europe'},
    'ETH': {'continent': 'Africa', 'subregion': 'East Africa'},
    'FIN': {'continent': 'Europe', 'subregion': 'Northern Europe'},
    'FRA': {'continent': 'Europe', 'subregion': 'Western Europe'},
    'DEU': {'continent': 'Europe', 'subregion': 'Western Europe'},
    'GHA': {'continent': 'Africa', 'subregion': 'West Africa'},
    'GRC': {'continent': 'Europe', 'subregion': 'Southern Europe'},
    'GTM': {'continent': 'Americas', 'subregion': 'Central America'},
    'HTI': {'continent': 'Americas', 'subregion': 'Caribbean'},
    'HND': {'continent': 'Americas', 'subregion': 'Central America'},
    'HUN': {'continent': 'Europe', 'subregion': 'Eastern Europe'},
    'ISL': {'continent': 'Europe', 'subregion': 'Northern Europe'},
    'IND': {'continent': 'Asia', 'subregion': 'South Asia'},
    'IDN': {'continent': 'Asia', 'subregion': 'Southeast Asia'},
    'IRN': {'continent': 'Asia', 'subregion': 'Middle East'},
    'IRQ': {'continent': 'Asia', 'subregion': 'Middle East'},
    'IRL': {'continent': 'Europe', 'subregion': 'Northern Europe'},
    'ISR': {'continent': 'Asia', 'subregion': 'Middle East'},
    'ITA': {'continent': 'Europe', 'subregion': 'Southern Europe'},
    'JAM': {'continent': 'Americas', 'subregion': 'Caribbean'},
    'JPN': {'continent': 'Asia', 'subregion': 'East Asia'},
    'JOR': {'continent': 'Asia', 'subregion': 'Middle East'},
    'KEN': {'continent': 'Africa', 'subregion': 'East Africa'},
    'PRK': {'continent': 'Asia', 'subregion': 'East Asia'},
    'KOR': {'continent': 'Asia', 'subregion': 'East Asia'},
    'LBN': {'continent': 'Asia', 'subregion': 'Middle East'},
    'LBY': {'continent': 'Africa', 'subregion': 'North Africa'},
    'LTU': {'continent': 'Europe', 'subregion': 'Northern Europe'},
    'MKD': {'continent': 'Europe', 'subregion': 'Southern Europe'},
    'MDG': {'continent': 'Africa', 'subregion': 'East Africa'},
    'MYS': {'continent': 'Asia', 'subregion': 'Southeast Asia'},
    'MLI': {'continent': 'Africa', 'subregion': 'West Africa'},
    'MEX': {'continent': 'Americas', 'subregion': 'Central America'},
    'MAR': {'continent': 'Africa', 'subregion': 'North Africa'},
    'MMR': {'continent': 'Asia', 'subregion': 'Southeast Asia'},
    'NPL': {'continent': 'Asia', 'subregion': 'South Asia'},
    'NLD': {'continent': 'Europe', 'subregion': 'Western Europe'},
    'NZL': {'continent': 'Oceania', 'subregion': 'Oceania'},
    'NIC': {'continent': 'Americas', 'subregion': 'Central America'},
    'NGA': {'continent': 'Africa', 'subregion': 'West Africa'},
    'NOR': {'continent': 'Europe', 'subregion': 'Northern Europe'},
    'PAK': {'continent': 'Asia', 'subregion': 'South Asia'},
    'PAN': {'continent': 'Americas', 'subregion': 'Central America'},
    'PRY': {'continent': 'Americas', 'subregion': 'South America'},
    'PER': {'continent': 'Americas', 'subregion': 'South America'},
    'PHL': {'continent': 'Asia', 'subregion': 'Southeast Asia'},
    'POL': {'continent': 'Europe', 'subregion': 'Eastern Europe'},
    'PRT': {'continent': 'Europe', 'subregion': 'Southern Europe'},
    'ROU': {'continent': 'Europe', 'subregion': 'Eastern Europe'},
    'RUS': {'continent': 'Europe', 'subregion': 'Eastern Europe'},
    'SAU': {'continent': 'Asia', 'subregion': 'Middle East'},
    'SRB': {'continent': 'Europe', 'subregion': 'Southern Europe'},
    'SVK': {'continent': 'Europe', 'subregion': 'Eastern Europe'},
    'SVN': {'continent': 'Europe', 'subregion': 'Southern Europe'},
    'ZAF': {'continent': 'Africa', 'subregion': 'Southern Africa'},
    'ESP': {'continent': 'Europe', 'subregion': 'Southern Europe'},
    'LKA': {'continent': 'Asia', 'subregion': 'South Asia'},
    'SDN': {'continent': 'Africa', 'subregion': 'North Africa'},
    'SWE': {'continent': 'Europe', 'subregion': 'Northern Europe'},
    'CHE': {'continent': 'Europe', 'subregion': 'Western Europe'},
    'SYR': {'continent': 'Asia', 'subregion': 'Middle East'},
    'THA': {'continent': 'Asia', 'subregion': 'Southeast Asia'},
    'TUN': {'continent': 'Africa', 'subregion': 'North Africa'},
    'TUR': {'continent': 'Asia', 'subregion': 'Middle East'},
    'UGA': {'continent': 'Africa', 'subregion': 'East Africa'},
    'UKR': {'continent': 'Europe', 'subregion': 'Eastern Europe'},
    'GBR': {'continent': 'Europe', 'subregion': 'Northern Europe'},
    'USA': {'continent': 'Americas', 'subregion': 'North America'},
    'URY': {'continent': 'Americas', 'subregion': 'South America'},
    'UZB': {'continent': 'Asia', 'subregion': 'Central Asia'},
    'VNM': {'continent': 'Asia', 'subregion': 'Southeast Asia'},
    'YEM': {'continent': 'Asia', 'subregion': 'Middle East'},
    'SUR': {'continent': 'Americas', 'subregion': 'South America'},
    'PSE': {'continent': 'Asia', 'subregion': 'Middle East'},
    'PLE': {'continent': 'Asia', 'subregion': 'Middle East'},
}

def init_database():
    """Initialize database from CSV file"""

    # Paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(script_dir, 'database.db')
    csv_path = os.path.join(script_dir, '..', 'children_combined_with_iso3.csv')

    # Delete old database if exists
    if os.path.exists(db_path):
        print(f"🗑️  Deleting old database: {db_path}")
        os.remove(db_path)

    # Create new database
    print(f"📦 Creating new database: {db_path}")
    conn = sqlite3.connect(db_path)
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
    print(f"📖 Reading CSV file: {csv_path}")
    countries = {}  # Track unique countries
    artworks_count = 0

    with open(csv_path, 'r', encoding='utf-8') as f:
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
    print(f"   - Database location: {db_path}")

if __name__ == '__main__':
    try:
        init_database()
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        import traceback
        traceback.print_exc()
