"""
Unit tests for country name transformations.

TESTING PHILOSOPHY FOR THIS PROJECT:
====================================

Why test transformations?
- Business logic: Country name standardization is core to data quality
- Regression prevention: Changes to transform logic affect 250+ countries
- Documentation: Tests show how the function should behave
- Safe refactoring: Tests give confidence when improving the code

INTERVIEW PREP: Testing Strategy
================================
This test suite demonstrates:
1. Fallback strategy testing (special cases, pycountry, cleanup)
2. Edge case handling (None values, empty strings)
3. Performance testing (batch processing)
4. Parametrized tests (run same test with different inputs)

Typical test structure:
- Arrange: Set up test data
- Act: Call the function
- Assert: Verify results

Example:
    def test_special_cases_take_precedence(self):
        # Arrange
        official_name = 'United States of America'
        iso3 = 'USA'
        iso2 = 'US'
        
        # Act
        result = CountryNameNormalizer.normalize(official_name, iso3, iso2)
        
        # Assert
        assert result == 'United States'
"""

import pytest
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from utils.country_transformations import CountryNameNormalizer


class TestCountryNameNormalization:
    """Test suite for country name transformation logic."""

    # ========================
    # Strategy 1: Special Cases
    # ========================

    def test_special_cases_take_precedence(self):
        """Special cases should override pycountry lookups."""
        # Some countries have better common names than pycountry provides
        assert CountryNameNormalizer.normalize(
            'United States of America', 'USA', 'US'
        ) == 'United States'

    def test_special_case_south_korea(self):
        """South Korea should use special case, not pycountry."""
        assert CountryNameNormalizer.normalize(
            'Republic of Korea', 'KOR', 'KR'
        ) == 'South Korea'

    def test_special_case_congo(self):
        """Should distinguish between Congo and Democratic Republic of Congo."""
        # Congo
        assert CountryNameNormalizer.normalize(
            'Republic of the Congo', 'COG', 'CG'
        ) == 'Republic of the Congo'
        
        # Democratic Republic of Congo
        assert CountryNameNormalizer.normalize(
            'Democratic Republic of the Congo', 'COD', 'CD'
        ) == 'Democratic Republic of the Congo'

    def test_special_case_palestine(self):
        """Palestine is a special case (not fully recognized by pycountry)."""
        assert CountryNameNormalizer.normalize(
            'Palestine', 'PSE', None
        ) == 'Palestine'

    # ========================
    # Strategy 2: Pycountry Lookup
    # ========================

    def test_pycountry_lookup_iso2_first(self):
        """Should use pycountry when no special case exists."""
        # France should be recognized by pycountry
        result = CountryNameNormalizer.normalize(
            'French Republic', 'FRA', 'FR'
        )
        assert result in ['France', 'French Republic']  # pycountry may vary

    def test_pycountry_lookup_iso3_fallback(self):
        """Should try ISO3 if ISO2 fails."""
        # Using ISO3 when ISO2 is None
        result = CountryNameNormalizer.normalize(
            'Germany', 'DEU', None
        )
        assert result in ['Germany', 'Federal Republic of Germany']

    # ========================
    # Strategy 3: String Cleanup Fallback
    # ========================

    def test_cleanup_removes_republic_prefix(self):
        """Should clean up 'Republic of' prefix."""
        result = CountryNameNormalizer.normalize(
            'Republic of South Africa', None, None
        )
        assert result == 'South Africa'
        assert 'Republic' not in result

    def test_cleanup_removes_kingdom_prefix(self):
        """Should clean up 'Kingdom of' prefix."""
        result = CountryNameNormalizer.normalize(
            'Kingdom of Sweden', None, None
        )
        assert result == 'Sweden'

    def test_cleanup_removes_parenthetical_info(self):
        """Should remove information in parentheses."""
        result = CountryNameNormalizer.normalize(
            'Falkland Islands (Islas Malvinas)', None, None
        )
        assert result == 'Falkland Islands'
        assert 'Malvinas' not in result

    def test_cleanup_multiple_issues(self):
        """Should handle multiple cleanup operations."""
        result = CountryNameNormalizer.normalize(
            'Republic of Some Country (Europe)', None, None
        )
        # Should remove both "Republic of " and "(Europe)"
        assert 'Republic' not in result
        assert 'Europe' not in result

    # ========================
    # Edge Cases & Robustness
    # ========================

    def test_normalize_handles_none_iso_codes(self):
        """Should gracefully handle None ISO codes."""
        result = CountryNameNormalizer.normalize(
            'France', None, None
        )
        # Should still return something reasonable
        assert result == 'France'

    def test_normalize_handles_empty_strings(self):
        """Should gracefully handle empty strings."""
        result = CountryNameNormalizer.normalize(
            'France', '', None
        )
        assert result == 'France'

    def test_normalize_case_insensitive_iso_codes(self):
        """ISO codes should work regardless of case."""
        result1 = CountryNameNormalizer.normalize('United States', 'USA', 'US')
        result2 = CountryNameNormalizer.normalize('United States', 'usa', 'us')
        assert result1 == result2 == 'United States'

    def test_normalize_whitespace_handling(self):
        """Should trim excess whitespace."""
        result = CountryNameNormalizer.normalize(
            '  France  ', 'FRA', 'FR'
        )
        assert result == result.strip()

    # ========================
    # Batch Processing
    # ========================

    def test_batch_normalize_single_entry(self):
        """Should handle batch normalization with single entry."""
        entries = [
            {'name': 'United States of America', 'iso3': 'USA', 'alpha2': 'US'}
        ]
        result = CountryNameNormalizer.batch_normalize(entries)
        
        assert len(result) == 1
        assert result[0]['common_name'] == 'United States'

    def test_batch_normalize_multiple_entries(self):
        """Should process multiple countries efficiently."""
        entries = [
            {'name': 'United States of America', 'iso3': 'USA', 'alpha2': 'US'},
            {'name': 'France', 'iso3': 'FRA', 'alpha2': 'FR'},
            {'name': 'Democratic Republic of the Congo', 'iso3': 'COD', 'alpha2': 'CD'},
        ]
        result = CountryNameNormalizer.batch_normalize(entries)
        
        assert len(result) == 3
        assert all('common_name' in entry for entry in result)
        assert result[0]['common_name'] == 'United States'
        assert result[2]['common_name'] == 'Democratic Republic of the Congo'

    def test_batch_normalize_preserves_other_fields(self):
        """Batch processing should preserve all original fields."""
        entries = [
            {
                'name': 'France',
                'iso3': 'FRA',
                'alpha2': 'FR',
                'population': 67000000,
                'continent': 'Europe'
            }
        ]
        result = CountryNameNormalizer.batch_normalize(entries)
        
        # Original fields should be preserved
        assert result[0]['population'] == 67000000
        assert result[0]['continent'] == 'Europe'
        # New field should be added
        assert 'common_name' in result[0]

    def test_batch_normalize_handles_large_dataset(self):
        """Should efficiently handle 250+ countries."""
        # Simulate a realistic dataset
        entries = [
            {
                'name': f'Country {i}',
                'iso3': f'C{i:02d}',
                'alpha2': f'C{i:01d}'
            }
            for i in range(250)
        ]
        result = CountryNameNormalizer.batch_normalize(entries)
        
        assert len(result) == 250
        # All entries should have common_name added
        assert all('common_name' in entry for entry in result)

    # ========================
    # M49 Record Enrichment
    # ========================

    def test_enrich_m49_record_adds_common_name(self):
        """Enriching M49 records should add common_name field."""
        entry = {'name': 'United States of America', 'iso3': 'USA', 'alpha2': 'US'}
        enriched = CountryNameNormalizer.enrich_m49_record(entry)
        
        assert 'common_name' in enriched
        assert enriched['common_name'] == 'United States'
        # Original fields should still be there
        assert enriched['name'] == 'United States of America'
        assert enriched['iso3'] == 'USA'

    def test_enrich_m49_record_mutates_original(self):
        """enrich_m49_record should mutate the original dict (for performance)."""
        entry = {'name': 'France', 'iso3': 'FRA', 'alpha2': 'FR'}
        result = CountryNameNormalizer.enrich_m49_record(entry)
        
        # Result and entry should be the same object
        assert result is entry
        assert entry['common_name'] == result['common_name']

    # ========================
    # Special Cases Dictionary
    # ========================

    def test_all_special_cases_defined(self):
        """Verify that the special cases dictionary is populated."""
        assert len(CountryNameNormalizer.SPECIAL_CASES) > 0
        # Should have at least USA
        assert 'USA' in CountryNameNormalizer.SPECIAL_CASES

    def test_special_cases_are_strings(self):
        """All special case values should be non-empty strings."""
        for iso3, common_name in CountryNameNormalizer.SPECIAL_CASES.items():
            assert isinstance(iso3, str) and len(iso3) > 0
            assert isinstance(common_name, str) and len(common_name) > 0


# ========================
# Integration Tests
# ========================

class TestCountryNormalizationIntegration:
    """Integration tests for real-world scenarios."""

    def test_real_world_m49_records(self):
        """Test with actual M49 record format."""
        # Real M49 record structure
        m49_record = {
            'name': 'United States of America',
            'iso3': 'USA',
            'alpha2': 'US',
            'm49code': 840,
            'continent': 'Americas'
        }
        
        enriched = CountryNameNormalizer.enrich_m49_record(m49_record)
        
        assert enriched['common_name'] == 'United States'
        assert enriched['m49code'] == 840  # Preserved
        assert enriched['continent'] == 'Americas'  # Preserved

    def test_consistency_across_calls(self):
        """Same input should always produce same output."""
        # Call multiple times
        results = [
            CountryNameNormalizer.normalize('United States of America', 'USA', 'US')
            for _ in range(5)
        ]
        
        # All should be identical
        assert len(set(results)) == 1
        assert results[0] == 'United States'

    def test_special_cases_override_consistency(self):
        """Special cases should override any other data source consistently."""
        # Even if we pass different names, special case should win
        result1 = CountryNameNormalizer.normalize('USA Name A', 'USA', 'US')
        result2 = CountryNameNormalizer.normalize('USA Name B', 'USA', 'US')
        
        assert result1 == result2 == 'United States'


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
