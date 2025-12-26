import { createTheme } from '@mui/material/styles';
import COLOR_SCHEME from '../styles/colorSchemes';

/**
 * MUI Theme - Black & White Color Scheme
 * 
 * Uses the single source of truth from COLOR_SCHEME
 * Customizes Material-UI components to use black/white palette
 */
const muiTheme = createTheme({
  palette: {
    primary: {
      main: COLOR_SCHEME.textPrimary,      // Black
      light: COLOR_SCHEME.textSecondary,   // Gray-600
      dark: COLOR_SCHEME.textPrimary,      // Black
      contrastText: COLOR_SCHEME.bgPrimary, // White
    },
    secondary: {
      main: COLOR_SCHEME.linkColor,        // Blue for links
      light: COLOR_SCHEME.linkColor,
      dark: COLOR_SCHEME.textPrimary,
      contrastText: COLOR_SCHEME.white,
    },
    background: {
      default: COLOR_SCHEME.bgPrimary,     // White
      paper: COLOR_SCHEME.bgSecondary,     // Light gray
    },
    text: {
      primary: COLOR_SCHEME.textPrimary,   // Black
      secondary: COLOR_SCHEME.textSecondary, // Gray-600
      disabled: COLOR_SCHEME.textTertiary,   // Gray-500
    },
    divider: COLOR_SCHEME.borderSecondary, // Light border
    success: {
      main: COLOR_SCHEME.correct,          // Green
    },
    error: {
      main: COLOR_SCHEME.incorrect,        // Red
    },
  },
  typography: {
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    fontSize: 16, // Base font size (1rem = 16px)
    h2: {
      fontSize: '18pt',
      fontWeight: 300,
      letterSpacing: '1.5px',
    },
    h3: {
      fontSize: '1rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '1px',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
          padding: '8px 16px',
          border: `1px solid ${COLOR_SCHEME.borderPrimary}`,
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: COLOR_SCHEME.hover,
            boxShadow: `0 0 8px ${COLOR_SCHEME.shadowLight}`,
          },
        },
        contained: {
          backgroundColor: COLOR_SCHEME.bgSecondary,
          color: COLOR_SCHEME.textPrimary,
          '&:hover': {
            backgroundColor: COLOR_SCHEME.hover,
          },
        },
        outlined: {
          borderColor: COLOR_SCHEME.borderPrimary,
          color: COLOR_SCHEME.textPrimary,
          '&:hover': {
            borderColor: COLOR_SCHEME.textPrimary,
            backgroundColor: COLOR_SCHEME.hover,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: COLOR_SCHEME.bgPrimary,
          borderRadius: '8px',
          border: `5px solid ${COLOR_SCHEME.borderPrimary}`,
          boxShadow: `0 0 20px ${COLOR_SCHEME.shadowMedium}`,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          color: COLOR_SCHEME.textPrimary,
          fontFamily: "'Roboto Condensed', sans-serif",
          fontWeight: 300,
          fontSize: '18pt',
          letterSpacing: '1.5px',
          paddingBottom: '8px',
          borderBottom: `1px solid ${COLOR_SCHEME.borderSecondary}`,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          color: COLOR_SCHEME.textPrimary,
          maxHeight: 'calc(100vh - 200px)',
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: COLOR_SCHEME.bgSecondary,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: COLOR_SCHEME.borderSecondary,
            borderRadius: '4px',
          },
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          color: COLOR_SCHEME.textPrimary,
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          '& .MuiSwitch-switchBase.Mui-checked': {
            color: COLOR_SCHEME.correct,
          },
          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
            backgroundColor: COLOR_SCHEME.correct,
          },
        },
      },
    },
  },
});

export default muiTheme;
