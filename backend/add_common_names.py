#!/usr/bin/env python3
"""
Add common country names to the database using pycountry

This script:
1. Reads countries from the database
2. Uses pycountry to get common names
3. Adds a common_name column if it doesn't exist
4. Updates all countries with their common names
"""

import os
import psycopg2
from psycopg2.extras import RealDictCursor

# Try to import pycountry, install if needed
try:
    import pycountry
except ImportError:
    print("Installing pycountry...")
    import subprocess
    subprocess.check_call(['pip3', 'install', 'pycountry'])
    import pycountry

def get_common_name(official_name, iso3, iso2):
    """
    Get the common name for a country using pycountry

    Args:
        official_name: Official name from M49
        iso3: ISO 3166-1 alpha-3 code
        iso2: ISO 2166-1 alpha-2 code

    Returns:
        Common name string
    """
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

    # Try pycountry lookup
    if iso2:
        try:
            country = pycountry.countries.get(alpha_2=iso2.upper())
            if country:
                # Use common_name if available, otherwise name
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

    # Remove parenthetical information
    if '(' in name:
        name = name.split('(')[0].strip()

    # Common replacements
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

def main():
    # Get DATABASE_URL from environment
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ ERROR: DATABASE_URL environment variable not set!")
        print("Usage: export DATABASE_URL='postgresql://user:pass@host:port/dbname'")
        exit(1)

    # Handle Render's postgres:// URL format
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)

    # Add SSL parameters to URL for Render PostgreSQL
    if '?' in database_url:
        database_url += '&sslmode=require'
    else:
        database_url += '?sslmode=require'

    print("📦 Connecting to PostgreSQL database...")
    conn = psycopg2.connect(database_url)
    conn.autocommit = False
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    # Check if common_name column exists
    cursor.execute("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name='countries' AND column_name='common_name'
    """)

    if not cursor.fetchone():
        print("➕ Adding common_name column to countries table...")
        cursor.execute("ALTER TABLE countries ADD COLUMN common_name TEXT")
        conn.commit()
    else:
        print("✅ common_name column already exists")

    # Get all countries
    cursor.execute("SELECT iso3, iso2, name FROM countries ORDER BY name")
    countries = cursor.fetchall()

    print(f"\n🌍 Processing {len(countries)} countries...\n")

    updated = 0
    for country in countries:
        iso3 = country['iso3']
        iso2 = country['iso2']
        official_name = country['name']

        common_name = get_common_name(official_name, iso3, iso2)

        # Update database
        cursor.execute(
            "UPDATE countries SET common_name = %s WHERE iso3 = %s",
            (common_name, iso3)
        )

        if common_name != official_name:
            print(f"✏️  {iso3}: '{official_name}' → '{common_name}'")
        else:
            print(f"✓  {iso3}: '{official_name}' (no change)")

        updated += 1

    conn.commit()

    print(f"\n✅ Done! Updated {updated} countries with common names")

    # Show some examples
    print("\n📊 Sample results:")
    cursor.execute("""
        SELECT iso3, name as official_name, common_name
        FROM countries
        WHERE name != common_name
        ORDER BY name
        LIMIT 10
    """)

    samples = cursor.fetchall()
    for sample in samples:
        print(f"  {sample['iso3']}: {sample['official_name']} → {sample['common_name']}")

    conn.close()

if __name__ == '__main__':
    main()
