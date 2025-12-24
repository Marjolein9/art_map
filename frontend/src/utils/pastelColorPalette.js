/**
 * Pastel Color Palette Generator
 *
 * Generates a consistent pastel color for each country based on its M49 code.
 * Each country gets a unique, pleasant pastel color that's easy on the eyes.
 */

import COLOR_SCHEME from '../styles/colorSchemes';

// Import pastel palette from centralized color scheme
const PASTEL_COLORS = COLOR_SCHEME.pastelColors;

/**
 * Generates a deterministic pastel color based on M49 code
 * Uses a better distribution algorithm to avoid collisions
 * 
 * @param {string|number} m49 - UN M49 code for the country
 * @returns {string} - Hex color code in pastel palette
 */
export const getPastelColorForCountry = (m49) => {
  if (!m49) return COLOR_SCHEME.borderSecondary; // Default light gray for unknown
  
  // Convert to number and use a better distribution algorithm
  const m49Num = typeof m49 === 'string' ? parseInt(m49, 10) : m49;
  
  // Use a simple hash-like function that distributes better across the palette
  // Prime number multiplication helps spread values more evenly
  const index = (m49Num * 73) % PASTEL_COLORS.length;
  
  return PASTEL_COLORS[index];
};

/**
 * Gets the color for a path based on its type
 *
 * @param {Object} path - The path data object
 * @param {boolean} isHintOverlay - Whether this path is a hint
 * @param {boolean} isShowMeOverlay - Whether this path is shown by "Show Me" button
 * @param {Object} colors - Color scheme object
 * @param {string} hoveredCountry - Currently hovered country path
 * @param {boolean} hintsGuessed - Whether user has made a guess (hints should be black)
 * @returns {string} - Hex color code
 */
export const getPathColor = (
  path,
  isHintOverlay,
  isShowMeOverlay,
  colors,
  hoveredCountry = null,
  hintsGuessed = false
) => {
  // Show Me overlay gets the correct color
  if (isShowMeOverlay) {
    return colors.correct;
  }

  // Hints: BLACK if user guessed, PASTEL if not
  if (isHintOverlay) {
    if (hintsGuessed) {
      return COLOR_SCHEME.black;
    } else {
      const m49 = path.id || path.properties?.id;
      return getPastelColorForCountry(m49);
    }
  }

  // Hover state
  if (path === hoveredCountry) {
    return colors.selected;
  }

  // Default (no path visible)
  return COLOR_SCHEME.black;
};

/**
 * Gets the stroke color for a path outline
 *
 * @param {Object} path - The path data object
 * @param {boolean} isHintOverlay - Whether this path is a hint
 * @param {boolean} isShowMeOverlay - Whether this path is shown by "Show Me" button
 * @param {boolean} hintsGuessed - Whether user has made a guess (hints should be black)
 * @returns {string} - Hex color code for outline
 */
export const getPathStrokeColor = (path, isHintOverlay, isShowMeOverlay, hintsGuessed = false) => {
  // Show Me overlay gets darker outline
  if (isShowMeOverlay) {
    return COLOR_SCHEME.borderPrimary;
  }

  // Hints: black if user guessed, pastel if not
  if (isHintOverlay) {
    if (hintsGuessed) {
      return COLOR_SCHEME.black;
    } else {
      const m49 = path.id || path.properties?.id;
      return getPastelColorForCountry(m49);
    }
  }

  // Default (no outline visible)
  return COLOR_SCHEME.black;
};

export default {
  getPastelColorForCountry,
  getPathColor,
  getPathStrokeColor,
};
