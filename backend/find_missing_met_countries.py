#!/usr/bin/env python3
"""
Find countries missing from met.csv and create a file with missing entries
"""

import csv
import os
from db_utils import get_db_connection

def get_all_countries_from_db():
    """Get all countries from the database"""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT iso3, name FROM countries ORDER BY iso3')
    all_countries = [dict(row) for row in cursor.fetchall()]

    conn.close()
    return all_countries

def get_existing_met_countries():
    """Get list of iso3 codes already in met.csv"""
    met_file = 'data/met.csv'
    existing_iso3 = set()

    if os.path.exists(met_file):
        with open(met_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                iso3 = row.get('iso3', '').strip()
                if iso3:
                    existing_iso3.add(iso3)

    return existing_iso3

def find_empty_countries():
    """Find countries with no images in any collection"""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Get countries that have at least one image using UNION
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
    return countries_with_images

def main():
    print("Finding countries missing from met.csv...")

    # Get all countries from database
    all_countries = get_all_countries_from_db()

    # Get countries already in met.csv
    existing_in_met = get_existing_met_countries()

    # Find missing countries
    missing_countries = [
        country for country in all_countries
        if country['iso3'] not in existing_in_met
    ]

    # Create output file with missing countries
    output_file = 'data/exports/missing_met_countries.csv'
    os.makedirs('data/exports', exist_ok=True)

    fieldnames = ['id', 'iso3', 'title', 'country', 'source_link']

    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        for country in missing_countries:
            writer.writerow({
                'id': '',
                'iso3': country['iso3'],
                'title': '',
                'country': country['name'],
                'source_link': ''
            })

    print(f"✅ Found {len(missing_countries)} countries missing from met.csv")
    print(f"📄 Exported to: {output_file}")

    # Also create the countries with no images report
    countries_with_images = find_empty_countries()
    empty_countries = [
        country for country in all_countries
        if country['iso3'] not in countries_with_images
    ]

    output_file2 = 'data/exports/countries_no_images.csv'
    with open(output_file2, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['iso3', 'name'])
        writer.writeheader()
        writer.writerows(empty_countries)

    print(f"\n✅ Found {len(empty_countries)} countries with no images")
    print(f"📄 Exported to: {output_file2}")

    print(f"\n📊 Summary:")
    print(f"  Total countries in database: {len(all_countries)}")
    print(f"  Countries already in met.csv: {len(existing_in_met)}")
    print(f"  Countries missing from met.csv: {len(missing_countries)}")
    print(f"  Countries with images: {len(all_countries) - len(empty_countries)}")
    print(f"  Countries without images: {len(empty_countries)}")

    if missing_countries:
        print(f"\n📋 Missing countries from met.csv (first 20):")
        for country in missing_countries[:20]:
            print(f"  {country['iso3']}: {country['name']}")

if __name__ == '__main__':
    main()
