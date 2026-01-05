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
import { warn } from './logger';

// Cache for TopoJSON files to avoid reloading
const topoJSONCache = {
  simple: null,
  detailed: null
};

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
 * Filter multi-polygon features to keep only the largest 20 polygons
 * @param {Object} feature - GeoJSON feature
 * @returns {Object} - Filtered feature
 */
const filterLargestIslands = (feature) => {
  if (feature.geometry.type !== 'MultiPolygon') {
    return feature;
  }

  const polygons = feature.geometry.coordinates;

  // If 20 or fewer polygons, keep all (increased from 10 to handle Greenland's 17 parts)
  if (polygons.length <= 10) {
    return feature;
  }

  // Calculate area for each polygon
  const polygonsWithArea = polygons.map((coords, index) => ({
    coords,
    area: calculatePolygonArea(coords),
    index
  }));

  // Sort by area (largest first) and take top 20 (increased from 10)
  const largest20 = polygonsWithArea
    .sort((a, b) => b.area - a.area)
    .slice(0, 20)
    .map(p => p.coords);


  return {
    ...feature,
    geometry: {
      ...feature.geometry,
      coordinates: largest20
    }
  };
};

/**
 * Load and process TopoJSON data
 * @param {Array} countriesFromDB - List of country ISO3 codes from database
 * @returns {Promise<Object>} - Processed GeoJSON FeatureCollection
 */
export const loadTopoJSON = async (countriesFromDB = []) => {

  // Load simplified topology first (use cache if available)
  if (!topoJSONCache.simple) {
    const simpleResponse = await fetch('/geo/countries-110m.json');
    topoJSONCache.simple = await simpleResponse.json();
  }
  const simpleTopology = topoJSONCache.simple;

  // Convert to GeoJSON
  let simpleGeoJSON = topojson.feature(
    simpleTopology,
    simpleTopology.objects.countries
  );


  // Filter multi-island countries to top 10 islands
  simpleGeoJSON.features = simpleGeoJSON.features.map(filterLargestIslands);

  // If no database countries provided, return simple version
  if (!countriesFromDB || countriesFromDB.length === 0) {
    return simpleGeoJSON;
  }

  // Check for missing countries
  const simpleCountryISOs = new Set(
    simpleGeoJSON.features
      .map(f => getCountryIsoCode(f))
      .filter(Boolean)
  );

  const dbCountryISOs = new Set(countriesFromDB.map(c => c.iso3 || c));

  const missingCountries = [...dbCountryISOs].filter(iso => !simpleCountryISOs.has(iso));


  if (missingCountries.length > 0) {

    // Load detailed topology (use cache if available)
    if (!topoJSONCache.detailed) {
      const detailedResponse = await fetch('/geo/countries-50m.json');
      topoJSONCache.detailed = await detailedResponse.json();
    }
    const detailedTopology = topoJSONCache.detailed;

    // Convert to GeoJSON
    const detailedGeoJSON = topojson.feature(
      detailedTopology,
      detailedTopology.objects.countries
    );


    // Find missing countries in detailed topology
    const addedCountries = [];
    detailedGeoJSON.features.forEach(feature => {
      const iso = getCountryIsoCode(feature);
      if (iso && missingCountries.includes(iso)) {
        // Filter islands before adding
        const filtered = filterLargestIslands(feature);
        simpleGeoJSON.features.push(filtered);
        addedCountries.push(iso);
      }
    });


    const stillMissing = missingCountries.filter(iso => !addedCountries.includes(iso));
    if (stillMissing.length > 0) {
      warn(`⚠️  Still missing ${stillMissing.length} countries:`, stillMissing);
    }
  } else {
  }


  return simpleGeoJSON;
};
