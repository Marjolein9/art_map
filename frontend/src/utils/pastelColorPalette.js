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
 * Keeps incorrect answers red until a NEW country is assigned
 * 
 * @param {Object} path - The path data object
 * @param {string} gameStatus - Current game status ('correct', 'incorrect', 'playing')
 * @param {boolean} isHintOverlay - Whether this path is a hint
 * @param {boolean} isShowMeOverlay - Whether this path is shown by "Show Me" button
 * @param {string} clickedCountry - ISO3 code of clicked country
 * @param {string} targetCountry - ISO3 code of current target country
 * @param {Function} getCountryIsoCode - Function to get ISO code from path
 * @param {Object} colors - Color scheme object
 * @param {string} hoveredCountry - Currently hovered country path
 * @returns {string} - Hex color code
 */
export const getPathColor = (
  path,
  gameStatus,
  isHintOverlay,
  isShowMeOverlay,
  clickedCountry,
  targetCountry,
  getCountryIsoCode,
  colors,
  hoveredCountry = null
) => {
  const pathIso = getCountryIsoCode(path);
  
  // DEBUG: Log color decision for clicked countries
  if (pathIso === clickedCountry) {
    console.log(`🎨 PATH COLOR: iso=${pathIso}, gameStatus=${gameStatus}, clickedCountry=${clickedCountry}, targetCountry=${targetCountry}, isHint=${isHintOverlay}, isShowMe=${isShowMeOverlay}`);
  }
  
  // Incorrect answer stays red until a NEW country is assigned
  // Only show red if: clicked this country, it was wrong, AND we're still on the same target
  if (
    clickedCountry === pathIso && 
    gameStatus === 'incorrect' && 
    clickedCountry !== targetCountry  // NOT the target, so it was a wrong guess
  ) {
    console.log(`🔴 SHOWING RED for ${pathIso} (clicked but wrong, target is ${targetCountry})`);
    return COLOR_SCHEME.incorrect; // Red for wrong answer
  }
  
  // Correct answer shows in correct color from theme
  if (clickedCountry === pathIso && gameStatus === 'correct') {
    console.log(`✅ SHOWING CORRECT COLOR for ${pathIso}`);
    return colors.correct;
  }
  
  // Show Me overlay gets the correct color
  if (isShowMeOverlay) {
    return colors.correct;
  }
  
  // Hints get pastel colors
  if (isHintOverlay) {
    const m49 = path.id || path.properties?.id;
    return getPastelColorForCountry(m49);
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
  const m49 = path.id || path.properties?.id;
  console.log(`🎨 getPathStrokeColor CALLED: m49=${m49}, isHint=${isHintOverlay}, isShowMe=${isShowMeOverlay}, hintsGuessed=${hintsGuessed}`);

  // Show Me overlay gets darker outline
  if (isShowMeOverlay) {
    console.log(`  → ShowMe overlay - returning BLACK`);
    return COLOR_SCHEME.borderPrimary; // Black border
  }

  // Hints: black if user guessed, pastel if not
  if (isHintOverlay) {
    if (hintsGuessed) {
      console.log(`  → Hint ${m49} - User guessed - returning BLACK`);
      return COLOR_SCHEME.black; // Black after guess
    } else {
      const pastelColor = getPastelColorForCountry(m49);
      console.log(`  → Hint ${m49} - No guess yet - returning PASTEL ${pastelColor}`);
      return pastelColor; // Pastel before guess
    }
  }

  // Default (no outline visible)
  console.log(`  → Default - returning BLACK`);
  return COLOR_SCHEME.black;
};

export default {
  getPastelColorForCountry,
  getPathColor,
  getPathStrokeColor,
};
