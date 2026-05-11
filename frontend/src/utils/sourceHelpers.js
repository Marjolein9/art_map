/**
 * Source Helpers Utility
 *
 * Centralizes all source/collection mapping logic to avoid duplication.
 * Previously duplicated across ImageGallery.mui.js, QuizImageDisplay.mui.js, and WelcomeOverlay.mui.js
 *
 * DRY Principle: Define once, use everywhere. Bug fixes only need to happen in one place.
 */

/**
 * Source information mapping
 * Maps source identifiers to their full names and URLs
 */
const SOURCE_MAP = {
  'smithsonian': {
    name: 'Smithsonian American Art Museum',
    url: 'https://www.si.edu/explore/art'
  },
  'wiki commons': {
    name: 'Wikimedia Commons',
    url: 'https://commons.wikimedia.org/wiki/Main_Page'
  },
  'wikidata': {
    name: 'Wikimedia Commons',
    url: 'https://commons.wikimedia.org/wiki/Main_Page'
  },
  'chicago': {
    name: 'Art Institute of Chicago',
    url: 'https://www.artic.edu/'
  },
  'aic': {
    name: 'Art Institute of Chicago',
    url: 'https://www.artic.edu/'
  },
  'cleveland': {
    name: 'Cleveland Museum of Art',
    url: 'https://www.clevelandart.org/'
  },
  'rijksmuseum': {
    name: 'Rijksmuseum',
    url: 'https://www.rijksmuseum.nl/en'
  },
  'europeana': {
    name: 'Europeana',
    url: 'https://www.europeana.eu/'
  },
  'lacma': {
    name: 'Los Angeles County Museum of Art',
    url: 'https://www.lacma.org/'
  },
  'national gallery': {
    name: 'National Gallery of Art',
    url: 'https://www.nga.gov/'
  },
  'harvard': {
    name: 'Harvard Art Museums',
    url: 'https://harvardartmuseums.org/'
  },
  'met': {
    name: 'Metropolitan Museum of Art',
    url: 'https://www.metmuseum.org/'
  },
  'albert kahn': {
    name: 'Albert Kahn Museum',
    url: 'https://albert-kahn.hauts-de-seine.fr/en/'
  },
  'public domain review': {
    name: 'Public Domain Review',
    url: 'https://publicdomainreview.org/'
  },
};

/**
 * Get full source information (name and URL)
 *
 * @param {string} source - The source identifier (case-insensitive)
 * @returns {Object|null} Object with {name, url} or null if not found
 *
 * @example
 * getSourceInfo('smithsonian')
 * // Returns: { name: 'Smithsonian American Art Museum', url: 'https://www.si.edu/explore/art' }
 */
export const getSourceInfo = (source) => {
  if (!source) return null;

  const normalizedSource = source.toLowerCase();
  return SOURCE_MAP[normalizedSource] || null;
};

/**
 * Get just the display name for a source
 *
 * @param {string} source - The source identifier
 * @returns {string} The full display name, or the original source if not found
 *
 * @example
 * getSourceDisplayName('wiki commons')
 * // Returns: 'Wikimedia Commons'
 */
export const getSourceDisplayName = (source) => {
  if (!source) return '';

  const info = getSourceInfo(source);
  return info ? info.name : source;
};

/**
 * Get just the URL for a source
 *
 * @param {string} source - The source identifier
 * @returns {string|null} The source URL or null if not found
 *
 * @example
 * getSourceUrl('chicago')
 * // Returns: 'https://www.artic.edu/'
 */
export const getSourceUrl = (source) => {
  if (!source) return null;

  const info = getSourceInfo(source);
  return info ? info.url : null;
};

/**
 * Get type subtitle based on collection
 *
 * @param {string} collectionType - The collection type
 * @returns {string} Subtitle for the collection
 *
 * @example
 * getTypeSubtitle('Albert Kahn')
 * // Returns: 'Historical Photograph'
 */
export const getTypeSubtitle = (collectionType) => {
  const subtitles = {
    'Albert Kahn': 'Historical Photograph',
    'Public Domain Review': 'Public Domain Review',
    'Met Museum': 'Museum Artwork',
    'Children in Art': 'Artwork'
  };

  return subtitles[collectionType] || 'Artwork';
};
