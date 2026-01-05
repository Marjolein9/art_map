#!/usr/bin/env python3
"""
Add Nudity column from met.csv to met_metadata.csv
"""

import csv

MET_CSV_PATH = "data/met.csv"
MET_METADATA_CSV_PATH = "data/met_metadata.csv"
OUTPUT_CSV_PATH = "data/met_metadata.csv"

def add_nudity_column():
    """Add nudity column from met.csv to met_metadata.csv"""

    # Step 1: Read met.csv and create a mapping from object_id to nudity value
    print(f"📖 Reading {MET_CSV_PATH}...")
    nudity_map = {}

    with open(MET_CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            source_link = row.get('source_link', '').strip()
            nudity_value = row.get('Nudity', '').strip()

            if source_link and '/search/' in source_link:
                # Extract object_id from URL
                try:
                    object_id = source_link.rstrip('/').split('/')[-1]
                    if object_id.isdigit() and nudity_value:
                        nudity_map[object_id] = nudity_value
                except (ValueError, TypeError):
                    continue

    print(f"✓ Found {len(nudity_map)} nudity values")

    # Step 2: Read met_metadata.csv
    print(f"📖 Reading {MET_METADATA_CSV_PATH}...")
    rows = []

    with open(MET_METADATA_CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames

        # Check if nudity column already exists
        if 'nudity' in fieldnames:
            print("⚠️  Nudity column already exists in met_metadata.csv")
            # Still update values
            for row in reader:
                object_id = row.get('object_id', '').strip()
                row['nudity'] = nudity_map.get(object_id, '')
                rows.append(row)
        else:
            # Add nudity column to fieldnames
            # Insert nudity after culture, before object_url
            new_fieldnames = []
            for field in fieldnames:
                new_fieldnames.append(field)
                if field == 'culture':
                    new_fieldnames.append('nudity')
            fieldnames = new_fieldnames

            for row in reader:
                object_id = row.get('object_id', '').strip()
                row['nudity'] = nudity_map.get(object_id, '')
                rows.append(row)

    print(f"✓ Read {len(rows)} rows from met_metadata.csv")

    # Step 3: Write updated met_metadata.csv
    print(f"📝 Writing updated {OUTPUT_CSV_PATH}...")

    with open(OUTPUT_CSV_PATH, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"✓ Wrote {len(rows)} rows to {OUTPUT_CSV_PATH}")

    # Show summary
    nudity_count = sum(1 for row in rows if row.get('nudity', '').strip())
    print(f"\n✅ Done!")
    print(f"   - Total rows: {len(rows)}")
    print(f"   - Rows with nudity data: {nudity_count}")

if __name__ == "__main__":
    add_nudity_column()
