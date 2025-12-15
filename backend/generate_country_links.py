#!/usr/bin/env python3
"""
Generate external links for all countries/territories in m49-list.json

Creates a CSV with verified links for:
- Gapminder Dollar Street
- TasteAtlas
"""

import json
import csv
import requests
import time
from pathlib import Path

# Try to import pycountry, install if needed
try:
    import pycountry
except ImportError:
    print("Installing pycountry...")
    import subprocess
    subprocess.check_call(['pip3', 'install', 'pycountry'])
    import pycountry

def verify_url(url, timeout=5, check_content=None):
    """
    Check if URL returns 200 OK and optionally verify content

    Args:
        url: URL to check
        timeout: Request timeout in seconds
        check_content: Optional string to search for in response (for negative check, prefix with '!')

    Returns:
        True if URL is valid and passes content check, False otherwise
    """
    try:
        # Use GET instead of HEAD to check actual content
        response = requests.get(url, timeout=timeout, allow_redirects=True, headers={
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        })

        if response.status_code != 200:
            return False

        # If content check is specified
        if check_content:
            content = response.text.lower()
            # Negative check (content should NOT contain this)
            if check_content.startswith('!'):
                search_term = check_content[1:].lower()
                if search_term in content:
                    return False
            # Positive check (content should contain this)
            else:
                if check_content.lower() not in content:
                    return False

        return True
    except Exception as e:
        return False

def get_tasteatlas_name(country_name, alpha2=None):
    """
    Try to get the common name for TasteAtlas URL
    TasteAtlas uses lowercase country names with hyphens
    Examples:
    - New Zealand -> new-zealand
    - United States -> usa
    - Czech Republic -> czech-republic
    """
    # Try pycountry first to get official name
    if alpha2:
        try:
            country = pycountry.countries.get(alpha_2=alpha2)
            if country:
                name = country.name.lower().replace(' ', '-')
                # Remove special characters and clean up
                name = ''.join(c for c in name if c.isalnum() or c == '-')
                # Remove duplicate hyphens
                while '--' in name:
                    name = name.replace('--', '-')
                name = name.strip('-')
            else:
                name = country_name.lower().replace(' ', '-')
        except:
            name = country_name.lower().replace(' ', '-')
    else:
        name = country_name.lower().replace(' ', '-')

    # Clean up name
    name = ''.join(c for c in name if c.isalnum() or c == '-')
    while '--' in name:
        name = name.replace('--', '-')
    name = name.strip('-')

    # Special cases for TasteAtlas
    replacements = {
        'united-states-of-america': 'usa',
        'united-states': 'usa',
        'united-kingdom-of-great-britain-and-northern-ireland': 'united-kingdom',
        'viet-nam': 'vietnam',
        'republic-of-korea': 'south-korea',
        'korea-republic-of': 'south-korea',
        "democratic-peoples-republic-of-korea": 'north-korea',
        'russian-federation': 'russia',
        'iran-islamic-republic-of': 'iran',
        'bolivia-plurinational-state-of': 'bolivia',
        'venezuela-bolivarian-republic-of': 'venezuela',
        'tanzania-united-republic-of': 'tanzania',
        'congo-democratic-republic-of-the': 'democratic-republic-of-congo',
        'republic-of-moldova': 'moldova',
        'cte-divoire': 'ivory-coast',
        'lao-peoples-democratic-republic': 'laos',
        'syrian-arab-republic': 'syria',
        'czechia': 'czech-republic',
    }

    return replacements.get(name, name)

def generate_links(entity):
    """Generate external links for an entity (no verification - sites are JavaScript-rendered or block bots)"""
    alpha2 = entity.get('alpha2', '').lower()
    alpha3 = entity.get('alpha3', '')
    name = entity.get('name', '')

    links = {
        'gapminder_url': '',
        'tasteatlas_url': '',
        'extra_links': ''  # User can manually add additional links here
    }

    # Skip if no alpha2 (regional groups)
    if not alpha2:
        print(f"  ⏭️  Skipping (no ISO2 code)")
        return links

    # Generate Gapminder Dollar Street URL
    gapminder_url = f"https://www.gapminder.org/dollar-street?countries={alpha2}"
    links['gapminder_url'] = gapminder_url
    print(f"  Gapminder: {gapminder_url}")

    # Generate TasteAtlas URL
    tasteatlas_name = get_tasteatlas_name(name, alpha2.upper() if alpha2 else None)
    tasteatlas_url = f"https://www.tasteatlas.com/{tasteatlas_name}/maps"
    links['tasteatlas_url'] = tasteatlas_url
    print(f"  TasteAtlas: {tasteatlas_url}")

    return links

def main():
    # Load m49 data
    script_dir = Path(__file__).parent
    m49_path = script_dir / 'data' / 'm49-list.json'

    print(f"📥 Loading data from {m49_path}")
    with open(m49_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    countries = data.get('countries', [])
    print(f"✅ Found {len(countries)} entities\n")

    # Generate links for each country
    results = []
    for i, entity in enumerate(countries, 1):
        alpha3 = entity.get('alpha3', '')
        alpha2 = entity.get('alpha2', '')
        name = entity.get('name', '')
        m49code = entity.get('m49code', '')

        print(f"[{i}/{len(countries)}] {name} ({alpha3})")

        links = generate_links(entity)

        results.append({
            'iso3': alpha3,
            'iso2': alpha2,
            'name': name,
            'm49code': m49code,
            'gapminder_url': links['gapminder_url'],
            'tasteatlas_url': links['tasteatlas_url'],
            'extra_links': links.get('extra_links', '')
        })

        print()  # Blank line between countries

    # Write to CSV
    output_path = script_dir / 'data' / 'country_external_links.csv'
    print(f"\n💾 Writing results to {output_path}")

    # Only include countries with ISO2 code (which have links)
    results_with_links = [r for r in results if r.get('iso2', '')]

    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        fieldnames = ['iso3', 'iso2', 'name', 'm49code', 'gapminder_url', 'tasteatlas_url', 'extra_links']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(results_with_links)

    # Print summary
    gapminder_count = sum(1 for r in results_with_links if r.get('gapminder_url'))
    tasteatlas_count = sum(1 for r in results_with_links if r.get('tasteatlas_url'))
    both_count = sum(1 for r in results_with_links if r.get('gapminder_url') and r.get('tasteatlas_url'))

    print(f"\n✅ Done!")
    print(f"   Total entities: {len(results)}")
    print(f"   Entities with ISO2 codes: {len(results_with_links)}")
    print(f"   Gapminder links generated: {gapminder_count}")
    print(f"   TasteAtlas links generated: {tasteatlas_count}")
    print(f"   Countries with both links: {both_count}")
    print(f"\n📄 CSV saved to: {output_path}")
    print(f"\nNote: Links are generated without verification.")
    print(f"You can manually verify or edit the CSV if needed.")

if __name__ == '__main__':
    main()
