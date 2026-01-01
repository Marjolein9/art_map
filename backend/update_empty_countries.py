#!/usr/bin/env python3
"""
Find countries with no images in any collection and update met.csv
"""

import csv
import os
from db_utils import get_db_connection

def find_empty_countries():
    """Find countries with no images in any collection using SQL joins"""

    conn = get_db_connection()
    cursor = conn.cursor()

    # Get all countries
    cursor.execute('SELECT iso3, name FROM countries ORDER BY iso3')
    all_countries = [dict(row) for row in cursor.fetchall()]

    # Get countries that have at least one image using UNION to combine all image tables
    cursor.execute('''
        SELECT DISTINCT iso3 FROM albert_kahn_images
        UNION
        SELECT DISTINCT artist_iso3 AS iso3 FROM children_artwork_images WHERE artist_iso3 IS NOT NULL
        UNION
        SELECT DISTINCT iso3 FROM public_domain_images WHERE iso3 IS NOT NULL
        UNION
        SELECT DISTINCT iso3 FROM met_images WHERE iso3 IS NOT NULL
    ''')
    countries_with_images = {row['iso3'] for row in cursor.fetchall()}

    conn.close()

    # Find countries without any images
    empty_countries = [
        country for country in all_countries
        if country['iso3'] not in countries_with_images
    ]

    return empty_countries, all_countries

def read_existing_met_csv():
    """Read existing met.csv and return as dict keyed by iso3"""
    met_file = 'data/met.csv'
    existing_data = {}
    fieldnames = ['id', 'iso3', 'title', 'country', 'source_link']

    if os.path.exists(met_file):
        with open(met_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                iso3 = row.get('iso3', '').strip()
                if iso3:
                    # Only keep the documented fields
                    clean_row = {field: row.get(field, '').strip() for field in fieldnames}
                    existing_data[iso3] = clean_row

    return existing_data

def update_met_csv(all_countries):
    """Update met.csv to include all countries from countries table"""

    # Read existing met.csv data
    existing_data = read_existing_met_csv()

    # Track updates
    added_countries = []

    # Ensure all countries are in met.csv
    for country in all_countries:
        iso3 = country['iso3']
        if iso3 not in existing_data:
            # Add new entry with just iso3 and country name
            existing_data[iso3] = {
                'id': '',
                'iso3': iso3,
                'title': '',
                'country': country['name'],
                'source_link': ''
            }
            added_countries.append(country)

    # Write updated data back to met.csv
    met_file = 'data/met.csv'
    fieldnames = ['id', 'iso3', 'title', 'country', 'source_link']

    # Sort by iso3 for consistent ordering
    sorted_data = sorted(existing_data.values(), key=lambda x: x['iso3'])

    with open(met_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(sorted_data)

    return added_countries

def main():
    print("Finding countries with no images...")
    empty_countries, all_countries = find_empty_countries()

    # Output CSV with countries that have no images
    output_file = 'data/exports/countries_no_images.csv'
    os.makedirs('data/exports', exist_ok=True)

    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['iso3', 'name'])
        writer.writeheader()
        writer.writerows(empty_countries)

    print(f"\n✅ Found {len(empty_countries)} countries without images")
    print(f"📄 Exported to: {output_file}")

    # Update met.csv with all missing countries
    print("\nUpdating met.csv with all countries...")
    added_countries = update_met_csv(all_countries)

    if added_countries:
        print(f"✅ Added {len(added_countries)} new countries to met.csv")
        print(f"\nFirst 10 added countries:")
        for country in added_countries[:10]:
            print(f"  {country['iso3']}: {country['name']}")
    else:
        print("✅ All countries already present in met.csv")

    print(f"\n📊 Summary:")
    print(f"  Total countries: {len(all_countries)}")
    print(f"  Countries with images: {len(all_countries) - len(empty_countries)}")
    print(f"  Countries without images: {len(empty_countries)}")

    print(f"\n📋 Countries without images (first 20):")
    for country in empty_countries[:20]:
        print(f"  {country['iso3']}: {country['name']}")

if __name__ == '__main__':
    main()
