/**
 * ArtworkInfoBar Component
 *
 * This component displays detailed information about a country in a modal dialog (popup).
 * It shows images, external links, and child mortality statistics.
 *
 * REACT COMPONENT BASICS:
 * - Components are reusable UI pieces that can manage their own state
 * - This component uses React Hooks to manage data and side effects
 */

// Import React Hooks
import { useState, useEffect, useRef } from 'react';
// useState: Manages component state (data that can change)
// useEffect: Runs side effects (data fetching, subscriptions, etc.)
// useRef: Creates persistent references that don't trigger re-renders

// Import Material-UI (MUI) components for the dialog interface
import {
  Dialog,          // Modal dialog (popup window)
  DialogTitle,     // Dialog header
  DialogContent,   // Dialog body content
  Button,          // Clickable button
  Box,             // Flexible container for layout
  CircularProgress,// Loading spinner
  Typography       // Styled text component
} from '@mui/material';

import { ThemeProvider } from '@mui/material/styles';
// ThemeProvider: Wraps components to apply a consistent theme (colors, fonts, etc.)

import { fetchImages, fetchChildMortality, fetchExternalLinks } from '../services/api';
// API functions to fetch data from the backend server
// fetchImages: Gets artwork images for a country
// fetchChildMortality: Gets child mortality statistics
// fetchExternalLinks: Gets external resource URLs

// Import child components
import ImageGallery from './ImageGallery.mui';
import ChildMortalitySection from './ChildMortalitySection.mui';
import ExternalLinks from './ExternalLinks.mui';

import muiTheme from '../theme/muiTheme';
// muiTheme: Custom theme configuration for MUI components

/**
 * ArtworkInfoBar Component
 *
 * PROPS (Component Inputs):
 * Props are passed from parent components to configure this component's behavior
 */
const ArtworkInfoBar = ({
  countryISO,      // Country code (ISO3 format: "USA", "DEU", etc.)
  countryName,     // Human-readable country name
  colors,          // Color scheme object (not currently used in this component)
  mode,            // Current app mode: 'quiz' or 'explore'
  answerSubmitted, // Whether user submitted an answer in quiz mode
  isCorrectAnswer, // Whether the submitted answer was correct
  onClose,         // Function to call when closing the dialog
  onNext           // Function to call when clicking "Next" button
}) => {
  /**
   * STATE VARIABLES
   *
   * useState creates state variables that trigger re-renders when updated.
   * Syntax: const [value, setValue] = useState(initialValue)
   */

  // imagesByCollection: Object storing images organized by collection type
  // Example: { "albert_kahn": [...images], "children_artwork": [...images] }
  const [imagesByCollection, setImagesByCollection] = useState({});

  // loading: Boolean indicating if data is currently being fetched
  const [loading, setLoading] = useState(false);

  // currentImageIndex: Object tracking which image is displayed for each collection
  // Example: { "albert_kahn": 2, "children_artwork": 0 } means showing 3rd and 1st images
  const [currentImageIndex, setCurrentImageIndex] = useState({});

  // mortalityData: Child mortality statistics for the country (null if not loaded)
  const [mortalityData, setMortalityData] = useState(null);

  // externalLinks: External resource URLs for the country (null if not loaded)
  const [externalLinks, setExternalLinks] = useState(null);

  // isVisible: Controls fade-in animation (starts false, becomes true for transition)
  const [isVisible, setIsVisible] = useState(false);

  /**
   * REFS (Persistent References)
   *
   * useRef creates a mutable reference that persists across re-renders
   * Unlike state, updating a ref does NOT trigger a re-render
   * Refs are useful for storing DOM elements or mutable values
   */

  // imageRefs: Stores references to image DOM elements for cleanup
  const imageRefs = useRef({});

  // containerRef: Reference to the container DOM element (currently unused)
  const containerRef = useRef(null);

  /**
   * FADE-IN ANIMATION EFFECT
   *
   * This effect triggers a smooth fade-in animation when a new country is loaded.
   * It uses requestAnimationFrame to ensure the initial opacity:0 is painted before fading in.
   */
  useEffect(() => {
    // Guard clause: only run if we have a country
    if (!countryISO) return;

    // Start with dialog invisible
    setIsVisible(false);

    // requestAnimationFrame: Waits for the next browser paint cycle
    // This ensures the opacity:0 is rendered before we set opacity:1
    // Without this, the browser might batch both updates and skip the transition
    requestAnimationFrame(() => {
      setIsVisible(true);  // Trigger fade-in via CSS transition
    });
  }, [countryISO]); // Re-run when country changes

  /**
   * FETCH IMAGES EFFECT
   *
   * This effect fetches artwork images when the country changes.
   *
   * PROMISES AND ASYNC OPERATIONS:
   * - fetchImages() returns a Promise (represents a future value)
   * - .then(callback) runs when the Promise succeeds
   * - .catch(callback) runs if an error occurs
   * - .finally(callback) runs regardless of success/failure
   */
  useEffect(() => {
    // Reset images if no country selected
    if (!countryISO) {
      setImagesByCollection({});
      return;
    }

    // Show loading spinner
    setLoading(true);

    // Fetch images from the backend
    fetchImages(countryISO)
      .then(data => {
        // Filter out empty collections
        const filtered = {};

        // Object.entries(obj): Converts object to array of [key, value] pairs
        // Example: {a: 1, b: 2} becomes [["a", 1], ["b", 2]]
        Object.entries(data || {}).forEach(([collection, images]) => {
          // Destructuring in parameters: [collection, images] extracts key and value

          // Only keep collections that have images
          if (images && images.length > 0) {
            filtered[collection] = images;
          }
        });

        setImagesByCollection(filtered);

        // Initialize image index to 0 for each collection
        const initialIndex = {};

        // Object.keys(obj): Returns array of object's keys
        // Example: {a: 1, b: 2} becomes ["a", "b"]
        Object.keys(filtered).forEach(c => {
          initialIndex[c] = 0;  // Start at first image (index 0)
        });
        setCurrentImageIndex(initialIndex);
      })
      .catch(() => {
        // If fetching fails, reset to empty
        setImagesByCollection({});
      })
      .finally(() => {
        // Always hide loading spinner when done (success or failure)
        setLoading(false);
      });
  }, [countryISO]); // Re-run when country changes

  /**
   * FETCH CHILD MORTALITY EFFECT
   *
   * Fetches child mortality statistics for the selected country.
   */
  useEffect(() => {
    if (!countryISO) {
      setMortalityData(null);
      return;
    }

    fetchChildMortality(countryISO)
      // Shorthand: .then(setMortalityData) is equivalent to .then(data => setMortalityData(data))
      .then(setMortalityData)
      .catch(() => setMortalityData(null));
  }, [countryISO]);

  /**
   * FETCH EXTERNAL LINKS EFFECT
   *
   * Fetches external resource URLs for the selected country.
   */
  useEffect(() => {
    if (!countryISO) {
      setExternalLinks(null);
      return;
    }

    fetchExternalLinks(countryISO)
      .then(setExternalLinks)
      .catch(() => setExternalLinks(null));
  }, [countryISO]);

  /**
   * IMAGE NAVIGATION FUNCTIONS
   *
   * These functions handle clicking prev/next arrows in the image gallery.
   * They use the modulo operator (%) to cycle through images in a loop.
   */

  // Navigate to next image in a collection
  const nextImage = (collection) => {
    const images = imagesByCollection[collection];
    if (!images) return;

    // Update index using functional update form: setState(prevState => newState)
    setCurrentImageIndex(prev => ({
      ...prev,  // Spread operator: copy all existing collection indices
      [collection]: (prev[collection] + 1) % images.length
      // Computed property name: [collection] uses the variable value as the key
      // Modulo operator (%): wraps around to 0 when reaching the end
      // Example: If there are 5 images, (4 + 1) % 5 = 0 (loops back to start)
    }));
  };

  // Navigate to previous image in a collection
  const prevImage = (collection) => {
    const images = imagesByCollection[collection];
    if (!images) return;

    setCurrentImageIndex(prev => ({
      ...prev,
      [collection]: (prev[collection] - 1 + images.length) % images.length
      // Adding images.length handles negative numbers correctly
      // Example: If at index 0, (-1 + 5) % 5 = 4 (wraps to last image)
    }));
  };

  /**
   * CLEANUP EFFECT
   *
   * This effect cleans up image references when component unmounts or country changes.
   * Prevents memory leaks by clearing image sources.
   */
  useEffect(() => {
    // Return a cleanup function that runs when:
    // 1. Component unmounts
    // 2. Before the effect runs again (when countryISO changes)
    return () => {
      // Object.values(obj): Returns array of object's values
      // Example: {a: 1, b: 2} becomes [1, 2]
      Object.values(imageRefs.current).forEach(img => {
        if (img) {
          // Clear image source to free memory
          img.src = '';
          img.removeAttribute('src');
        }
      });
      // Reset refs object
      imageRefs.current = {};
    };
  }, [countryISO]);

  /**
   * EARLY RETURN
   *
   * If no country is selected, don't render anything
   * This is a common React pattern called "early return" or "guard clause"
   */
  if (!countryISO) return null;

  // Extract collection names (e.g., ["albert_kahn", "children_artwork"])
  const collections = Object.keys(imagesByCollection);

  /**
   * EVENT HANDLERS
   */

  // Handle clicks on the backdrop (area outside the dialog)
  const handleBackdropClick = (event, reason) => {
    // reason: Why the dialog is closing ("backdropClick", "escapeKeyDown", etc.)
    if (reason === 'backdropClick' && onClose) {
      onClose();
    }
  };

  /**
   * JSX RENDERING
   *
   * JSX: JavaScript XML - lets us write HTML-like syntax in JavaScript
   * React converts JSX to JavaScript function calls
   */
  return (
    <ThemeProvider theme={muiTheme}>
      {/* ThemeProvider applies our custom theme to all MUI components inside */}

      {/*
        Dialog Component

        Props explained:
        - open: Dialog is always open when this component renders
        - maxWidth: Maximum width (sm = small = 600px in MUI)
        - fullWidth: Stretch to maxWidth
        - slotProps: New MUI v5+ API for customizing nested component props (replaces BackdropProps)
        - sx: MUI's styling system (CSS-in-JS) - lets you write CSS in JavaScript
      */}
      <Dialog
        open={true}
        onClose={handleBackdropClick}
        maxWidth="sm"
        fullWidth
        slotProps={{
          backdrop: {
            sx: {
              // Semi-transparent white backdrop with blur effect
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              backdropFilter: 'blur(3px)',  // CSS backdrop-filter: blurs content behind
            }
          }
        }}
        sx={{
          '& .MuiBackdrop-root': {
            // Add 5px margin around backdrop
            top: '5px',
            left: '5px',
            right: '5px',
            bottom: '5px',
          },
          '& .MuiDialog-paper': {
            // Fade-in animation controlled by isVisible state
            opacity: isVisible ? 1 : 0,  // Ternary operator: condition ? ifTrue : ifFalse
            transition: 'opacity 5s cubic-bezier(0.4, 0.0, 0.2, 1)',
            // CSS transition: Smoothly animates opacity change over 5 seconds
            // cubic-bezier: Custom easing function for smooth acceleration/deceleration

            pointerEvents: isVisible ? 'auto' : 'none',
            // Disable mouse interactions while invisible
          }
        }}
      >
        {/*
          DIALOG HEADER

          JSX Comments: Use {curly braces} with standard comments inside
        */}
        <DialogTitle
          sx={{
            display: 'flex',           // Flexbox layout
            justifyContent: 'space-between',  // Push items to edges
            alignItems: 'center',      // Vertically center items
            gap: 2,                    // 16px gap (2 * 8px theme spacing)
          }}
        >
          {/* Country name title */}
          <Typography
            variant="h6"     // MUI variant for heading level 6
            component="div"  // Render as <div> instead of default <h6>
            sx={{
              fontWeight: 600,   // Semi-bold font
              flex: 1,           // Take up all available space
              textAlign: 'center'
            }}
          >
            {/*
              NESTED TERNARY OPERATORS

              This creates dynamic text based on quiz mode and answer correctness.
              Format: condition1 ? value1 : (condition2 ? value2 : value3)
            */}
            {mode === 'quiz' && answerSubmitted
              ? isCorrectAnswer
                ? `Correct: ${countryName || countryISO}`    // Template literal: embeds variables in strings
                : `Incorrect: ${countryName || countryISO}`
              : countryName || countryISO}
            {/* Logical OR (||): Returns first truthy value (fallback pattern) */}
          </Typography>

          {/* Button container */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            {/*
              CONDITIONAL RENDERING

              Ternary operator chains to show different buttons based on mode and state
            */}
            {mode === 'quiz' && answerSubmitted && isCorrectAnswer && onNext ? (
              // Show "Next" button when answer is correct
              <Button
                variant="contained"  // MUI variant: filled button
                onClick={onNext}
                size="small"
              >
                Next
              </Button>
            ) : onClose ? (
              // Show close/"Try Again" button otherwise
              <Button
                variant="outlined"   // MUI variant: outlined button
                onClick={onClose}
                size="small"
                sx={{
                  minWidth: 'auto',
                  padding: '4px 8px'
                }}
              >
                {/* Dynamic button text */}
                {mode === 'quiz' && answerSubmitted && !isCorrectAnswer ? 'Try Again' : '✕'}
              </Button>
            ) : null}
            {/* null: Renders nothing */}
          </Box>
        </DialogTitle>

        {/* DIALOG CONTENT */}
        <DialogContent>
          {/*
            CONDITIONAL RENDERING WITH &&

            Logical AND (&&): If left side is truthy, render right side
            If left side is falsy, render nothing
          */}
          {loading && (
            // Show loading spinner while fetching data
            <Box sx={{ p: 3, textAlign: 'center' }}>
              {/* p: 3 is shorthand for padding: 24px (3 * 8px) */}

              <CircularProgress size={40} />
              {/* Animated spinning circle */}

              <Typography variant="body2" sx={{ mt: 2 }}>
                {/* mt: 2 is shorthand for marginTop: 16px */}
                Loading images…
              </Typography>
            </Box>
          )}

          {!loading && (
            // Show content when loading is complete
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',  // Stack children vertically
              gap: 3                    // 24px gap between sections
            }}>
              {/*
                Nested conditional rendering
                Only show image galleries if we have collections
              */}
              {collections.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/*
                    ARRAY MAPPING

                    .map() transforms each array element into JSX
                    Creates one ImageGallery component per collection

                    ImageGallery Props:
                    - key: Required for list items in React (helps React identify which items changed)
                    - collection: Collection name (e.g., "albert_kahn")
                    - images: Array of images for this collection
                    - countryName: Name of the country
                    - currentIndex: Which image to display (defaults to 0 if undefined)
                    - onPrev/onNext: Arrow functions that wrap prevImage/nextImage with collection parameter
                      (Without the wrapper, it would call immediately instead of on click)
                    - imageRef: Ref callback function that receives the DOM element and stores it for cleanup
                  */}
                  {collections.map(collection => (
                    <ImageGallery
                      key={collection}
                      collection={collection}
                      images={imagesByCollection[collection]}
                      countryName={countryName}
                      currentIndex={currentImageIndex[collection] || 0}
                      onPrev={() => prevImage(collection)}
                      onNext={() => nextImage(collection)}
                      imageRef={el => (imageRefs.current[collection] = el)}
                    />
                  ))}
                </Box>
              )}

              {/* External resource links section */}
              <ExternalLinks
                externalLinks={externalLinks}
                countryName={countryName}
              />

              {/* Child mortality statistics section */}
              <ChildMortalitySection mortalityData={mortalityData} />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </ThemeProvider>
  );
};

/**
 * EXPORT
 *
 * export default: Makes this component available to import in other files
 * Other files can import with: import ArtworkInfoBar from './ArtworkInfoBar'
 */
export default ArtworkInfoBar;
