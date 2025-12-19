/**
 * Pastel Color Palette Generator
 * 
 * Generates a consistent pastel color for each country based on its M49 code.
 * Each country gets a unique, pleasant pastel color that's easy on the eyes.
 */

// Beautiful pastel palette - soft, muted colors (50+ unique colors to avoid collisions)
const PASTEL_COLORS = [
  '#FFB3BA', // Pastel Pink
  '#FFCCCB', // Light Pink
  '#FFE5B4', // Peach
  '#FFDAB9', // Peach Puff
  '#FFE4B5', // Moccasin
  '#FFEFD5', // Papaya Whip
  '#FFFACD', // Lemon Chiffon
  '#F0FFF0', // Honeydew
  '#E0FFFF', // Light Cyan
  '#B0E0E6', // Powder Blue
  '#ADD8E6', // Light Blue
  '#87CEEB', // Sky Blue
  '#DDA0DD', // Plum
  '#EE82EE', // Violet
  '#FFB6C1', // Light Pink Rose
  '#FFC0CB', // Pink
  '#F5DEB3', // Wheat
  '#DEB887', // Burlywood
  '#D2B48C', // Tan
  '#F0E68C', // Khaki
  '#FFFACD', // Lemon Chiffon
  '#FAFAD2', // Light Goldenrod Yellow
  '#F5F5DC', // Beige
  '#FFF8DC', // Cornsilk
  '#FFFAF0', // Floral White
  '#FAF0E6', // Linen
  '#FFE4E1', // Misty Rose
  '#F0FFFF', // Azure
  '#E6F2FF', // Alice Blue variant
  '#F0F8FF', // Ghost White
  '#F5FFFA', // Mint Cream
  '#FFFAF0', // Floral White
  '#F0FFF0', // Honeydew
  '#FFFACD', // Lemon Chiffon
  '#FFE4B5', // Moccasin
  '#FFD7BE', // Peach variant
  '#FFE4C4', // Bisque
  '#FFDEAD', // Navajo White
  '#F5DEB3', // Wheat
  '#DEB887', // Burlywood
  '#D2B48C', // Tan
  '#BC8F8F', // Rosy Brown
  '#DDA0DD', // Plum
  '#EE82EE', // Violet
  '#DA70D6', // Orchid
  '#BA55D3', // Medium Orchid
  '#9370DB', // Medium Purple
  '#D8BFD8', // Thistle
  '#FFE4E1', // Misty Rose
  '#F08080', // Light Coral
  '#CD5C5C', // Indian Red
  '#F4A460', // Sandy Brown
  '#DAA520', // Goldenrod (muted)
];

/**
 * Generates a deterministic pastel color based on M49 code
 * Uses a better distribution algorithm to avoid collisions
 * 
 * @param {string|number} m49 - UN M49 code for the country
 * @returns {string} - Hex color code in pastel palette
 */
export const getPastelColorForCountry = (m49) => {
  if (!m49) return '#D3D3D3'; // Default light gray for unknown
  
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
    return '#FF6B6B'; // Bright red for wrong answer
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
  return '#000';
};

/**
 * Gets the stroke color for a path outline
 * 
 * @param {Object} path - The path data object
 * @param {boolean} isHintOverlay - Whether this path is a hint
 * @param {boolean} isShowMeOverlay - Whether this path is shown by "Show Me" button
 * @returns {string} - Hex color code for outline
 */
export const getPathStrokeColor = (path, isHintOverlay, isShowMeOverlay) => {
  // Show Me overlay gets darker outline
  if (isShowMeOverlay) {
    return '#8B4513'; // Dark brown from vintage theme
  }
  
  // Hints get pastel colored outlines
  if (isHintOverlay) {
    const m49 = path.id || path.properties?.id;
    return getPastelColorForCountry(m49);
  }
  
  // Default (no outline visible)
  return '#000';
};

export default {
  getPastelColorForCountry,
  getPathColor,
  getPathStrokeColor,
};
