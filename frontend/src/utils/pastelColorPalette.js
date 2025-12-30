/**
 * Pastel Color Palette Generator
 *
 * This module generates consistent, pleasant pastel colors for each country based on its M49 code.
 * It ensures each country gets the same color every time, creating a stable visual experience.
 *
 * KEY CONCEPTS:
 * - Deterministic algorithms: Same input always produces same output
 * - Hash-like functions: Distribute values evenly across a range
 * - Modulo operator: Wraps numbers to stay within bounds
 */

// Import centralized color scheme
import COLOR_SCHEME from '../styles/colorSchemes';
// COLOR_SCHEME: Object containing all application colors (defined in colorSchemes.js)

/**
 * PASTEL COLORS ARRAY
 *
 * Pastel colors: Soft, light colors that are easy on the eyes
 * These are imported from our centralized color scheme for consistency
 */
const PASTEL_COLORS = COLOR_SCHEME.pastelColors;

/**
 * Generate Deterministic Pastel Color
 *
 * DETERMINISTIC: Same M49 code always returns the same color
 * This is important so countries don't change color when the page refreshes
 *
 * ALGORITHM:
 * Uses a simple hash-like function to distribute M49 codes across the color palette.
 * M49 codes are numbers (e.g., 276 for Germany, 840 for USA).
 * We multiply by a prime number (73) to spread values evenly, then use modulo
 * to wrap the result into our palette array bounds.
 *
 * WHY PRIME NUMBERS?
 * Multiplying by prime numbers helps distribute values more evenly and avoid patterns.
 * Example: If we just used % without multiplication, countries with sequential M49 codes
 * (like 100, 101, 102) would get adjacent colors, creating visual clusters.
 *
 * @param {string|number} m49 - UN M49 numeric country code
 * @returns {string} - Hex color code (e.g., "#FFD700")
 */
export const getPastelColorForCountry = (m49) => {
  // Guard clause: Handle missing M49 code
  if (!m49) return COLOR_SCHEME.borderSecondary; // Default light gray for unknown countries

  /**
   * TYPE CONVERSION:
   * M49 codes can be strings ("276") or numbers (276)
   * We need to ensure we have a number for math operations
   */

  // typeof: Operator that returns the data type ('string', 'number', 'object', etc.)
  const m49Num = typeof m49 === 'string' ? parseInt(m49, 10) : m49;
  /**
   * TERNARY OPERATOR: condition ? ifTrue : ifFalse
   * parseInt(string, base): Converts string to integer
   *   - First argument: string to parse
   *   - Second argument: base/radix (10 = decimal, 2 = binary, 16 = hexadecimal)
   * Example: parseInt("276", 10) returns number 276
   */

  /**
   * HASH-LIKE DISTRIBUTION:
   * Multiply by prime number 73 to spread M49 codes across the palette
   * Then use modulo (%) to wrap the result to stay within array bounds
   *
   * MODULO OPERATOR (%):
   * Returns the remainder after division
   * Examples:
   *   5 % 3 = 2  (5 divided by 3 = 1 remainder 2)
   *   10 % 7 = 3  (10 divided by 7 = 1 remainder 3)
   *   14 % 5 = 4  (14 divided by 5 = 2 remainder 4)
   *
   * This ensures index stays between 0 and (PASTEL_COLORS.length - 1)
   */
  const index = (m49Num * 73) % PASTEL_COLORS.length;

  // Return the color at the calculated index
  // Array indexing: array[index] retrieves element at that position
  return PASTEL_COLORS[index];
};

/**
 * Get Path Color Based on Context
 *
 * This function determines what color to use for a country border/fill
 * based on the current game state and whether it's a hint or answer.
 *
 * FUNCTION PARAMETERS:
 * @param {Object} path - The country path data object containing geometry and properties
 * @param {boolean} isHintOverlay - Whether this path is being displayed as a hint
 * @param {boolean} isShowMeOverlay - Whether this path is the revealed answer ("Show Me" button)
 * @param {Object} colors - Color scheme object with theme colors
 * @param {string} hoveredCountry - Currently hovered country path (null if none)
 * @param {boolean} hintsEnabled - Whether the hints toggle is turned on
 * @param {string} mode - Current app mode ('quiz' or 'explore')
 * @returns {string} - Hex color code or rgba() color string
 */
export const getPathColor = (
  path,
  isHintOverlay,
  isShowMeOverlay,
  colors,
  hoveredCountry = null,  // Default parameter: = null if not provided
  hintsEnabled = false,   // Default parameter: = false if not provided
  mode = 'explore'        // Default parameter: = 'explore' if not provided
) => {
  /**
   * PROPERTY ACCESS:
   * Get M49 code from path object
   * Try multiple locations where it might be stored
   */
  const m49 = path.id || path.properties?.id;
  /**
   * OPTIONAL CHAINING (?.):
   * Safely access nested properties that might not exist
   * path.properties?.id means:
   *   - If path.properties exists, return path.properties.id
   *   - If path.properties is null/undefined, return undefined (no error)
   *
   * Without (?.), this would throw an error if properties doesn't exist:
   *   path.properties.id  // Error: Cannot read property 'id' of undefined
   */

  /**
   * CONDITIONAL RENDERING LOGIC:
   * Different states get different colors, checked in priority order
   */

  // Priority 1: "Show Me" overlay - highlight the correct answer
  if (isShowMeOverlay) {
    return colors.correct;  // Green color for correct answer
  }

  // Priority 2: Hint overlay - show pastel color for hints
  if (isHintOverlay) {
    return getPastelColorForCountry(m49);
  }

  // Priority 3: Hover state - highlight when mouse hovers over
  if (path === hoveredCountry) {
    return colors.selected;
  }

  /**
   * Priority 4: Default state - depends on mode and hints setting
   *
   * RGBA COLORS:
   * rgba(red, green, blue, alpha)
   * - red, green, blue: 0-255 (color components)
   * - alpha: 0-1 (opacity/transparency)
   *   - 0 = fully transparent
   *   - 1 = fully opaque
   *   - 0.3 = 30% opaque (70% transparent)
   */
  if (mode === 'quiz' && hintsEnabled) {
    // In quiz mode with hints: semi-transparent white borders
    return 'rgba(255, 255, 255, 0.3)';
    /**
     * WHY SEMI-TRANSPARENT?
     * Makes country borders visible but subtle, so hints stand out more
     * White (255, 255, 255) at 30% opacity blends nicely with the globe
     */
  }

  // Default: Black borders
  return COLOR_SCHEME.black;
};

/**
 * Get Stroke (Outline) Color for Path
 *
 * Determines the color of the country border outline.
 * Handles visibility based on hints mode.
 *
 * @param {Object} path - The country path data
 * @param {boolean} isHintOverlay - Whether this is a hint
 * @param {boolean} isShowMeOverlay - Whether this is the revealed answer
 * @param {boolean} hintsEnabled - Whether hints are enabled in quiz mode
 * @param {string} mode - Current app mode ('quiz' or 'explore')
 * @returns {string} - Hex color code for the outline
 */
export const getPathStrokeColor = (path, isHintOverlay, isShowMeOverlay, hintsEnabled = false, mode = 'explore') => {
  // "Show Me" overlay gets a darker outline for emphasis
  if (isShowMeOverlay) {
    return COLOR_SCHEME.borderPrimary;
  }

  // In quiz mode with hints enabled: only show borders for hint countries
  if (mode === 'quiz' && hintsEnabled) {
    // Hint countries get black borders for visibility
    if (isHintOverlay) {
      return COLOR_SCHEME.black;
    }
    // Non-hint countries get transparent borders (invisible)
    return 'rgba(0, 0, 0, 0)';
  }

  // All other cases (explore mode or hints off): Black outline
  return COLOR_SCHEME.black;
};

/**
 * DEFAULT EXPORT
 *
 * EXPORT TYPES:
 * 1. Named exports (what we used above): export const functionName = ...
 *    - Import with: import { functionName } from './file'
 *
 * 2. Default export (below): export default object
 *    - Import with: import anyName from './file'
 *
 * This file uses both! Named exports for individual functions,
 * and a default export that bundles them together.
 */
export default {
  getPastelColorForCountry,
  getPathColor,
  getPathStrokeColor,
};

/**
 * USAGE EXAMPLES:
 *
 * Named imports (recommended for tree-shaking):
 *   import { getPastelColorForCountry, getPathColor } from './pastelColorPalette';
 *   const color = getPastelColorForCountry(276);
 *
 * Default import:
 *   import palette from './pastelColorPalette';
 *   const color = palette.getPastelColorForCountry(276);
 *
 * TREE-SHAKING:
 * Build tools can remove unused code when using named imports
 * If you only import getPastelColorForCountry, the other functions won't be in your bundle
 * This makes your app smaller and faster to load
 */
