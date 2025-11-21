// Utility to convert GeoJSON country properties to ISO 3-letter codes
// Some countries have ISO_A3 = "-99" or other issues, so we need to handle them

const SPECIAL_MAPPINGS = {
  // Countries where ISO_A3 is -99 or incorrect
  'France': 'FRA',
  'Norway': 'NOR',
  'Singapore': 'SGP',
  'Kosovo': 'XKX',
  'Northern Cyprus': 'CYP',
  'Somaliland': 'SOM',
  'Taiwan': 'TWN',
  // Add more as needed
};

/**
 * Extract the correct ISO 3-letter code from GeoJSON country properties
 * @param {Object} properties - The properties object from GeoJSON feature
 * @returns {string} - The 3-letter ISO code
 */
export const getCountryIsoCode = (properties) => {
  if (!properties) return null;

  // First, check if there's a special mapping by country name
  const countryName = properties.NAME || properties.ADMIN || properties.name;
  if (countryName && SPECIAL_MAPPINGS[countryName]) {
    console.log(`✓ Using special mapping for ${countryName}: ${SPECIAL_MAPPINGS[countryName]}`);
    return SPECIAL_MAPPINGS[countryName];
  }

  // Try multiple ISO code properties in order of preference
  const isoCode =
    properties.ISO_A3_EH ||  // Extended handling ISO code (handles -99 cases)
    properties.ISO_A3 ||     // Standard ISO code
    properties.ADM0_A3 ||    // Administrative code
    properties.iso_a3 ||     // Lowercase variant
    properties.wb_a3;        // World Bank code

  // If we got -99 or invalid code, try alternative approaches
  if (!isoCode || isoCode === '-99' || isoCode.length !== 3) {
    console.warn(`⚠️ Invalid ISO code for country: ${countryName}, got: ${isoCode}`);

    // Try to use ADM0_A3 as fallback
    if (properties.ADM0_A3 && properties.ADM0_A3 !== '-99') {
      console.log(`Using ADM0_A3 fallback: ${properties.ADM0_A3}`);
      return properties.ADM0_A3;
    }

    // Last resort: try World Bank code
    if (properties.WB_A3 && properties.WB_A3 !== '-99') {
      console.log(`Using WB_A3 fallback: ${properties.WB_A3}`);
      return properties.WB_A3;
    }

    return null;
  }

  return isoCode;
};

/**
 * Get country name from properties
 * @param {Object} properties - The properties object from GeoJSON feature
 * @returns {string} - The country name
 */
export const getCountryName = (properties) => {
  if (!properties) return 'Unknown';
  return properties.NAME || properties.ADMIN || properties.name || 'Unknown';
};
