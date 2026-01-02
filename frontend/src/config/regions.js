/**
 * Region center coordinates for globe rotation
 * Format: { lat, lng, altitude } where:
 * - lat: latitude in degrees
 * - lng: longitude in degrees
 * - altitude: zoom level (lower = closer)
 */

export const REGION_VIEWS = {
  // Africa subregions
  'Northern Africa': { lat: 28, lng: 15, altitude: 1.3 },
  'Western Africa': { lat: 20, lng: -5, altitude: 1.3 },
  'Middle Africa': { lat: 10, lng: 18, altitude: 1.0 },
  'Eastern Africa': { lat: 4, lng: 42, altitude: 1.1 },
  'Southern Africa': { lat: -25, lng: 25, altitude: 1 },
  'Sub-Saharan Africa': { lat: -5, lng: 20, altitude: 1.3 }, // macro region

  // Asia subregions
  'Eastern Asia': { lat: 35, lng: 110, altitude: 1.4 },
  'Southeast Asia': { lat: 17, lng: 110, altitude: 1.2 },
  'Southern Asia': { lat: 23, lng: 77, altitude: 1.3 },
  'Central Asia': { lat: 50, lng: 65, altitude: .8 },
  'Western Asia': { lat: 35, lng: 45, altitude: .8 }, // Middle East

  // Europe subregions
  'Western Europe': { lat: 50, lng: 5, altitude: .55 },
  'Eastern Europe': { lat: 52, lng: 25, altitude: .6 },
  'Northern Europe': { lat: 65, lng: 7, altitude: .9 },
  'Southern Europe': { lat: 42, lng: 8, altitude: 1.0 },
  'Central Europe': { lat: 50, lng: 15, altitude: 1.0 },
  // Americas subregions
  'Northern America': { lat: 50, lng: -100, altitude: 1.2 },
  'Central America': { lat: 15, lng: -86, altitude: .6 },
  'Caribbean': { lat: 20, lng: -69, altitude: .75 },
  'South America': { lat: -10, lng: -65, altitude: 1.3 },
  'Latin America and the Caribbean': { lat: 15, lng: -80, altitude: 1.0 }, // macro region

  // Oceania subregions
  'Australia New Zealand Indo': { lat: -10, lng: 145, altitude: 1.5  },
  'Melanesia': { lat: -15, lng: 162, altitude: 1.3  },
  'Micronesia': { lat: 7, lng: 175, altitude: 2.6  },
  'Polynesia': { lat: -15, lng: -155, altitude: 1.4  },

  // Fallback for broad continents (if subregion not available)
  'Africa': { lat: 0, lng: 20, altitude: 1.5 },
  'Asia': { lat: 30, lng: 90, altitude: 1.5 },
  'Europe': { lat: 52, lng: 15, altitude: 1.3 },
  'Oceania': { lat: -25, lng: 165, altitude: 1.7 },
  'Americas': { lat: 0, lng: -60, altitude: 1.5 }, // fallback for continents
  'default': { lat: 0, lng: 0, altitude: 1.3 }
};
