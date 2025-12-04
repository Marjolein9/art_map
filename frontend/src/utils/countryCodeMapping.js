/**
 * Utility to convert TopoJSON country properties to ISO 3-letter codes
 *
 * Our TopoJSON (from world-atlas) only contains:
 * - id: M49 numeric code (e.g., "840" for USA, "250" for France)
 * - name: Country name (e.g., "United States of America")
 *
 * We build the M49→ISO3 mapping dynamically from the backend database,
 * which uses the UN M49 standard as single source of truth.
 */

// Store the M49→ISO3 mapping built from API data
let m49ToIso3Mapping = {};

/**
 * Initialize the M49→ISO3 mapping from countries data
 * @param {Array} countries - Array of country objects from database with {iso3, m49, name}
 */
export const initializeCountryMapping = (countries) => {
  m49ToIso3Mapping = {};

  if (!countries || !Array.isArray(countries)) {
    console.warn('⚠️ No countries data provided for mapping');
    return;
  }

  countries.forEach(country => {
    if (country.m49 && country.iso3) {
      // Store as string key to match TopoJSON property types
      m49ToIso3Mapping[String(country.m49)] = country.iso3;
    }
  });

  console.log(`✅ Initialized M49→ISO3 mapping with ${Object.keys(m49ToIso3Mapping).length} countries`);
};

/**
 * Extract the correct ISO 3-letter code from TopoJSON properties
 * @param {Object} properties - The properties object from TopoJSON feature
 * @returns {string|null} - The 3-letter ISO code or null
 */
export const getCountryIsoCode = (properties) => {
  if (!properties) return null;

  // Our TopoJSON uses M49 numeric code as 'id'
  const m49Code = properties.id;

  if (m49Code && m49ToIso3Mapping[m49Code]) {
    return m49ToIso3Mapping[m49Code];
  }

  // No M49 code found - this shouldn't happen with our TopoJSON
  console.warn(`⚠️ No M49 mapping for country:`, properties);
  return null;
};

/**
 * Get country name from properties
 * @param {Object} properties - The properties object from TopoJSON feature
 * @returns {string} - The country name
 */
export const getCountryName = (properties) => {
  if (!properties) return 'Unknown';
  return properties.name || 'Unknown';
};
