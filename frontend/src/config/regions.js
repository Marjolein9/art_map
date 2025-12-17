/**
 * Region center coordinates for globe rotation
 * Format: { lat, lng, altitude } where:
 * - lat: latitude in degrees
 * - lng: longitude in degrees
 * - altitude: zoom level (lower = closer)
 */

export const REGION_VIEWS = {
  // Africa subregions
  'Northern Africa': { lat: 28, lng: 15, altitude: 1.2 },
  'Western Africa': { lat: 10, lng: 0, altitude: 1.2 },
  'Middle Africa': { lat: -2, lng: 20, altitude: 1.2 },
  'Eastern Africa': { lat: 0, lng: 38, altitude: 1.2 },
  'Southern Africa': { lat: -25, lng: 25, altitude: 1 },
  'Sub-Saharan Africa': { lat: -5, lng: 20, altitude: 1.3 }, // macro region

  // Asia subregions
  'Eastern Asia': { lat: 35, lng: 110, altitude: 1.0 },
  'Southeast Asia': { lat: 10, lng: 105, altitude: 1.0 },
  'Southern Asia': { lat: 23, lng: 80, altitude: 1.0 },
  'Central Asia': { lat: 45, lng: 65, altitude: 1.0 },
  'Western Asia': { lat: 30, lng: 45, altitude: 1.0 }, // Middle East

  // Europe subregions
  'Western Europe': { lat: 50, lng: 5, altitude: 1.0 },
  'Eastern Europe': { lat: 52, lng: 30, altitude: 1.0 },
  'Northern Europe': { lat: 62, lng: 15, altitude: 1.0 },
  'Southern Europe': { lat: 42, lng: 15, altitude: 1.0 },
  'Central Europe': { lat: 50, lng: 15, altitude: 1.0 },
  // Americas subregions
  'Northern America': { lat: 50, lng: -100, altitude: 1.0 },
  'Central America': { lat: 15, lng: -90, altitude: 1.0 },
  'Caribbean': { lat: 20, lng: -75, altitude: 1.0 },
  'South America': { lat: -15, lng: -60, altitude: 1.0 },
  'Latin America and the Caribbean': { lat: 15, lng: -88, altitude: 1.0 }, // macro region

  // Oceania subregions
  'Australia and New Zealand': { lat: -30, lng: 145, altitude: 1.0  },
  'Melanesia': { lat: -15, lng: 165, altitude: 1.0  },
  'Micronesia': { lat: 7, lng: 160, altitude: 1.0  },
  'Polynesia': { lat: -15, lng: -155, altitude: 1.0  },

  // Fallback for broad continents (if subregion not available)
  'Africa': { lat: 0, lng: 20, altitude: 1.5 },
  'Asia': { lat: 30, lng: 90, altitude: 1.5 },
  'Europe': { lat: 52, lng: 15, altitude: 1.3 },
  'Oceania': { lat: -25, lng: 165, altitude: 1.7 },
  'Americas': { lat: 0, lng: -60, altitude: 1.5 }, // fallback for continents
  'default': { lat: 0, lng: 0, altitude: 1.3 }
};
