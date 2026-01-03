"""
Diagnostic script to identify data consistency issues
Run: python3 diagnose_data.py
"""

import sqlite3
import csv

def diagnose():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    print("=" * 80)
    print("DATA CONSISTENCY DIAGNOSTIC")
    print("=" * 80)

    # Issue 1: Countries in quiz but not in dropdown
    print("\n1. COUNTRIES IN QUIZ BUT NOT IN DROPDOWN")
    print("-" * 80)
    
    cursor.execute('''
        SELECT c.iso3, c.name, c.subregion, c.include_in_quiz, 
               COUNT(a.id) as artwork_count
        FROM countries c
        LEFT JOIN artworks a ON c.iso3 = a.iso3
        WHERE c.include_in_quiz = 1 AND c.is_country = 0
        GROUP BY c.iso3
        ORDER BY c.name
    ''')
    
    results = cursor.fetchall()
    if results:
        print(f"Found {len(results)} territories marked as quiz countries (is_country=0):")
        for row in results:
            print(f"  {row['iso3']:5} | {row['name']:40} | {row['subregion']:20} | "
                  f"Artworks: {row['artwork_count']:3} | include_in_quiz: {row['include_in_quiz']}")
    else:
        print("✓ No issues found")

    # Issue 2: Countries missing from regions.js config
    print("\n2. COUNTRIES/TERRITORIES MISSING FROM regions.js")
    print("-" * 80)
    
    cursor.execute('''
        SELECT DISTINCT subregion
        FROM countries
        WHERE include_in_quiz = 1
        ORDER BY subregion
    ''')
    
    subregions = [row['subregion'] for row in cursor.fetchall()]
    
    # Hardcoded regions from regions.js
    configured_regions = [
        'Northern Africa', 'Western Africa', 'Middle Africa', 'Eastern Africa', 'Southern Africa', 'Sub-Saharan Africa',
        'Eastern Asia', 'Southeast Asia', 'Southern Asia', 'Central Asia', 'Western Asia',
        'Western Europe', 'Eastern Europe', 'Northern Europe', 'Southern Europe', 'Central Europe',
        'Northern America', 'Central America', 'Caribbean', 'South America', 'Latin America and the Caribbean',
        'Australia New Zealand Indo', 'Melanesia', 'Micronesia', 'Polynesia',
        'Africa', 'Asia', 'Europe', 'Oceania', 'Americas'
    ]
    
    missing = [s for s in subregions if s not in configured_regions]
    if missing:
        print(f"Found {len(missing)} subregions NOT in regions.js:")
        for subregion in missing:
            cursor.execute('''
                SELECT iso3, name
                FROM countries
                WHERE subregion = ? AND include_in_quiz = 1
                ORDER BY name
            ''', (subregion,))
            countries = cursor.fetchall()
            print(f"\n  {subregion}:")
            for c in countries:
                print(f"    - {c['iso3']:5} | {c['name']}")
    else:
        print("✓ All subregions configured in regions.js")

    # Issue 3: Check specific problem countries
    print("\n3. SPECIFIC PROBLEM COUNTRIES")
    print("-" * 80)
    
    problem_countries = ['SGS', 'MAF', 'CIW', 'GGY', 'COK', 'WLF', 'FRO']
    
    for iso3 in problem_countries:
        cursor.execute('''
            SELECT iso3, name, subregion, continent, is_country, include_in_quiz,
                   (SELECT COUNT(*) FROM artworks WHERE iso3 = countries.iso3) as artwork_count
            FROM countries
            WHERE iso3 = ?
        ''', (iso3,))
        
        row = cursor.fetchone()
        if row:
            print(f"\n{iso3} - {row['name']}")
            print(f"  Subregion: {row['subregion']}")
            print(f"  Continent: {row['continent']}")
            print(f"  is_country: {row['is_country']}")
            print(f"  include_in_quiz: {row['include_in_quiz']}")
            print(f"  Artworks: {row['artwork_count']}")
            
            # Check if in regions.js
            if row['subregion'] in configured_regions:
                print(f"  ✓ Subregion '{row['subregion']}' IS in regions.js")
            else:
                print(f"  ✗ Subregion '{row['subregion']}' NOT in regions.js")

    conn.close()

if __name__ == '__main__':
    diagnose()
