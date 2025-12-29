"""
Migration: Add include_in_quiz column and set initial values

This migration adds a new 'include_in_quiz' boolean column to the countries table
and populates it with initial values based on sovereignty status and territory selection.

Usage:
    python migrations/add_include_in_quiz.py
"""
import sys
import os

# Add parent directory to path to import db_utils
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db_utils import execute_query


def run_migration():
    """Add include_in_quiz column and populate initial values"""

    print("=" * 60)
    print("MIGRATION: Add include_in_quiz column")
    print("=" * 60)

    # Step 1: Add column
    print("\n[1/4] Adding include_in_quiz column to countries table...")
    try:
        execute_query('''
            ALTER TABLE countries
            ADD COLUMN IF NOT EXISTS include_in_quiz BOOLEAN DEFAULT FALSE
        ''', fetch='none')
        print("✅ Column added successfully")
    except Exception as e:
        print(f"❌ Error adding column: {e}")
        return False

    # Step 2: Set TRUE for all sovereign countries
    print("\n[2/4] Setting include_in_quiz = TRUE for sovereign countries...")
    try:
        result = execute_query('''
            UPDATE countries
            SET include_in_quiz = TRUE
            WHERE is_country = TRUE
        ''', fetch='none')
        print("✅ Sovereign countries updated")
    except Exception as e:
        print(f"❌ Error updating sovereign countries: {e}")
        return False

    # Step 3: Set TRUE for selected territories (major territories > 100k population)
    print("\n[3/4] Including selected overseas territories...")
    territories_to_include = [
        'GUF',  # French Guiana (South America) - ~300k
        'GRL',  # Greenland (Northern America) - ~56k*
        'PRI',  # Puerto Rico (Caribbean) - ~3.2M
        'REU',  # Réunion (Eastern Africa) - ~860k
        'GLP',  # Guadeloupe (Caribbean) - ~400k
        'MTQ',  # Martinique (Caribbean) - ~375k
        'PYF',  # French Polynesia (Oceania/Polynesia) - ~280k
        'MYT',  # Mayotte (Eastern Africa) - ~270k
        'NCL',  # New Caledonia (Oceania/Melanesia) - ~270k
        'CUW',  # Curaçao (Caribbean) - ~160k
        'ABW',  # Aruba (Caribbean) - ~110k
        'GUM',  # Guam (Oceania/Micronesia) - ~170k
    ]

    print(f"   Adding {len(territories_to_include)} territories to quiz pool:")
    for iso3 in territories_to_include:
        print(f"   - {iso3}")

    try:
        placeholders = ', '.join(['%s'] * len(territories_to_include))
        execute_query(f'''
            UPDATE countries
            SET include_in_quiz = TRUE
            WHERE iso3 IN ({placeholders})
        ''', tuple(territories_to_include), fetch='none')
        print("✅ Territories updated successfully")
    except Exception as e:
        print(f"❌ Error updating territories: {e}")
        return False

    # Step 4: Verify results
    print("\n[4/4] Verifying migration results...")
    try:
        result = execute_query('''
            SELECT
                COUNT(*) FILTER (WHERE include_in_quiz = TRUE AND is_country = TRUE) as countries,
                COUNT(*) FILTER (WHERE include_in_quiz = TRUE AND is_country = FALSE) as territories,
                COUNT(*) as total
            FROM countries
        ''')

        if result and len(result) > 0:
            countries_count = result[0].get('countries', 0)
            territories_count = result[0].get('territories', 0)
            total_count = result[0].get('total', 0)

            print("\n" + "=" * 60)
            print("✅ MIGRATION COMPLETE!")
            print("=" * 60)
            print(f"Sovereign countries included: {countries_count}")
            print(f"Territories included:         {territories_count}")
            print(f"Total quiz pool:              {countries_count + territories_count}")
            print(f"Total countries in database:  {total_count}")
            print("=" * 60)
            return True
        else:
            print("❌ Could not verify results")
            return False
    except Exception as e:
        print(f"❌ Error verifying results: {e}")
        return False


if __name__ == '__main__':
    print("\nStarting migration...\n")
    success = run_migration()

    if success:
        print("\n✅ Migration completed successfully!")
        sys.exit(0)
    else:
        print("\n❌ Migration failed!")
        sys.exit(1)
