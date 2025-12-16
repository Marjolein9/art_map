/**
 * Region center coordinates for globe rotation
 * Format: { lat, lng, altitude } where:
 * - lat: latitude in degrees
 * - lng: longitude in degrees
 * - altitude: zoom level (lower = closer)
 */

export const REGION_VIEWS = {
  // Africa subregions
  'North Africa': { lat: 28, lng: 15, altitude: 1.4 },
  'West Africa': { lat: 10, lng: 0, altitude: 1.4 },
  'Middle Africa': { lat: -2, lng: 20, altitude: 1.4 },
  'East Africa': { lat: 0, lng: 38, altitude: 1.4 },
  'Southern Africa': { lat: -25, lng: 25, altitude: 1.4 },

  // Asia subregions
  'East Asia': { lat: 35, lng: 110, altitude: 1.4 },
  'Southeast Asia': { lat: 10, lng: 105, altitude: 1.3 },
  'South Asia': { lat: 23, lng: 80, altitude: 1.4 },
  'Central Asia': { lat: 45, lng: 65, altitude: 1.4 },
  'Middle East': { lat: 30, lng: 45, altitude: 1.3 },

  // Europe subregions
  'Western Europe': { lat: 50, lng: 5, altitude: 1.0 },
  'Eastern Europe': { lat: 52, lng: 30, altitude: 1.0 },
  'Northern Europe': { lat: 62, lng: 15, altitude: 1.0 },
  'Southern Europe': { lat: 42, lng: 15, altitude: 1.0 },
  'Central Europe': { lat: 50, lng: 15, altitude: 1.0 },

  // Americas
  'North America': { lat: 50, lng: -100, altitude: 1.5 },
  'Central America': { lat: 15, lng: -90, altitude: 1.3 },
  'Caribbean': { lat: 20, lng: -75, altitude: 1.3 },
  'South America': { lat: -15, lng: -60, altitude: 1.5 },

  // Oceania
  'Oceania': { lat: -25, lng: 135, altitude: 1.5 },

  // Fallback for broad continents (if subregion not available)
  'Africa': { lat: 0, lng: 20, altitude: 1.5 },
  'Asia': { lat: 30, lng: 90, altitude: 1.5 },
  'Europe': { lat: 52, lng: 15, altitude: 1.3 },
  'default': { lat: 0, lng: 0, altitude: 1.3 }
};
