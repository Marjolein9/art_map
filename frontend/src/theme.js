import { createTheme } from '@mui/material/styles';

/**
 * Minimal MUI Theme for CSS-based styling approach
 *
 * This theme provides basic MUI component functionality while allowing
 * components to be styled primarily through CSS classes in components.css
 */
const theme = createTheme({
  // Use default MUI theme values
  // Components will be styled via CSS classes, not theme overrides
});

export default theme;
