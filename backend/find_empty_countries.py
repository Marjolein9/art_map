#!/usr/bin/env python3
"""
Find all countries that have no images in any collection
and export them to a CSV file
"""

import csv
from db_utils import get_db_connection

def find_empty_countries():
    """Find countries with no images in any collection"""

    conn = get_db_connection()
    cursor = conn.cursor()

    # Get all countries
    cursor.execute('SELECT iso3, name FROM countries ORDER BY name')
    all_countries = [dict(row) for row in cursor.fetchall()]

    # Get countries that have at least one image
    cursor.execute('''
        SELECT DISTINCT alpha3 FROM albert_kahn_images
        UNION
        SELECT DISTINCT alpha3 FROM children_artwork_images
        UNION
        SELECT DISTINCT alpha3 FROM public_domain_images
    ''')
    countries_with_images = {row[0] for row in cursor.fetchall()}

    conn.close()

    # Find countries without any images
    empty_countries = [
        country for country in all_countries
        if country['iso3'] not in countries_with_images
    ]

    return empty_countries

def main():
    empty_countries = find_empty_countries()

    # Write to CSV
    output_file = 'data/exports/empty_countries.csv'
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['iso3', 'name'])
        writer.writeheader()
        writer.writerows(empty_countries)

    print(f"✅ Found {len(empty_countries)} countries without images")
    print(f"📄 Exported to: {output_file}")
    print(f"\nFirst 10 empty countries:")
    for country in empty_countries[:10]:
        print(f"  {country['iso3']}: {country['name']}")

if __name__ == '__main__':
    main()
