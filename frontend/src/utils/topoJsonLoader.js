/**
 * TopoJSON Loader Utility
 *
 * Loads and processes TopoJSON files for optimal performance:
 * - Uses simplified topology for faster loading
 * - Adds missing countries from detailed topology
 * - Filters multi-island countries to top 10 largest islands
 */

import * as topojson from 'topojson-client';
import { getCountryIsoCode } from './countryCodeMapping';

/**
 * Calculate the area of a polygon using the shoelace formula
 * @param {Array} coordinates - Array of [lng, lat] coordinates
 * @returns {number} - Approximate area
 */
const calculatePolygonArea = (coordinates) => {
  if (!coordinates || coordinates.length === 0) return 0;

  let area = 0;
  const points = coordinates[0]; // Get outer ring

  if (!points || points.length < 3) return 0;

  for (let i = 0; i < points.length - 1; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    area += x1 * y2 - x2 * y1;
  }

  return Math.abs(area / 2);
};

/**
 * Filter multi-polygon features to keep only the largest 10 polygons
 * @param {Object} feature - GeoJSON feature
 * @returns {Object} - Filtered feature
 */
const filterLargestIslands = (feature) => {
  if (feature.geometry.type !== 'MultiPolygon') {
    return feature;
  }

  const polygons = feature.geometry.coordinates;

  // If 10 or fewer polygons, keep all
  if (polygons.length <= 10) {
    return feature;
  }

  // Calculate area for each polygon
  const polygonsWithArea = polygons.map((coords, index) => ({
    coords,
    area: calculatePolygonArea(coords),
    index
  }));

  // Sort by area (largest first) and take top 10
  const largest10 = polygonsWithArea
    .sort((a, b) => b.area - a.area)
    .slice(0, 10)
    .map(p => p.coords);

  console.log(`🏝️  Filtered ${feature.properties.name || 'country'}: ${polygons.length} → 10 islands`);

  return {
    ...feature,
    geometry: {
      ...feature.geometry,
      coordinates: largest10
    }
  };
};

/**
 * Load and process TopoJSON data
 * @param {Array} countriesFromDB - List of country ISO3 codes from database
 * @returns {Promise<Object>} - Processed GeoJSON FeatureCollection
 */
export const loadTopoJSON = async (countriesFromDB = []) => {
  console.log('🌍 Loading TopoJSON files...');

  // Load simplified topology first
  const simpleResponse = await fetch('/geo/countries-110m.json');
  const simpleTopology = await simpleResponse.json();

  // Convert to GeoJSON
  let simpleGeoJSON = topojson.feature(
    simpleTopology,
    simpleTopology.objects.countries
  );

  console.log(`✅ Loaded simplified topology: ${simpleGeoJSON.features.length} countries`);

  // Filter multi-island countries to top 10 islands
  simpleGeoJSON.features = simpleGeoJSON.features.map(filterLargestIslands);

  // If no database countries provided, return simple version
  if (!countriesFromDB || countriesFromDB.length === 0) {
    console.log('⚠️  No database countries provided, using simplified topology only');
    return simpleGeoJSON;
  }

  // Check for missing countries
  const simpleCountryISOs = new Set(
    simpleGeoJSON.features
      .map(f => getCountryIsoCode(f.properties))
      .filter(Boolean)
  );

  const dbCountryISOs = new Set(countriesFromDB.map(c => c.iso3 || c));

  const missingCountries = [...dbCountryISOs].filter(iso => !simpleCountryISOs.has(iso));

  console.log(`🔍 Checking coverage: ${simpleCountryISOs.size} in topology, ${dbCountryISOs.size} in database`);

  if (missingCountries.length > 0) {
    console.log(`⚠️  Missing ${missingCountries.length} countries:`, missingCountries);
    console.log('📥 Loading detailed topology for missing countries...');

    // Load detailed topology
    const detailedResponse = await fetch('/geo/countries-50m.json');
    const detailedTopology = await detailedResponse.json();

    // Convert to GeoJSON
    const detailedGeoJSON = topojson.feature(
      detailedTopology,
      detailedTopology.objects.countries
    );

    console.log(`✅ Loaded detailed topology: ${detailedGeoJSON.features.length} countries`);

    // Find missing countries in detailed topology
    const addedCountries = [];
    detailedGeoJSON.features.forEach(feature => {
      const iso = getCountryIsoCode(feature.properties);
      if (iso && missingCountries.includes(iso)) {
        // Filter islands before adding
        const filtered = filterLargestIslands(feature);
        simpleGeoJSON.features.push(filtered);
        addedCountries.push(iso);
      }
    });

    console.log(`✅ Added ${addedCountries.length} missing countries:`, addedCountries);

    const stillMissing = missingCountries.filter(iso => !addedCountries.includes(iso));
    if (stillMissing.length > 0) {
      console.warn(`⚠️  Still missing ${stillMissing.length} countries:`, stillMissing);
    }
  } else {
    console.log('✅ All database countries are present in topology');
  }

  console.log(`🎉 Final topology: ${simpleGeoJSON.features.length} countries`);

  return simpleGeoJSON;
};

/**
 * Legacy function for backward compatibility
 * Loads GeoJSON from GitHub (old method)
 */
export const loadGeoJSON = async () => {
  console.log('🌍 Loading GeoJSON (legacy)...');
  const response = await fetch(
    'https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson'
  );
  const data = await response.json();
  console.log(`✅ Loaded ${data.features.length} countries (legacy)`);
  return data;
};
