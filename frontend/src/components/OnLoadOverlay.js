/**
 * OnLoadOverlay Component - Initial Mode Selection Dialog
 *
 * COMPONENT PURPOSE:
 * ====================
 * This component displays a modal dialog when the app first loads, allowing users
 * to choose between Quiz Mode (guessing countries) and Explore Mode (free browsing).
 *
 * INTERVIEW TOPICS:
 * =================
 *
 * 1. REACT COMPONENTS:
 *    - Functional components are JavaScript functions that return JSX
 *    - JSX: JavaScript XML - lets us write HTML-like syntax in JavaScript
 *    - React converts JSX to createElement() calls
 *
 * 2. PROPS (Component Input):
 *    - Props are read-only data passed from parent to child component
 *    - Destructuring in parameters: { onStartQuiz, onExplore, onClose }
 *    - Props enable component reusability and composition
 *
 * 3. MATERIAL-UI (MUI):
 *    - Pre-built React component library with consistent design
 *    - Dialog: Modal overlay component (blocks interaction with background)
 *    - Box: Flexible container for layout (replaces <div> with built-in styling)
 *    - Typography: Styled text component with variants (h1-h6, body, caption)
 *    - sx prop: MUI's styling system (CSS-in-JS)
 *
 * 4. EVENT HANDLING:
 *    - onClick: React's way of handling click events
 *    - Passes functions as props (onStartQuiz, onExplore) to communicate with parent
 *    - Component doesn't manage its own visibility - parent controls it
 *
 * COMPONENT HIERARCHY:
 * ====================
 * App.js
 *   └─ OnLoadOverlay (this component)
 *       └─ Dialog (MUI)
 *           └─ DialogContent (MUI)
 *               ├─ Close button
 *               ├─ Title & description
 *               └─ Quiz Mode / Explore Mode buttons
 */

import React from 'react';
// React: Core library for building UI components
// This import is required for JSX to work (JSX compiles to React.createElement())

import {
  Dialog,          // Modal dialog component (popup overlay)
  DialogContent,   // Container for dialog body content
  Button,          // Clickable button component
  Box,             // Flexible container for layout (like <div> but with sx prop)
  Typography,      // Text component with built-in typography variants
} from '@mui/material';
// Named imports: Import specific exports from a module
// @mui/material: Material-UI component library

import { ThemeProvider } from '@mui/material/styles';
// ThemeProvider: React context provider that applies theme to all child components
// Theme defines colors, fonts, spacing, etc. consistently across the app

import muiTheme from '../theme/muiTheme';
// Import our custom MUI theme configuration
// Default import: imports the default export from the module

/**
 * OnLoadOverlay Component
 *
 * This is a "controlled component" - it doesn't manage its own state.
 * The parent (App.js) controls when it's shown via showOnLoad state.
 *
 * PROPS:
 * @param {function} onStartQuiz - Callback when user clicks "Quiz Mode"
 * @param {function} onExplore - Callback when user clicks "Explore Mode"
 * @param {function} onClose - Callback when user clicks close button (X)
 *
 * RETURN VALUE:
 * Returns JSX (React elements) describing the UI structure
 */
const OnLoadOverlay = ({ onStartQuiz, onExplore, onClose }) => {
  /**
   * DESTRUCTURING PARAMETERS:
   * Instead of: function OnLoadOverlay(props) { const onStartQuiz = props.onStartQuiz; }
   * We use: function OnLoadOverlay({ onStartQuiz, onExplore, onClose })
   *
   * Benefits:
   * - More concise and readable
   * - Clearly shows what props the component expects
   * - Automatically extracts values from props object
   */

  return (
    /**
     * THEMING WITH THEMEPROVIDER:
     * Wraps components to provide theme via React Context
     * All MUI components inside can access theme values
     * Example: theme.palette.primary.main, theme.spacing(2)
     */
    <ThemeProvider theme={muiTheme}>
      {/**
       * DIALOG COMPONENT:
       * Creates a modal dialog (popup) that overlays the page
       *
       * Key features:
       * - Blocks interaction with background (backdrop)
       * - Handles escape key to close
       * - Accessible (ARIA attributes for screen readers)
       * - Animated entrance/exit
       *
       * Props explained:
       * - open={true}: Dialog is always visible when this component renders
       *                Parent controls visibility by mounting/unmounting this component
       * - maxWidth="sm": Maximum width = small (600px in MUI's default theme)
       * - fullWidth: Stretch to maxWidth instead of content width
       * - onClose: Callback when user tries to close (escape key, backdrop click)
       */}
      <Dialog
        open={true}
        maxWidth="sm"
        fullWidth
        onClose={onClose}
      >
        <DialogContent>
          {/**
           * CONDITIONAL RENDERING WITH &&:
           * Logical AND operator for conditional rendering
           * Pattern: {condition && <Component />}
           *
           * How it works:
           * - If condition is falsy (null, undefined, false), nothing renders
           * - If condition is truthy, the component after && renders
           *
           * Why check onClose?
           * - If parent doesn't provide onClose prop, don't show close button
           * - Makes component more flexible (optional close button)
           */}
          {onClose && (
            <Box sx={{
              display: 'flex',           // Flexbox layout
              justifyContent: 'flex-end', // Align items to the right
              mb: -2                      // Negative margin bottom (-16px) to offset DialogContent padding
            }}>
              {/**
               * MUI's SX PROP:
               * CSS-in-JS styling system
               * Advantages over traditional CSS:
               * - Scoped to component (no global style conflicts)
               * - Access theme values directly
               * - TypeScript support for autocomplete
               * - Responsive breakpoints: sx={{ width: { xs: '100%', md: '50%' } }}
               *
               * Shorthand properties:
               * - mb: marginBottom
               * - mt: marginTop
               * - p: padding
               * - py: paddingY (top + bottom)
               * - px: paddingX (left + right)
               * Numbers are multiplied by theme spacing (default 8px)
               * Example: mb: 2 → marginBottom: 16px
               */}
              <Button
                variant="outlined"  // MUI button variant: outlined (border, no fill)
                onClick={onClose}   // Event handler: calls onClose when clicked
                size="small"        // MUI size variant (small, medium, large)
                sx={{
                  minWidth: 'auto',      // Override default min-width
                  padding: '4px 8px'     // Custom padding (top/bottom right/left)
                }}
              >
                ✕
                {/**
                 * UNICODE CHARACTER:
                 * ✕ (U+2715) is the "multiplication x" symbol
                 * Common close button icon
                 * Alternative: Use MUI's CloseIcon component
                 */}
              </Button>
            </Box>
          )}

          {/**
           * MAIN CONTENT BOX:
           * Centers content vertically and horizontally using flexbox
           */}
          <Box sx={{
            display: 'flex',          // Enable flexbox layout
            flexDirection: 'column',  // Stack children vertically
            alignItems: 'center',     // Center children horizontally
            gap: 3,                   // Gap between children (24px = 3 * 8px)
            py: 4                     // Padding Y-axis (32px = 4 * 8px)
          }}>
            {/**
             * TYPOGRAPHY COMPONENT:
             * MUI's text component with semantic HTML and styling
             *
             * Props:
             * - variant="h4": Predefined style (uses theme.typography.h4)
             * - component="h1": HTML element to render
             *
             * Why different variant and component?
             * - variant: Controls visual style (size, weight, spacing)
             * - component: Controls semantic HTML (for SEO and accessibility)
             * - Example: Want h4 styling but h1 semantics for page title
             */}
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600, textAlign: 'center' }}>
              Geography & Public Domain
            </Typography>

            <Typography
              variant="body1"           // Body text variant
              color="textSecondary"     // MUI theme color (theme.palette.text.secondary)
              sx={{
                textAlign: 'center',    // Center text
                mb: 2                   // Margin bottom
              }}
            >
              Explore public domain images from around the world
            </Typography>

            {/**
             * BUTTON CONTAINER:
             * Stacks buttons vertically with consistent width
             */}
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',  // Stack vertically
              gap: 2,                   // Space between buttons
              width: '100%',            // Full width of parent
              maxWidth: '300px'         // But cap at 300px
            }}>
              {/**
               * QUIZ MODE BUTTON:
               * Primary action - uses "contained" variant (filled background)
               *
               * Interview note: Why onStartQuiz instead of direct state update?
               * - Separation of concerns: This component doesn't know about app state
               * - Component is reusable: Works with any onStartQuiz implementation
               * - Parent controls the behavior (principle of single responsibility)
               */}
              <Button
                variant="contained"  // Filled button (primary action)
                size="large"         // Large size for better touch targets
                onClick={onStartQuiz}
                sx={{ py: 2 }}       // Extra vertical padding
              >
                Quiz Mode
              </Button>

              {/**
               * EXPLORE MODE BUTTON:
               * Secondary action - uses "outlined" variant (border only)
               * Visual hierarchy: contained > outlined > text
               */}
              <Button
                variant="outlined"   // Outlined button (secondary action)
                size="large"
                onClick={onExplore}
                sx={{ py: 2 }}
              >
                Explore Mode
              </Button>
            </Box>

            {/**
             * HELPER TEXT:
             * Small text explaining that modes can be changed later
             * variant="caption": Smallest text variant in MUI
             */}
            <Typography
              variant="caption"       // Small text variant
              color="textSecondary"   // Muted color
              sx={{
                textAlign: 'center',  // Center text
                mt: 2                 // Margin top for spacing
              }}
            >
              You can toggle between modes and adjust settings anytime
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    </ThemeProvider>
  );
};

/**
 * EXPORT:
 * Makes this component available to other files
 * Usage in other files: import OnLoadOverlay from './components/OnLoadOverlay'
 *
 * Why default export?
 * - File has one main thing to export (the component)
 * - Importing file can name it whatever they want
 * - Alternative: Named export for multiple exports per file
 */
export default OnLoadOverlay;

/**
 * COMPONENT SUMMARY:
 * ==================
 *
 * This component demonstrates:
 * 1. Functional React components
 * 2. Props and destructuring
 * 3. MUI component library usage
 * 4. JSX syntax and composition
 * 5. CSS-in-JS with sx prop
 * 6. Event handling with callbacks
 * 7. Conditional rendering
 * 8. Theme usage via ThemeProvider
 *
 * Interview talking points:
 * - Why functional components? (Simpler than class components, hooks support)
 * - Why MUI? (Consistent design system, accessibility, responsive by default)
 * - Why props instead of state? (Controlled component pattern, single source of truth)
 * - Why sx prop? (Scoped styling, theme integration, no CSS file conflicts)
 */
