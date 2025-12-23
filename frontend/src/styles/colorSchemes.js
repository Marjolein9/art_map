// Centralized Color Scheme for the App
// Single source of truth for ALL colors in the application

export const COLOR_SCHEME = {
  name: 'Simple Black & White',

  // Base colors
  white: '#FFFFFF',
  black: '#000000',

  // Text
  textPrimary: '#000000',
  textSecondary: '#525252',    // gray-600
  textTertiary: '#737373',     // gray-500

  // Backgrounds
  bgPrimary: '#FFFFFF',
  bgSecondary: '#F5F5F5',      // gray-100
  bgOverlay: 'rgba(0, 0, 0, 0.5)',

  // Borders
  borderPrimary: '#000000',
  borderSecondary: '#E5E5E5',   // gray-200

  // Interactive states
  hover: '#E5E5E5',            // gray-200
  selected: '#D4D4D4',         // gray-300

  // Semantic colors
  correct: '#22C55E',          // green-500
  incorrect: '#EF4444',        // red-500
  warning: '#F5F5F5',          // light gray for errors

  // Links
  linkColor: '#3B82F6',        // blue-500
  linkHover: '#2563EB',        // blue-600

  // Globe/Map specific
  oceanColor: '#FFFFFF',       // white ocean
  landColor: '#FFFFFF',        // white land
  atmosphereColor: '#E5E5E5', // light gray atmosphere

  // Shadows and effects
  shadowLight: 'rgba(0, 0, 0, 0.1)',
  shadowMedium: 'rgba(0, 0, 0, 0.2)',
  shadowHeavy: 'rgba(0, 0, 0, 0.3)',

  // Pastel palette for hints (moved from pastelColorPalette.js)
  pastelColors: [
    '#FFB3BA', '#FFCCCB', '#FFE5B4', '#FFDAB9', '#FFE4B5', '#FFEFD5',
    '#FFFACD', '#F0FFF0', '#E0FFFF', '#B0E0E6', '#ADD8E6', '#87CEEB',
    '#DDA0DD', '#EE82EE', '#FFB6C1', '#FFC0CB', '#F5DEB3', '#DEB887',
    '#D2B48C', '#F0E68C', '#FAFAD2', '#F5F5DC', '#FFF8DC', '#FFFAF0',
    '#FAF0E6', '#FFE4E1', '#F0FFFF', '#E6F2FF', '#F0F8FF', '#F5FFFA',
    '#FFE4C4', '#FFDEAD', '#BC8F8F', '#DA70D6', '#BA55D3', '#9370DB',
    '#D8BFD8', '#F08080', '#CD5C5C', '#F4A460', '#DAA520'
  ],

  // Candle colors (moved from Candles.css)
  candleOrange: '#ff6a00',
  candleOrangeYellow: '#ff9224',
  candleDark: '#2c2b39',
  candleBlueDark: '#30537d',
  candleBlueLight: '#76daff',
  candleYellow: '#fbf348',
  candleYellowGrey: '#58523a',

  // Deprecated (keeping for backward compatibility during migration)
  glow: 'rgba(0, 0, 0, 0.2)',
  border: '#000000',
  text: '#000000',
  cardBg: '#FFFFFF',
  backgroundGradient: 'none'
};

export default COLOR_SCHEME;
