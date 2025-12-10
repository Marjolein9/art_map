#!/usr/bin/env python3
"""
Fill missing Alpha Code values in public_review_images.csv
by matching country names to M49 data
"""

import csv
import json
from config import M49_JSON_PATH, PUBLIC_DOMAIN_CSV_PATH

def load_m49_mapping():
    """Load M49 data and create country name -> ISO3 mapping"""
    print(f"📥 Loading UN M49 data from: {M49_JSON_PATH}")

    with open(M49_JSON_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Create mapping: country name -> ISO3 code
    name_to_iso3 = {}
    for country in data['countries']:
        alpha3 = country.get('alpha3')
        name = country.get('name')
        if alpha3 and name:
            name_to_iso3[name] = alpha3

    # Add custom mappings for common variations
    name_to_iso3['United States'] = 'USA'
    name_to_iso3['Palestine'] = 'PSE'
    name_to_iso3['Russia'] = 'RUS'

    print(f"✅ Loaded {len(name_to_iso3)} country mappings")
    return name_to_iso3

def fill_alpha_codes():
    """Fill missing Alpha Code values in public_review_images.csv"""

    # Load M49 mapping
    name_to_iso3 = load_m49_mapping()

    # Read CSV
    print(f"📄 Reading: {PUBLIC_DOMAIN_CSV_PATH}")
    rows = []
    with open(PUBLIC_DOMAIN_CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames

        for row in reader:
            rows.append(row)

    # Fill missing alpha codes
    updated_count = 0
    for row in rows:
        country_name = row.get('Country', '').strip()
        alpha_code = row.get('Alpha Code', '').strip()

        # If Alpha Code is missing but Country name exists
        if country_name and not alpha_code:
            # Try to find matching ISO3 code
            if country_name in name_to_iso3:
                row['Alpha Code'] = name_to_iso3[country_name]
                print(f"  ✏️  Updated: {country_name} -> {name_to_iso3[country_name]}")
                updated_count += 1
            else:
                print(f"  ⚠️  No mapping found for: {country_name}")

    # Write back to CSV
    print(f"\n💾 Writing updated CSV: {PUBLIC_DOMAIN_CSV_PATH}")
    with open(PUBLIC_DOMAIN_CSV_PATH, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"\n✅ Updated {updated_count} rows with missing Alpha Codes")

if __name__ == '__main__':
    try:
        fill_alpha_codes()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
