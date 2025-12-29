#!/usr/bin/env python3
"""
TopoJSON Territory Verification Script

Checks if the 12 overseas territories have geometries in the TopoJSON files.
If territories are missing, indicates that new TopoJSON files need to be downloaded.
"""
import json
import os

# M49 codes for the 12 territories we need
REQUIRED_TERRITORIES = {
    254: 'GUF - French Guiana',
    304: 'GRL - Greenland',
    630: 'PRI - Puerto Rico',
    638: 'REU - Réunion',
    312: 'GLP - Guadeloupe',
    474: 'MTQ - Martinique',
    258: 'PYF - French Polynesia',
    175: 'MYT - Mayotte',
    540: 'NCL - New Caledonia',
    531: 'CUW - Curaçao',
    533: 'ABW - Aruba',
    316: 'GUM - Guam'
}


def verify_topojson(filepath):
    """
    Verify if a TopoJSON file contains all required territories.

    Args:
        filepath: Path to the TopoJSON file

    Returns:
        tuple: (bool success, set missing_codes)
    """
    print(f"\n{'='*70}")
    print(f"Checking: {filepath}")
    print(f"{'='*70}")

    # Check if file exists
    if not os.path.exists(filepath):
        print(f"❌ File not found: {filepath}")
        return False, set(REQUIRED_TERRITORIES.keys())

    # Load TopoJSON
    try:
        with open(filepath, 'r') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON in {filepath}: {e}")
        return False, set(REQUIRED_TERRITORIES.keys())
    except Exception as e:
        print(f"❌ Error reading {filepath}: {e}")
        return False, set(REQUIRED_TERRITORIES.keys())

    # Extract geometries
    try:
        geometries = data['objects']['countries']['geometries']
    except KeyError as e:
        print(f"❌ Invalid TopoJSON structure (missing key: {e})")
        return False, set(REQUIRED_TERRITORIES.keys())

    # Find M49 codes present in file
    found_codes = set()
    for geometry in geometries:
        if 'id' in geometry:
            # M49 codes are stored as strings or integers
            try:
                m49 = int(geometry['id'])
                found_codes.add(m49)
            except (ValueError, TypeError):
                continue

    # Check for missing territories
    required_codes = set(REQUIRED_TERRITORIES.keys())
    missing_codes = required_codes - found_codes
    found_territory_codes = required_codes & found_codes

    # Report results
    print(f"\nTotal features in file: {len(geometries)}")
    print(f"Territories found: {len(found_territory_codes)}/12")
    print(f"Territories missing: {len(missing_codes)}/12")

    if found_territory_codes:
        print(f"\n✅ Found territories:")
        for code in sorted(found_territory_codes):
            print(f"   M49 {code}: {REQUIRED_TERRITORIES[code]}")

    if missing_codes:
        print(f"\n❌ Missing territories:")
        for code in sorted(missing_codes):
            print(f"   M49 {code}: {REQUIRED_TERRITORIES[code]}")

    success = len(missing_codes) == 0
    if success:
        print(f"\n🎉 All 12 territories present!")
    else:
        print(f"\n⚠️  {len(missing_codes)} territories missing - new TopoJSON needed")

    return success, missing_codes


def main():
    """Main verification function"""
    # Get script directory and navigate to frontend/public/geo
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    geo_dir = os.path.join(project_root, 'frontend', 'public', 'geo')

    files_to_check = [
        os.path.join(geo_dir, 'countries-110m.json'),
        os.path.join(geo_dir, 'countries-50m.json')
    ]

    print("\n" + "="*70)
    print("TOPOJSON TERRITORY VERIFICATION")
    print("="*70)
    print(f"Checking for 12 overseas territories...")
    print(f"Geo directory: {geo_dir}")

    results = {}
    for filepath in files_to_check:
        filename = os.path.basename(filepath)
        success, missing = verify_topojson(filepath)
        results[filename] = (success, missing)

    # Summary
    print("\n" + "="*70)
    print("SUMMARY")
    print("="*70)

    all_territories_found = all(success for success, _ in results.values())

    for filename, (success, missing) in results.items():
        status = "✅ COMPLETE" if success else f"❌ MISSING {len(missing)} territories"
        print(f"{filename}: {status}")

    if all_territories_found:
        print(f"\n🎉 SUCCESS: All territories found in both files!")
        print(f"   No action needed - existing TopoJSON files are complete.")
        return 0
    else:
        print(f"\n⚠️  ACTION REQUIRED: Download new TopoJSON files")
        print(f"\n   Run these commands:")
        print(f"   cd {geo_dir}")
        print(f"   mv countries-50m.json countries-50m.json.bak")
        print(f"   mv countries-110m.json countries-110m.json.bak")
        print(f"   curl -o countries-50m.json https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json")
        print(f"   curl -o countries-110m.json https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
        print(f"\n   Then run this script again to verify.")
        return 1


if __name__ == '__main__':
    exit(main())
