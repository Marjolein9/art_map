import { createTheme } from '@mui/material/styles';
import COLOR_SCHEME from '../styles/colorSchemes';

const muiTheme = createTheme({
  palette: {
    primary: {
      main: COLOR_SCHEME.textPrimary,
      light: COLOR_SCHEME.textSecondary,
      dark: COLOR_SCHEME.textPrimary,
      contrastText: COLOR_SCHEME.paper,
    },
    secondary: {
      main: COLOR_SCHEME.accent,
      light: COLOR_SCHEME.accentAlt,
      dark: '#7a2c14',
      contrastText: COLOR_SCHEME.paper,
    },
    background: {
      default: COLOR_SCHEME.bgPrimary,
      paper: COLOR_SCHEME.bgSecondary,
    },
    text: {
      primary: COLOR_SCHEME.textPrimary,
      secondary: COLOR_SCHEME.textSecondary,
      disabled: COLOR_SCHEME.textTertiary,
    },
    divider: COLOR_SCHEME.borderSecondary,
    success: {
      main: COLOR_SCHEME.correct,
    },
    error: {
      main: COLOR_SCHEME.incorrect,
    },
  },
  typography: {
    fontFamily: "'Manrope', ui-sans-serif, system-ui, sans-serif",
    fontSize: 16,
    h2: {
      fontFamily: "'Cormorant Garamond', Georgia, serif",
      fontSize: '2rem',
      fontWeight: 500,
      fontStyle: 'italic',
      letterSpacing: '-0.01em',
    },
    h3: {
      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
      fontSize: '10px',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.22em',
      color: COLOR_SCHEME.textTertiary,
    },
    h4: {
      fontFamily: "'Cormorant Garamond', Georgia, serif",
      fontSize: '1.5rem',
      fontWeight: 500,
      fontStyle: 'italic',
    },
    subtitle1: {
      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
      fontSize: '10px',
      fontWeight: 500,
      textTransform: 'uppercase',
      letterSpacing: '0.18em',
      color: COLOR_SCHEME.textTertiary,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
      fontFamily: "'Manrope', ui-sans-serif, system-ui, sans-serif",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '999px',
          padding: '8px 18px',
          border: `1px solid ${COLOR_SCHEME.borderSecondary}`,
          transition: 'all 0.15s ease',
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: '11px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          '&:hover': {
            backgroundColor: COLOR_SCHEME.paperAlt,
            borderColor: COLOR_SCHEME.textPrimary,
          },
        },
        contained: {
          backgroundColor: COLOR_SCHEME.textPrimary,
          color: COLOR_SCHEME.paper,
          borderColor: COLOR_SCHEME.textPrimary,
          '&:hover': {
            backgroundColor: COLOR_SCHEME.accent,
            borderColor: COLOR_SCHEME.accent,
          },
        },
        outlined: {
          borderColor: COLOR_SCHEME.borderSecondary,
          color: COLOR_SCHEME.textSecondary,
          backgroundColor: COLOR_SCHEME.paper,
          '&:hover': {
            borderColor: COLOR_SCHEME.textPrimary,
            backgroundColor: COLOR_SCHEME.paperAlt,
            color: COLOR_SCHEME.textPrimary,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: COLOR_SCHEME.bgPrimary,
          borderRadius: '6px',
          border: `1px solid rgba(0,0,0,0.08)`,
          boxShadow: `0 40px 80px ${COLOR_SCHEME.shadowHeavy}`,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          color: COLOR_SCHEME.textPrimary,
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontWeight: 500,
          fontStyle: 'italic',
          fontSize: '1.75rem',
          letterSpacing: '-0.01em',
          paddingBottom: '12px',
          borderBottom: `1px solid ${COLOR_SCHEME.borderSecondary}`,
          backgroundColor: COLOR_SCHEME.paperAlt,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          color: COLOR_SCHEME.textPrimary,
          backgroundColor: COLOR_SCHEME.bgPrimary,
          maxHeight: 'calc(100vh - 200px)',
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
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
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: COLOR_SCHEME.bgPrimary,
          border: `1px solid ${COLOR_SCHEME.borderSecondary}`,
          borderRadius: '4px',
          boxShadow: `0 4px 20px ${COLOR_SCHEME.shadowLight}`,
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${COLOR_SCHEME.borderSecondary}`,
          backgroundColor: COLOR_SCHEME.paperAlt,
          padding: '14px 18px',
        },
        title: {
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontStyle: 'italic',
          fontWeight: 500,
          fontSize: '1.2rem',
          color: COLOR_SCHEME.textPrimary,
        },
        subheader: {
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: '9px',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: COLOR_SCHEME.textTertiary,
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
    MuiSelect: {
      styleOverrides: {
        root: {
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: '11px',
          letterSpacing: '0.05em',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontFamily: "'Manrope', ui-sans-serif, system-ui, sans-serif",
          fontSize: '13px',
          '&:hover': {
            backgroundColor: COLOR_SCHEME.paperAlt,
          },
          '&.Mui-selected': {
            backgroundColor: COLOR_SCHEME.selected,
          },
        },
      },
    },
  },
});

export default muiTheme;
