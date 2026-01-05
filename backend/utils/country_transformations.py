"""
Country Name Transformation Utilities

This module provides reusable functions and classes for standardizing country names
and enriching country records with common names and sovereignty information.

REFACTORING INSIGHT: Data Transformation as First-Class Concept
==============================================================

Before: Transformation logic was mixed with file I/O in add_common_names.py
After: Extracted into pure functions and classes for reusability

Why this matters:
- Can test transformations without reading/writing files
- Can use same logic in multiple scripts (imports, exports, data cleaning)
- Easier to reason about and maintain
- Pure functions are predictable and composable

Design Pattern: Fallback Strategy
==================================
When transforming country names, we try multiple approaches:
1. Check special_cases dictionary (manually curated exceptions)
2. Try pycountry library lookup by ISO2, then ISO3
3. Fallback to string cleanup (remove titles, parentheses)
4. Return as-is if all else fails

This pattern handles edge cases gracefully:
- Countries with non-standard names (USA → United States)
- Outdated official names (Czechoslovakia → Czech Republic)
- Incomplete data (missing ISO codes)
"""

from typing import List, Dict, Optional
import logging

try:
    import pycountry
except ImportError:
    pycountry = None

# Configure logging
logger = logging.getLogger(__name__)


class CountryNameNormalizer:
    """
    Handles all country name transformations with fallback strategies.
    
    This class centralizes country name standardization logic.
    Previously scattered across add_common_names.py, now reusable everywhere.
    
    INTERVIEW PREP: Why Use a Class Here?
    =====================================
    We could use functions, but a class offers:
    1. Encapsulation: SPECIAL_CASES data stays with the transformation logic
    2. Extensibility: Easy to add new methods (validate_name, batch_transform, etc.)
    3. Testability: Can instantiate and mock in tests
    4. Namespace: Avoids name collisions in imports
    
    Example:
        normalizer = CountryNameNormalizer()
        name = normalizer.normalize('United States of America', 'USA', 'US')
        # Returns: 'United States'
    """
    
    # Special cases where pycountry doesn't have the best common name
    # These are manually curated based on user expectations
    SPECIAL_CASES = {
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
    
    # Prefixes to remove during string cleanup fallback
    # Used when ISO codes don't exist or pycountry doesn't recognize the country
    PREFIXES_TO_REMOVE = [
        'Republic of ',
        'Kingdom of ',
        'Plurinational State of ',
        'Islamic Republic of ',
        'Bolivarian Republic of ',
        'United Republic of ',
        'Democratic Republic of the ',
        "People's Democratic Republic",
        'Federated States of ',
    ]

    @staticmethod
    def normalize(official_name: str, iso3: Optional[str], iso2: Optional[str]) -> str:
        """
        Get the common name for a country using multiple fallback strategies.
        
        FALLBACK STRATEGY PATTERN:
        1️⃣  Try special cases (manually curated)
        2️⃣  Try pycountry by ISO2, then ISO3
        3️⃣  Fall back to string cleanup
        4️⃣  Return original if all fails

        Args:
            official_name: Official name from M49 (e.g., 'United States of America')
            iso3: ISO 3166-1 alpha-3 code (e.g., 'USA')
            iso2: ISO 3166-1 alpha-2 code (e.g., 'US')

        Returns:
            Common name string (e.g., 'United States')

        Examples:
            >>> normalizer = CountryNameNormalizer()
            >>> normalizer.normalize('United States of America', 'USA', 'US')
            'United States'
            
            >>> normalizer.normalize('France', 'FRA', 'FR')
            'France'
            
            >>> normalizer.normalize('Republic of Some Place', None, None)
            'Some Place'
        """
        # Strategy 1: Check special cases first (highest priority)
        if iso3 and iso3.upper() in CountryNameNormalizer.SPECIAL_CASES:
            return CountryNameNormalizer.SPECIAL_CASES[iso3.upper()]

        # Strategy 2: Try pycountry lookup by ISO2, then ISO3
        if pycountry:
            # Try ISO2 lookup first (more common)
            if iso2:
                try:
                    country = pycountry.countries.get(alpha_2=iso2.upper())
                    if country:
                        return getattr(country, 'common_name', country.name)
                except (KeyError, AttributeError, LookupError) as e:
                    logger.debug(f"ISO2 lookup failed for {iso2}: {e}")

            # Try ISO3 lookup if ISO2 failed
            if iso3:
                try:
                    country = pycountry.countries.get(alpha_3=iso3.upper())
                    if country:
                        return getattr(country, 'common_name', country.name)
                except (KeyError, AttributeError, LookupError) as e:
                    logger.debug(f"ISO3 lookup failed for {iso3}: {e}")

        # Strategy 3: Fall back to string cleanup on official name
        return CountryNameNormalizer._cleanup_official_name(official_name)

    @staticmethod
    def _cleanup_official_name(name: str) -> str:
        """
        Clean up official name by removing titles and parenthetical info.
        
        This is the fallback when ISO codes aren't available or pycountry fails.
        
        Examples:
            'Republic of South Africa' → 'South Africa'
            'Kingdom of Sweden (Europe)' → 'Kingdom of Sweden'
            
        Args:
            name: Official country name
            
        Returns:
            Cleaned up name
        """
        # Remove parenthetical information first
        # Example: 'Falkland Islands (Islas Malvinas)' → 'Falkland Islands'
        if '(' in name:
            name = name.split('(')[0].strip()

        # Remove common title prefixes
        for prefix in CountryNameNormalizer.PREFIXES_TO_REMOVE:
            if name.startswith(prefix):
                name = name[len(prefix):].strip()
                break  # Only remove one prefix to avoid over-cleaning

        return name.strip()

    @classmethod
    def enrich_m49_record(cls, entry: Dict) -> Dict:
        """
        Enrich an M49 country record with common_name field.
        
        This method takes a raw M49 entry and adds/updates the common_name field.
        Useful for batch processing where each record needs standardization.
        
        INTERVIEW PREP: Dictionary Mutation Pattern
        ============================================
        Note: This mutates the input dictionary. In functional programming, we'd return
        a new dict. But for performance (batching 250+ countries), mutation is practical.
        
        Args:
            entry: M49 country record with keys: 'name', 'iso3', 'alpha2'
            
        Returns:
            Same dictionary with 'common_name' field added
            
        Example:
            entry = {'name': 'United States of America', 'iso3': 'USA', 'alpha2': 'US'}
            enriched = CountryNameNormalizer.enrich_m49_record(entry)
            # enriched['common_name'] == 'United States'
        """
        official_name = entry.get('name', '')
        iso3 = entry.get('iso3', '').upper() if entry.get('iso3') else None
        iso2 = entry.get('alpha2', '').upper() if entry.get('alpha2') else None
        
        # Get normalized name and add to entry
        entry['common_name'] = cls.normalize(official_name, iso3, iso2)
        
        return entry

    @staticmethod
    def batch_normalize(entries: List[Dict]) -> List[Dict]:
        """
        Efficiently process multiple entries for common name enrichment.
        
        PERFORMANCE CONSIDERATION:
        For large datasets (250+ countries), batch processing is faster than
        individual API calls. This processes all records in a single pass.
        
        Args:
            entries: List of M49 country records
            
        Returns:
            List of enriched records with 'common_name' field
            
        Example:
            entries = [
                {'name': 'France', 'iso3': 'FRA', 'alpha2': 'FR'},
                {'name': 'Germany', 'iso3': 'DEU', 'alpha2': 'DE'},
            ]
            normalized = CountryNameNormalizer.batch_normalize(entries)
            # All entries now have 'common_name' field
        """
        return [CountryNameNormalizer.enrich_m49_record(entry) for entry in entries]
