#!/usr/bin/env python3
"""
Add common country names and is_country flag to m49-list.json

This script updates the source of truth (m49-list.json) with:
1. common_name - user-friendly country names using pycountry
2. is_country - boolean flag indicating if the entry is a sovereign country (based on countries.json)

REFACTORING NOTE: This script now uses CountryNameNormalizer from utils/country_transformations.py
Before: Transformation logic was mixed with file I/O
After: Business logic extracted to reusable utility class

Benefits:
- Can test transformations independently
- Can reuse in other scripts (data imports, validation)
- Easier to understand and maintain

After running this script, re-run init_database_postgres.py to update the database.
"""

import json
from pathlib import Path

# Try to import pycountry, install if needed
try:
    import pycountry
except ImportError:
    print("Installing pycountry...")
    import subprocess
    subprocess.check_call(['pip3', 'install', 'pycountry'])
    import pycountry

# Import the transformation utility
from utils.country_transformations import CountryNameNormalizer

# File paths
SCRIPT_DIR = Path(__file__).parent
M49_JSON_PATH = SCRIPT_DIR / 'data' / 'm49-list.json'
COUNTRIES_JSON_PATH = SCRIPT_DIR / 'data' / 'countries.json'

def get_common_name(official_name, iso3, iso2):
    """
    Get the common name for a country using pycountry
    
    REFACTORING: Now delegates to CountryNameNormalizer utility
    This function is kept for backward compatibility but uses the new utility class.

    Args:
        official_name: Official name from M49
        iso3: ISO 3166-1 alpha-3 code
        iso2: ISO 2166-1 alpha-2 code

    Returns:
        Common name string
    """
    return CountryNameNormalizer.normalize(official_name, iso3, iso2)

def main():
    print("📥 Loading m49-list.json...")
    with open(M49_JSON_PATH, 'r', encoding='utf-8') as f:
        m49_data = json.load(f)

    print(f"✅ Loaded {len(m49_data['countries'])} entries from m49-list.json")

    print("\n📥 Loading countries.json...")
    with open(COUNTRIES_JSON_PATH, 'r', encoding='utf-8') as f:
        countries_data = json.load(f)

    print(f"✅ Loaded {len(countries_data)} sovereign countries from countries.json")

    # Create a set of M49 codes that are sovereign countries
    sovereign_m49_codes = {entry['id'] for entry in countries_data}
    print(f"\n🌍 {len(sovereign_m49_codes)} sovereign country M49 codes identified")

    print("\n🔄 Processing entries...\n")

    updated_count = 0
    common_name_changes = 0

    for entry in m49_data['countries']:
        m49_code = entry.get('m49code')
        iso3 = entry.get('iso3', '').upper() if entry.get('iso3') else None
        alpha2 = entry.get('alpha2', '').upper() if entry.get('alpha2') else None
        official_name = entry.get('name', '')

        # Add is_country field
        entry['is_country'] = m49_code in sovereign_m49_codes

        # Get common name
        common_name = get_common_name(official_name, iso3, alpha2)

        # Add common_name field
        entry['common_name'] = common_name

        # Track changes
        if common_name != official_name:
            print(f"✏️  {iso3 or 'N/A':3s} (M49:{m49_code:3d}): '{official_name}' → '{common_name}' [{'Country' if entry['is_country'] else 'Territory/Region'}]")
            common_name_changes += 1
        else:
            print(f"✓  {iso3 or 'N/A':3s} (M49:{m49_code:3d}): '{official_name}' [{'Country' if entry['is_country'] else 'Territory/Region'}]")

        updated_count += 1

    # Write updated data back to m49-list.json
    print(f"\n💾 Writing updated data to {M49_JSON_PATH}...")
    with open(M49_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(m49_data, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Done! Updated {updated_count} entries:")
    print(f"   - {common_name_changes} entries with common name changes")
    print(f"   - {len(sovereign_m49_codes)} entries marked as sovereign countries")
    print(f"   - {updated_count - len(sovereign_m49_codes)} entries marked as territories/regions")
    print(f"\n📝 Next step: Run 'python3 init_database_postgres.py' to update the database")

if __name__ == '__main__':
    main()
