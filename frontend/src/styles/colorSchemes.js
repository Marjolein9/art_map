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
  bgOverlay: '#FFFFFF',        // solid white, no transparency

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

  // Distinct vibrant colors for hints (designed for clear differentiation)
  pastelColors: [
    '#FF4444', // Bright Red
    '#FF8800', // Vivid Orange
    '#FFDD00', // Golden Yellow
    '#00CC44', // Emerald Green
    '#00CCCC', // Cyan
    '#0088FF', // Sky Blue
    '#4466FF', // Royal Blue
    '#8844FF', // Purple
    '#CC44FF', // Magenta
    '#FF44CC', // Hot Pink
    '#FF6B6B', // Coral Red
    '#FFB84D', // Tangerine
    '#FFE74D', // Lemon Yellow
    '#4DFF88', // Mint Green
    '#4DFFFF', // Aqua
    '#4DB8FF', // Light Blue
    '#7B8FFF', // Periwinkle
    '#B47BFF', // Lavender
    '#FF7BFF', // Orchid
    '#FF7BC4', // Rose Pink
    '#CC0000', // Dark Red
    '#CC6600', // Dark Orange
    '#CCAA00', // Olive Gold
    '#00AA33', // Forest Green
    '#00AAAA', // Teal
    '#0066CC', // Ocean Blue
    '#3344CC', // Indigo
    '#6633CC', // Deep Purple
    '#AA33CC', // Violet
    '#CC33AA', // Fuchsia
    '#E63946', // Crimson
    '#F77F00', // Amber
    '#FCBF49', // Honey
    '#06D6A0', // Turquoise
    '#118AB2', // Steel Blue
    '#073B4C', // Navy
    '#7209B7', // Royal Purple
    '#F72585', // Neon Pink
    '#B5179E', // Plum
    '#560BAD'  // Dark Violet
  ],

  // Deprecated (keeping for backward compatibility during migration)
  glow: 'rgba(0, 0, 0, 0.2)',
  border: '#000000',
  text: '#000000',
  cardBg: '#FFFFFF',
  backgroundGradient: 'none'
};

export default COLOR_SCHEME;
