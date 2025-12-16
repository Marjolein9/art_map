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

// Store the M49→common_name mapping built from API data
let m49ToCommonNameMapping = {};

// Track M49 codes we've already warned about to avoid spam
const warnedM49Codes = new Set();

/**
 * Initialize the M49→ISO3 and M49→common_name mappings from countries data
 * @param {Array} countries - Array of country objects from database with {iso3, m49, name, common_name}
 */
export const initializeCountryMapping = (countries) => {
  m49ToIso3Mapping = {};
  m49ToCommonNameMapping = {};
  warnedM49Codes.clear(); // Clear warnings on re-initialization

  if (!countries || !Array.isArray(countries)) {
    console.warn('⚠️ No countries data provided for mapping');
    return;
  }

  countries.forEach(country => {
    if (country.m49 && country.iso3) {
      // Store as zero-padded 3-digit string to match TopoJSON IDs (e.g., "004", "032")
      const paddedM49 = String(country.m49).padStart(3, '0');
      m49ToIso3Mapping[paddedM49] = country.iso3;

      // Also store common name mapping
      const commonName = country.common_name || country.name;
      m49ToCommonNameMapping[paddedM49] = commonName;
    }
  });
};

/**
 * Extract the correct ISO 3-letter code from GeoJSON feature
 * @param {Object} feature - The GeoJSON feature object (or properties object for backward compatibility)
 * @returns {string|null} - The 3-letter ISO code or null
 */
export const getCountryIsoCode = (feature) => {
  if (!feature) return null;

  // Handle both full feature object and properties-only object
  // GeoJSON features have id at top level, not in properties
  const m49Code = feature.id || feature.properties?.id;
  const name = feature.properties?.name || feature.name;

  // Ensure M49 is padded to 3 digits for consistent lookup
  const paddedM49 = m49Code ? String(m49Code).padStart(3, '0') : null;

  if (paddedM49 && m49ToIso3Mapping[paddedM49]) {
    return m49ToIso3Mapping[paddedM49];
  }

  // Only warn once per unique M49 code to avoid spam
  if (paddedM49 && !warnedM49Codes.has(paddedM49)) {
    warnedM49Codes.add(paddedM49);
    console.warn(`⚠️ No M49 mapping for country: ${name || 'Unknown'} (M49: ${paddedM49})`);
  }

  return null;
};

/**
 * Get country name from properties (using common name if available)
 * @param {Object} properties - The properties object from TopoJSON feature
 * @returns {string} - The country common name (or official name as fallback)
 */
export const getCountryName = (properties) => {
  if (!properties) return 'Unknown';

  // Try to get common name from M49 mapping first
  const m49Code = properties.id;
  // Ensure M49 is padded to 3 digits for consistent lookup
  const paddedM49 = m49Code ? String(m49Code).padStart(3, '0') : null;

  if (paddedM49 && m49ToCommonNameMapping[paddedM49]) {
    return m49ToCommonNameMapping[paddedM49];
  }

  // Fallback to TopoJSON name
  return properties.name || 'Unknown';
};
