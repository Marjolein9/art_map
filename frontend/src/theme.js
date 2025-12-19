import { createTheme } from '@mui/material/styles';
import COLOR_SCHEME from './styles/colorSchemes';

/**
 * Material-UI Theme Configuration
 * Integrates the existing vintage 1900s color scheme with MUI's theming system
 */
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: COLOR_SCHEME.linkColor, // #8fb3c9
      light: COLOR_SCHEME.linkHover, // #b0d4e8
      dark: '#6d8fa5',
      contrastText: COLOR_SCHEME.text,
    },
    secondary: {
      main: COLOR_SCHEME.buttonSecondary, // #d4a574
      light: '#e0b98a',
      dark: '#a8845c',
      contrastText: COLOR_SCHEME.text,
    },
    error: {
      main: COLOR_SCHEME.incorrect, // #8b4513
    },
    success: {
      main: COLOR_SCHEME.correct, // #7e215fff
    },
    background: {
      default: COLOR_SCHEME.cardBg, // rgba(232, 220, 196, 0.85)
      paper: COLOR_SCHEME.cardBg,
    },
    text: {
      primary: COLOR_SCHEME.textPrimary, // rgba(229, 229, 229, 0.7)
      secondary: COLOR_SCHEME.textSecondary, // rgba(229, 229, 229, 0.6)
      disabled: COLOR_SCHEME.textTertiary, // rgba(229, 229, 229, 0.5)
    },
  },
  typography: {
    fontFamily: "'Roboto', Helvetica, sans-serif",
    h1: {
      fontFamily: "'Roboto Condensed', Helvetica, sans-serif",
      fontWeight: 300,
      letterSpacing: '1.5px',
    },
    h2: {
      fontFamily: "'Roboto Condensed', Helvetica, sans-serif",
      fontWeight: 300,
      letterSpacing: '1.5px',
    },
    h3: {
      fontFamily: "'Roboto Condensed', Helvetica, sans-serif",
      fontWeight: 300,
      letterSpacing: '1.5px',
      fontSize: '18pt',
    },
    h4: {
      fontFamily: "'Roboto Condensed', Helvetica, sans-serif",
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '1px',
      fontSize: '16px',
    },
    h5: {
      fontFamily: "'Roboto Condensed', Helvetica, sans-serif",
      fontWeight: 600,
      fontSize: '14px',
    },
    button: {
      textTransform: 'uppercase',
      letterSpacing: '1px',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
          padding: '10px 20px',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: `0 0 12px ${COLOR_SCHEME.glow}`,
          },
        },
        outlined: {
          borderWidth: '2px',
          '&:hover': {
            borderWidth: '2px',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: COLOR_SCHEME.cardBg,
          backdropFilter: 'blur(10px)',
          border: `5px solid ${COLOR_SCHEME.border}`,
          boxShadow: `0 0 20px ${COLOR_SCHEME.glow}, 0 4px 6px rgba(0, 0, 0, 0.3)`,
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(3px)',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: COLOR_SCHEME.linkColor,
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'scale(1.1)',
            boxShadow: `0 0 10px ${COLOR_SCHEME.glow}`,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: COLOR_SCHEME.bgOverlayLight,
          border: `1px solid ${COLOR_SCHEME.border}`,
          transition: 'all 0.25s ease-in-out',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: `0 0 20px ${COLOR_SCHEME.glow}, 0 4px 12px rgba(0, 0, 0, 0.5)`,
          },
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: COLOR_SCHEME.linkColor,
          textDecorationColor: COLOR_SCHEME.linkUnderline,
          textShadow: `0 0 8px ${COLOR_SCHEME.linkShadow}`,
          transition: 'all 0.2s ease',
          '&:hover': {
            color: COLOR_SCHEME.linkHover,
            textDecorationColor: COLOR_SCHEME.linkHover,
            textShadow: `0 0 12px ${COLOR_SCHEME.linkHoverShadow}`,
          },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          border: `1px solid ${COLOR_SCHEME.border}`,
          color: COLOR_SCHEME.textPrimary,
          '&.Mui-selected': {
            backgroundColor: COLOR_SCHEME.buttonPrimary,
            color: COLOR_SCHEME.text,
            '&:hover': {
              backgroundColor: COLOR_SCHEME.buttonSecondary,
            },
          },
        },
      },
    },
  },
});

export default theme;
