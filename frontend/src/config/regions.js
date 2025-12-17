/**
 * Region center coordinates for globe rotation
 * Format: { lat, lng, altitude } where:
 * - lat: latitude in degrees
 * - lng: longitude in degrees
 * - altitude: zoom level (lower = closer)
 */

export const REGION_VIEWS = {
  // Africa subregions
  'North Africa': { lat: 28, lng: 15, altitude: 1.2},
  'West Africa': { lat: 10, lng: 0, altitude: 1.2},
  'Middle Africa': { lat: -2, lng: 20, altitude: 1.2},
  'East Africa': { lat: 0, lng: 38, altitude: 1.2},
  'Southern Africa': { lat: -25, lng: 25, altitude: 1},

  // Asia subregions
  'East Asia': { lat: 35, lng: 110, altitude: 1.2},
  'Southeast Asia': { lat: 10, lng: 105, altitude: 1.2},
  'South Asia': { lat: 23, lng: 80, altitude: 1.2},
  'Central Asia': { lat: 45, lng: 65, altitude: 1.2},
  'Middle East': { lat: 30, lng: 45, altitude: .75 },

  // Europe subregions
  'Western Europe': { lat: 50, lng: 5, altitude: 1.2},
  'Eastern Europe': { lat: 52, lng: 30, altitude: 1.2},
  'Northern Europe': { lat: 62, lng: 15, altitude: 1.2},
  'Southern Europe': { lat: 42, lng: 15, altitude: 1.2},
  'Central Europe': { lat: 50, lng: 15, altitude: 1.2},
  // Americas
  'North America': { lat: 50, lng: -100, altitude: 1.2},
  'Central America': { lat: 15, lng: -90, altitude: 1.2},
  'Caribbean': { lat: 20, lng: -75, altitude: .75 },
  'South America': { lat: -30, lng: -60, altitude: 1},
  'North America': { lat: -15, lng: -60, altitude: 1},

  // Oceania subregions
  'Australia and New Zealand': { lat: -30, lng: 145, altitude: 1.2},
  'Melanesia': { lat: -15, lng: 165, altitude: 1.2},
  'Micronesia': { lat: 7, lng: 160, altitude: 1.2},
  'Polynesia': { lat: -15, lng: -155, altitude: 1.2},

  // Fallback for broad continents (if subregion not available)
  'Africa': { lat: 0, lng: 20, altitude: 1.5 },
  'Asia': { lat: 30, lng: 90, altitude: 1.5 },
  'Europe': { lat: 52, lng: 15, altitude: 1.3 },
  'Oceania': { lat: -25, lng: 165, altitude: 1.7 },
  'default': { lat: 0, lng: 0, altitude: 1.3 }
};
