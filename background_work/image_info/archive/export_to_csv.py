#!/usr/bin/env python3
"""
Export metadata JSON files to CSV with English translations and M49 codes
"""

import json
import csv
import os
from pathlib import Path


def load_m49_data(m49_path='backend/data/m49-list.json'):
    """Load M49 country list and create French->English lookup."""
    with open(m49_path, 'r', encoding='utf-8') as f:
        m49_data = json.load(f)

    # Extract countries array
    countries = m49_data.get('countries', [])

    # Create lookup dictionary: French name -> country data
    french_lookup = {}
    for country in countries:
        if country.get('nameFR'):
            # Format m49code with zero padding
            m49code = country.get('m49code', '')
            if m49code:
                m49code = str(m49code).zfill(3)

            french_lookup[country['nameFR'].lower()] = {
                'name_en': country.get('name', ''),
                'm49code': m49code,
                'alpha2': country.get('alpha2', ''),
                'alpha3': country.get('alpha3', '')
            }

    return french_lookup


def translate_title_to_english(french_title):
    """
    Translate French title to English using basic rules.
    This is a simple translation - could be improved with a translation API.
    """
    if not french_title:
        return ""

    # Common French->English word replacements
    translations = {
        'femme': 'woman',
        'femmes': 'women',
        'homme': 'man',
        'hommes': 'men',
        'jeune': 'young',
        'jeunes': 'young',
        'fille': 'girl',
        'filles': 'girls',
        'garçon': 'boy',
        'garcons': 'boys',
        'enfant': 'child',
        'enfants': 'children',
        'portrait': 'portrait',
        'groupe': 'group',
        'costume': 'costume',
        'traditionnel': 'traditional',
        'traditionnelle': 'traditional',
        'deux': 'two',
        'trois': 'three',
        'une': 'a',
        'un': 'a',
        'de': 'of',
        'du': 'of the',
        'des': 'of the',
        'dans': 'in',
        'avec': 'with',
        'sur': 'on',
        'devant': 'in front of',
        'et': 'and',
        'ou': 'or',
        'le': 'the',
        'la': 'the',
        'les': 'the',
        'combattant': 'fighter',
        'druze': 'druze',
        'forces': 'forces',
        'arabes': 'arab',
        'royaume': 'kingdom',
        'marchand': 'merchant',
        'thé': 'tea',
        'bazar': 'bazaar',
        'photographie': 'photograph',
        'anthropologique': 'anthropological',
        'coiffure': 'hairstyle',
        'dévidage': 'reeling',
        'cocons': 'cocoons',
        'soie': 'silk',
        'grand': 'large',
        'dévidoir': 'reel',
    }

    words = french_title.lower().split()
    english_words = []

    for word in words:
        # Remove common punctuation
        clean_word = word.strip('.,;:!?()[]{}\'\"')
        translated = translations.get(clean_word, clean_word)
        english_words.append(translated.capitalize())

    return ' '.join(english_words)


def find_country_match(french_country, french_lookup):
    """
    Try to find matching country in M49 data.
    Uses fuzzy matching to handle variations.
    """
    if not french_country:
        return None

    french_lower = french_country.lower()

    # Direct match
    if french_lower in french_lookup:
        return french_lookup[french_lower]

    # Try partial matches
    for fr_name, country_data in french_lookup.items():
        if fr_name in french_lower or french_lower in fr_name:
            return country_data

    # Manual fallbacks for common variations
    fallbacks = {
        'afghanistan': {'name_en': 'Afghanistan', 'm49code': '004', 'alpha2': 'AF', 'alpha3': 'AFG'},
        'afrique': {'name_en': 'Africa', 'm49code': '', 'alpha2': '', 'alpha3': ''},
        'irak': {'name_en': 'Iraq', 'm49code': '368', 'alpha2': 'IQ', 'alpha3': 'IRQ'},
        'japon': {'name_en': 'Japan', 'm49code': '392', 'alpha2': 'JP', 'alpha3': 'JPN'},
        'cambodge': {'name_en': 'Cambodia', 'm49code': '116', 'alpha2': 'KH', 'alpha3': 'KHM'},
        'indochine': {'name_en': 'Indochina', 'm49code': '', 'alpha2': '', 'alpha3': ''},
        'france': {'name_en': 'France', 'm49code': '250', 'alpha2': 'FR', 'alpha3': 'FRA'},
        'egypte': {'name_en': 'Egypt', 'm49code': '818', 'alpha2': 'EG', 'alpha3': 'EGY'},
        'espagne': {'name_en': 'Spain', 'm49code': '724', 'alpha2': 'ES', 'alpha3': 'ESP'},
        'italie': {'name_en': 'Italy', 'm49code': '380', 'alpha2': 'IT', 'alpha3': 'ITA'},
        'grèce': {'name_en': 'Greece', 'm49code': '300', 'alpha2': 'GR', 'alpha3': 'GRC'},
        'grece': {'name_en': 'Greece', 'm49code': '300', 'alpha2': 'GR', 'alpha3': 'GRC'},
        'liban': {'name_en': 'Lebanon', 'm49code': '422', 'alpha2': 'LB', 'alpha3': 'LBN'},
        'palestine': {'name_en': 'Palestine', 'm49code': '275', 'alpha2': 'PS', 'alpha3': 'PSE'},
        'canada': {'name_en': 'Canada', 'm49code': '124', 'alpha2': 'CA', 'alpha3': 'CAN'},
        'inde': {'name_en': 'India', 'm49code': '356', 'alpha2': 'IN', 'alpha3': 'IND'},
        'indes': {'name_en': 'India', 'm49code': '356', 'alpha2': 'IN', 'alpha3': 'IND'},
        'algérie': {'name_en': 'Algeria', 'm49code': '012', 'alpha2': 'DZ', 'alpha3': 'DZA'},
        'algerie': {'name_en': 'Algeria', 'm49code': '012', 'alpha2': 'DZ', 'alpha3': 'DZA'},
        'maroc': {'name_en': 'Morocco', 'm49code': '504', 'alpha2': 'MA', 'alpha3': 'MAR'},
        'tunisie': {'name_en': 'Tunisia', 'm49code': '788', 'alpha2': 'TN', 'alpha3': 'TUN'},
        'mongolie': {'name_en': 'Mongolia', 'm49code': '496', 'alpha2': 'MN', 'alpha3': 'MNG'},
        'jordanie': {'name_en': 'Jordan', 'm49code': '400', 'alpha2': 'JO', 'alpha3': 'JOR'},
        'arabie': {'name_en': 'Saudi Arabia', 'm49code': '682', 'alpha2': 'SA', 'alpha3': 'SAU'},
        'albanie': {'name_en': 'Albania', 'm49code': '008', 'alpha2': 'AL', 'alpha3': 'ALB'},
        'tibet': {'name_en': 'Tibet', 'm49code': '', 'alpha2': '', 'alpha3': ''},
        'monténégro': {'name_en': 'Montenegro', 'm49code': '499', 'alpha2': 'ME', 'alpha3': 'MNE'},
        'montenegro': {'name_en': 'Montenegro', 'm49code': '499', 'alpha2': 'ME', 'alpha3': 'MNE'},
        'serbie': {'name_en': 'Serbia', 'm49code': '688', 'alpha2': 'RS', 'alpha3': 'SRB'},
        'hongrie': {'name_en': 'Hungary', 'm49code': '348', 'alpha2': 'HU', 'alpha3': 'HUN'},
        'iran': {'name_en': 'Iran', 'm49code': '364', 'alpha2': 'IR', 'alpha3': 'IRN'},
        'perse': {'name_en': 'Persia (Iran)', 'm49code': '364', 'alpha2': 'IR', 'alpha3': 'IRN'},
        'érythrée': {'name_en': 'Eritrea', 'm49code': '232', 'alpha2': 'ER', 'alpha3': 'ERI'},
        'erythree': {'name_en': 'Eritrea', 'm49code': '232', 'alpha2': 'ER', 'alpha3': 'ERI'},
        'chypre': {'name_en': 'Cyprus', 'm49code': '196', 'alpha2': 'CY', 'alpha3': 'CYP'},
        'bénin': {'name_en': 'Benin', 'm49code': '204', 'alpha2': 'BJ', 'alpha3': 'BEN'},
        'benin': {'name_en': 'Benin', 'm49code': '204', 'alpha2': 'BJ', 'alpha3': 'BEN'},
        'dahomey': {'name_en': 'Dahomey (Benin)', 'm49code': '204', 'alpha2': 'BJ', 'alpha3': 'BEN'},
        'turquie': {'name_en': 'Turkey', 'm49code': '792', 'alpha2': 'TR', 'alpha3': 'TUR'},
    }

    # Try fallback matches
    for key, data in fallbacks.items():
        if key in french_lower:
            return data

    return None


def export_metadata_to_csv(base_dir='images_by_location', output_csv='albert_kahn_metadata.csv'):
    """
    Export all metadata JSON files to CSV with English translations.
    """
    print(f"🔍 Loading M49 country data...")
    french_lookup = load_m49_data()

    print(f"📁 Searching for JSON files in: {base_dir}")
    json_files = list(Path(base_dir).rglob('*_metadata.json'))

    print(f"📊 Found {len(json_files)} JSON files to export\n")

    # Collect all data
    rows = []

    for json_path in json_files:
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                metadata = json.load(f)

            # Extract country from metadata
            french_country = metadata.get('country', '')

            # Look up country info
            country_info = find_country_match(french_country, french_lookup)

            if country_info:
                country_en = country_info['name_en']
                m49code = country_info['m49code']
                alpha2 = country_info['alpha2']
                alpha3 = country_info['alpha3']
                print(f"✅ {json_path.name}: {french_country} -> {country_en}")
            else:
                country_en = french_country  # Keep French if no match
                m49code = ''
                alpha2 = ''
                alpha3 = ''
                if french_country:
                    print(f"⚠️  {json_path.name}: No match for '{french_country}'")

            # Translate title
            french_title = metadata.get('title', '')
            english_title = translate_title_to_english(french_title)

            # Create row
            row = {
                'file_path': str(json_path),
                'image_filename': metadata.get('downloaded_filename', ''),
                'inventory_number': metadata.get('inventory_number', ''),
                'title_fr': french_title,
                'title_en': english_title,
                'location': metadata.get('location', ''),
                'country_fr': french_country,
                'country_en': country_en,
                'm49code': m49code,
                'alpha2': alpha2,
                'alpha3': alpha3,
                'operator': metadata.get('operator', ''),
                'author': metadata.get('author', ''),
                'mission': metadata.get('mission', ''),
                'date': metadata.get('date', ''),
                'theme': metadata.get('theme', ''),
                'sub_theme': metadata.get('sub_theme', ''),
                'description': metadata.get('description', ''),
                'domain': metadata.get('domain', ''),
                'process': metadata.get('process', ''),
                'support': metadata.get('support', ''),
                'denomination': metadata.get('denomination', ''),
                'format': metadata.get('format', ''),
                'dimensions': metadata.get('dimensions', ''),
                'ownership': metadata.get('ownership', ''),
                'license': metadata.get('license', ''),
                'page_url': metadata.get('page_url', ''),
                'image_url': metadata.get('image_url', ''),
            }

            rows.append(row)

        except Exception as e:
            print(f"❌ Error processing {json_path.name}: {e}")

    # Write CSV
    print(f"\n💾 Writing CSV: {output_csv}")

    fieldnames = [
        'file_path', 'image_filename', 'inventory_number',
        'title_fr', 'title_en',
        'location', 'country_fr', 'country_en',
        'm49code', 'alpha2', 'alpha3',
        'operator', 'author', 'mission', 'date',
        'theme', 'sub_theme', 'description',
        'domain', 'process', 'support', 'denomination',
        'format', 'dimensions', 'ownership', 'license',
        'page_url', 'image_url'
    ]

    with open(output_csv, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"\n{'='*60}")
    print(f"✅ Export complete!")
    print(f"{'='*60}")
    print(f"   Total records: {len(rows)}")
    print(f"   Output file: {output_csv}")
    print(f"{'='*60}\n")


def main():
    import argparse

    parser = argparse.ArgumentParser(
        description='Export metadata JSON files to CSV with English translations'
    )

    parser.add_argument(
        '--dir',
        default='images_by_location',
        help='Base directory containing metadata JSON files'
    )

    parser.add_argument(
        '--output',
        default='albert_kahn_metadata.csv',
        help='Output CSV filename'
    )

    args = parser.parse_args()

    if not os.path.exists(args.dir):
        print(f"❌ Directory not found: {args.dir}")
        return 1

    export_metadata_to_csv(args.dir, args.output)
    return 0


if __name__ == '__main__':
    exit(main())
