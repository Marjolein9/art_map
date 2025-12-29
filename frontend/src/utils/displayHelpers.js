/**
 * Display Helper Functions
 *
 * Utilities for formatting country and territory names for display
 */

/**
 * Get display name for a country or territory
 *
 * Returns "Name" for sovereign countries or "Territory (Parent Country)" for territories
 *
 * @param {Object} country - Country object from API with name and parent data
 * @returns {string} - Formatted display name
 *
 * Examples:
 *   - France → "France"
 *   - Puerto Rico → "Puerto Rico (United States)"
 *   - Greenland → "Greenland (Denmark)"
 *   - French Polynesia → "French Polynesia (France)"
 */
export const getDisplayName = (country) => {
  if (!country) return '';

  const name = country.common_name || country.name;
  const parentName = country.parent_common_name || country.parent_name;

  if (parentName) {
    return `${name} (${parentName})`;
  }

  return name;
};
