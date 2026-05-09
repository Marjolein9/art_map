// Centralized Color Scheme for the App
// Warm parchment / ink palette

export const COLOR_SCHEME = {
  name: 'Warm Parchment',

  // Base colors
  white: '#FFFFFF',
  black: '#000000',

  // Paper tones
  paper: '#f1ead9',
  paperAlt: '#e8dfc8',

  // Text / ink
  textPrimary: '#1a1612',
  textSecondary: '#3a322a',
  textTertiary: '#6c6356',

  // Backgrounds
  bgPrimary: '#f1ead9',
  bgSecondary: '#e8dfc8',
  bgOverlay: '#f1ead9',

  // Borders
  borderPrimary: '#1a1612',
  borderSecondary: '#cfc4a8',

  // Interactive states
  hover: '#e8dfc8',
  selected: '#cfc4a8',

  // Accent — terracotta
  accent: '#b34727',
  accentAlt: '#d77a4b',

  // Semantic colors
  correct: '#5a7849',
  incorrect: '#a25636',
  warning: '#e8dfc8',

  // Links — use accent
  linkColor: '#b34727',
  linkHover: '#7a2c14',

  // Globe/Map specific — keep globe itself white/neutral
  oceanColor: '#FFFFFF',
  landColor: '#FFFFFF',
  atmosphereColor: '#E5E5E5',

  // Shadows — warm-tinted, no colored glow
  shadowLight: 'rgba(26,22,18,0.08)',
  shadowMedium: 'rgba(26,22,18,0.18)',
  shadowHeavy: 'rgba(26,22,18,0.35)',

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
  glow: 'rgba(26,22,18,0.18)',
  border: '#cfc4a8',
  text: '#1a1612',
  cardBg: '#f1ead9',
  backgroundGradient: 'none'
};

export default COLOR_SCHEME;
