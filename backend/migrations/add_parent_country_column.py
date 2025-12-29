"""
Migration: Add parent_country_iso3 column and set parent relationships

This migration adds a new 'parent_country_iso3' column to the countries table
to store the parent country for overseas territories (e.g., Greenland → Denmark).

This enables displaying territories as "Territory (Parent Country)" in the UI.

Usage:
    python migrations/add_parent_country_column.py
"""
import sys
import os

# Add parent directory to path to import db_utils
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db_utils import execute_query


def run_migration():
    """Add parent_country_iso3 column and populate parent relationships"""

    print("=" * 60)
    print("MIGRATION: Add parent_country_iso3 column")
    print("=" * 60)

    # Step 1: Add column
    print("\n[1/5] Adding parent_country_iso3 column to countries table...")
    try:
        execute_query('''
            ALTER TABLE countries
            ADD COLUMN IF NOT EXISTS parent_country_iso3 TEXT
        ''', fetch='none')
        print("✅ Column added successfully")
    except Exception as e:
        print(f"❌ Error adding column: {e}")
        return False

    # Step 2: Add foreign key constraint
    print("\n[2/5] Adding foreign key constraint...")
    try:
        # Check if constraint already exists
        constraint_exists = execute_query('''
            SELECT EXISTS (
                SELECT 1 FROM pg_constraint
                WHERE conname = 'fk_parent_country'
            )
        ''', fetch='one')

        if not constraint_exists['exists']:
            execute_query('''
                ALTER TABLE countries
                ADD CONSTRAINT fk_parent_country
                FOREIGN KEY (parent_country_iso3) REFERENCES countries(iso3)
            ''', fetch='none')
            print("✅ Foreign key constraint added")
        else:
            print("✅ Foreign key constraint already exists")
    except Exception as e:
        print(f"❌ Error adding constraint: {e}")
        return False

    # Step 3: Create index
    print("\n[3/5] Creating index on parent_country_iso3...")
    try:
        execute_query('''
            CREATE INDEX IF NOT EXISTS idx_countries_parent
            ON countries(parent_country_iso3)
        ''', fetch='none')
        print("✅ Index created successfully")
    except Exception as e:
        print(f"❌ Error creating index: {e}")
        return False

    # Step 4: Populate parent relationships for the 7 clickable territories
    print("\n[4/5] Setting parent country relationships...")

    # Territory → Parent Country mappings
    # Only for the 7 territories with geometries that are included in quiz
    parent_mappings = [
        (['PYF', 'NCL'], 'FRA', 'France'),           # French territories
        (['GRL'], 'DNK', 'Denmark'),                  # Danish territories
        (['CUW', 'ABW'], 'NLD', 'Netherlands'),       # Dutch territories
        (['PRI', 'GUM'], 'USA', 'United States'),     # US territories
    ]

    total_updated = 0
    for territories, parent_iso3, parent_name in parent_mappings:
        try:
            placeholders = ', '.join(['%s'] * len(territories))
            execute_query(f'''
                UPDATE countries
                SET parent_country_iso3 = %s
                WHERE iso3 IN ({placeholders})
            ''', (parent_iso3, *territories), fetch='none')

            print(f"   ✅ {parent_name}: {', '.join(territories)}")
            total_updated += len(territories)
        except Exception as e:
            print(f"   ❌ Error updating {parent_name} territories: {e}")
            return False

    print(f"\n   Total territories updated: {total_updated}")

    # Step 5: Verify results
    print("\n[5/5] Verifying migration results...")
    try:
        result = execute_query('''
            SELECT
                c.iso3,
                c.common_name as territory_name,
                c.parent_country_iso3,
                p.common_name as parent_name
            FROM countries c
            LEFT JOIN countries p ON c.parent_country_iso3 = p.iso3
            WHERE c.parent_country_iso3 IS NOT NULL
            ORDER BY p.common_name, c.common_name
        ''')

        if result and len(result) > 0:
            print("\n" + "=" * 60)
            print("✅ MIGRATION COMPLETE!")
            print("=" * 60)
            print(f"\nTerritories with parent relationships ({len(result)}):\n")

            current_parent = None
            for row in result:
                parent_name = row['parent_name']
                if parent_name != current_parent:
                    if current_parent is not None:
                        print()  # blank line between groups
                    current_parent = parent_name

                display_name = f"{row['territory_name']} ({parent_name})"
                print(f"   {row['iso3']}: {display_name}")

            print("\n" + "=" * 60)
            return True
        else:
            print("❌ No parent relationships found after migration")
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
