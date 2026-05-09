/**
 * ArtworkInfoBar Component
 *
 * This component displays detailed information about a country in a modal dialog (popup).
 * It shows artwork images from various collections.
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
  Typography,      // Styled text component
  Select,          // Dropdown select component
  MenuItem,        // Menu item for select
  FormControl,     // Form control wrapper
  InputLabel,      // Label for form inputs
  Checkbox,        // Checkbox component
  ListItemText     // Text for list items
} from '@mui/material';

import { ThemeProvider } from '@mui/material/styles';
// ThemeProvider: Wraps components to apply a consistent theme (colors, fonts, etc.)

import { fetchImages } from '../services/api';
// API functions to fetch data from the backend server
// fetchImages: Gets artwork images for a country

// Import child components
import QuizImageDisplay from './QuizImageDisplay.mui';

import muiTheme from '../theme/muiTheme';
// muiTheme: Custom theme configuration for MUI components

import { useContentSettings } from '../contexts/ContentSettingsContext';
// Context hook for accessing content settings without prop drilling

/**
 * ArtworkInfoBar Component
 *
 * PROPS (Component Inputs):
 * Props are passed from parent components to configure this component's behavior
 */
const ArtworkInfoBar = ({
  countryISO,      // Country code (ISO3 format: "USA", "DEU", etc.)
  countryName,     // Human-readable country name
  wikipediaUrl,    // Wikipedia URL for the country
  colors,          // Color scheme object (not currently used in this component)
  mode,            // Current app mode: 'quiz' or 'explore'
  answerSubmitted, // Whether user submitted an answer in quiz mode
  isCorrectAnswer, // Whether the submitted answer was correct
  onClose,         // Function to call when closing the dialog
  onNext,          // Function to call when clicking "Next" button
}) => {
  // Get content settings from context
  const {
    showNudity,
    selectedCollections,
    setSelectedCollections
  } = useContentSettings();
  /**
   * STATE VARIABLES
   *
   * useState creates state variables that trigger re-renders when updated.
   * Syntax: const [value, setValue] = useState(initialValue)
   */

  // imagesByCollection: Object storing images organized by collection type
  // Example: { "albert_kahn": [...images], "children_artwork": [...images] }
  const [imagesByCollection, setImagesByCollection] = useState({});

  // currentImageIndex: Object tracking which image is displayed for each collection
  // Example: { "albert_kahn": 2, "children_artwork": 0 } means showing 3rd and 1st images
  // eslint-disable-next-line no-unused-vars
  const [currentImageIndex, setCurrentImageIndex] = useState({});

  // imagesLoading: true while the image fetch is in flight
  const [imagesLoading, setImagesLoading] = useState(false);

  // seeAllVisible: delayed — appears 3s after images finish loading
  const [seeAllVisible, setSeeAllVisible] = useState(false);

  // showAll: Whether to show all images or just one featured image
  const [showAll, setShowAll] = useState(false);

  // featuredImage: The randomly selected image to show in single-item mode
  const [featuredImage, setFeaturedImage] = useState(null);

  /**
   * REFS (Persistent References)
   *
   * useRef creates a mutable reference that persists across re-renders
   * Unlike state, updating a ref does NOT trigger a re-render
   * Refs are useful for storing DOM elements or mutable values
   */

  // imageRefs: Stores references to image DOM elements for cleanup
  const imageRefs = useRef({});

  /**
   * OVERLAY VISIBILITY EFFECT
   *
   * Hides overlay when no country is selected.
   * Overlay visibility is controlled by the image fetch effect below.
   */

  /**
   * SHUFFLE HELPER FUNCTION
   *
   * Fisher-Yates shuffle algorithm to randomize array order
   */
  const shuffleArray = (array) => {
    const shuffled = [...array]; // Create a copy to avoid mutating original
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Swap elements
    }
    return shuffled;
  };

  /**
   * FETCH IMAGES EFFECT
   *
   * This effect fetches artwork images when the country changes.
   * Optimized to fetch only one random image in quiz mode initially,
   * then fetch all images when user clicks "Show all images".
   *
   * PROMISES AND ASYNC OPERATIONS:
   * - fetchImages() returns a Promise (represents a future value)
   * - .then(callback) runs when the Promise succeeds
   * - .catch(callback) runs if an error occurs
   * - .finally(callback) runs regardless of success/failure
   */
  useEffect(() => {
    // StrictMode runs effects twice in dev — this flag ensures only the last run commits state
    let cancelled = false;

    // Reset images if no country selected
    if (!countryISO) {
      setImagesByCollection({});
      setImagesLoading(false);
      setShowAll(false);
      setFeaturedImage(null);
      return;
    }

    console.log('[InfoBar] 🔄 Country changed to', countryISO);
    setShowAll(false);
    setFeaturedImage(null);
    setImagesByCollection({});
    setImagesLoading(true);

    fetchImages(countryISO, showNudity)
      .then(data => {
        if (cancelled) {
          console.log('[InfoBar] 🚫 Stale response discarded for', countryISO);
          return;
        }

        const filtered = {};
        Object.entries(data || {}).forEach(([collection, images]) => {
          if (images && images.length > 0) {
            filtered[collection] = shuffleArray(images);
          }
        });

        const totalFiltered = Object.values(filtered).reduce((n, arr) => n + arr.length, 0);
        console.log('[InfoBar] ✅', Object.keys(filtered).join(', ') || 'no images', '—', totalFiltered, 'total');

        const allImages = [];
        Object.entries(filtered).forEach(([collection, images]) => {
          images.forEach(image => allImages.push({ collection, image }));
        });
        const featured = allImages.length > 0
          ? allImages[Math.floor(Math.random() * allImages.length)]
          : null;
        console.log('[InfoBar] 🎲 Featured:', featured?.collection, featured?.image?.title || featured?.image?.filepath);

        setImagesByCollection(filtered);
        setFeaturedImage(featured);

        const initialIndex = {};
        Object.keys(filtered).forEach(c => { initialIndex[c] = 0; });
        setCurrentImageIndex(initialIndex);
        setImagesLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('[InfoBar] ❌ Fetch failed:', err);
        setImagesByCollection({});
        setImagesLoading(false);
      });

    return () => { cancelled = true; };
  }, [countryISO, mode, showNudity]); // Re-run when country, mode, or nudity setting changes

  /**
   * IMAGE NAVIGATION FUNCTIONS
   *
   * These functions handle clicking prev/next arrows in the image gallery.
   * They use the modulo operator (%) to cycle through images in a loop.
   */

  // Navigate to next image in a collection
  // eslint-disable-next-line no-unused-vars
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
  // eslint-disable-next-line no-unused-vars
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
  // Delay "See all" button by 3s after images finish loading
  useEffect(() => {
    if (imagesLoading) {
      setSeeAllVisible(false);
      return;
    }
    const timer = setTimeout(() => setSeeAllVisible(true), 500);
    return () => clearTimeout(timer);
  }, [imagesLoading]);

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

  // Extract collection names and filter by selected collections
  // eslint-disable-next-line no-unused-vars
  const collections = Object.keys(imagesByCollection).filter(collection =>
    selectedCollections.includes(collection)
  );

  // Calculate total number of images across all collections
  const totalImages = Object.values(imagesByCollection).reduce((total, images) => {
    return total + (images?.length || 0);
  }, 0);

  console.log('[InfoBar] 🖼 render — country:', countryISO, '| showAll:', showAll, '| featuredImage:', featuredImage?.collection ?? 'none', '| totalImages:', totalImages);

  /**
   * CountryTitle Helper Component
   *
   * Renders the country name with appropriate prefix and link based on quiz state.
   * Extracted to improve readability and avoid deeply nested ternaries.
   */
  const CountryTitle = () => {
    // Create the country display (with or without link)
    const countryDisplay = wikipediaUrl ? (
      <a
        href={wikipediaUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: '#1976d2', textDecoration: 'underline' }}
      >
        {countryName || countryISO}
      </a>
    ) : (
      countryName || countryISO
    );

    // If not in quiz mode or answer not submitted, show plain country name
    if (mode !== 'quiz' || !answerSubmitted) {
      return countryDisplay;
    }

    // In quiz mode with submitted answer, add prefix
    const prefix = isCorrectAnswer ? 'Correct: ' : 'Incorrect: ';
    return <>{prefix}{countryDisplay}</>;
  };

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
        open={!!countryISO}
        onClose={handleBackdropClick}
        maxWidth="sm"
        fullWidth
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: 'rgba(26,22,18,0.45)',
              backdropFilter: 'blur(6px)',
            }
          }
        }}
        sx={{
          '& .MuiBackdrop-root': {
            top: '5px',
            left: '5px',
            right: '5px',
            bottom: '5px',
          },
          '& .MuiDialog-paper': {
            // Reserve full height while loading or when images are present.
            // Only collapse after we've confirmed there are none.
            minHeight: !imagesLoading && totalImages === 0 ? '300px' : '80vh',
            maxHeight: !imagesLoading && totalImages === 0 ? '300px' : '80vh',
            transition: 'min-height 0.4s ease, max-height 0.4s ease',

            // Custom scrollbar styling - wider and darker
            '&::-webkit-scrollbar': {
              width: '20px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: '#d0d0d0',
              borderRadius: '10px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#444',
              borderRadius: '10px',
              border: '3px solid #d0d0d0',
              '&:hover': {
                backgroundColor: '#222',
              },
            },
          }
        }}
      >
        {/*
          DIALOG HEADER

          JSX Comments: Use {curly braces} with standard comments inside
        */}
        <DialogTitle sx={{ p: 0 }}>
          <Box sx={{
            px: { xs: 2, sm: 3.5 },
            pt: { xs: 2.5, sm: 3 },
            pb: { xs: 2, sm: 2.5 },
            background: 'var(--paper-2, #e8dfc8)',
            borderBottom: '1px solid var(--rule, #cfc4a8)',
            position: 'relative',
          }}>
            {/* Status badge — quiz mode only */}
            {mode === 'quiz' && answerSubmitted && (
              <Box sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                mb: 1.5,
                px: 1.25,
                py: 0.75,
                borderRadius: '999px',
                background: isCorrectAnswer ? '#e8efe2' : '#f3dfd6',
                color: isCorrectAnswer ? '#2d4422' : '#7a2c14',
                border: `1px solid ${isCorrectAnswer ? 'rgba(45,68,34,.25)' : 'rgba(122,44,20,.2)'}`,
                fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                fontSize: '10px',
                fontWeight: 500,
                letterSpacing: '.22em',
                textTransform: 'uppercase',
              }}>
                {/* Check or X icon */}
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  {isCorrectAnswer
                    ? <path d="M2,5 L4,7 L8,3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    : <path d="M2,2 L8,8 M8,2 L2,8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>}
                </svg>
                {isCorrectAnswer ? 'Correct' : 'Not quite'}
              </Box>
            )}

            {/* Country name — large serif italic */}
            <Typography component="h1" sx={{
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              fontSize: { xs: '2.25rem', sm: '3rem' },
              fontWeight: 500,
              lineHeight: 1,
              color: 'var(--ink, #1a1612)',
              letterSpacing: '-0.01em',
              mb: 0,
            }}>
              {mode === 'quiz' && answerSubmitted && !isCorrectAnswer
                ? <>That was <em style={{ color: 'var(--accent, #b34727)', fontWeight: 400 }}>{countryName || countryISO}</em></>
                : <em>{countryName || countryISO}</em>}
            </Typography>

            {/* Close / Next buttons — top-right corner */}
            <Box sx={{ position: 'absolute', top: 14, right: 14, display: 'flex', gap: 1 }}>
              {mode === 'quiz' && answerSubmitted && isCorrectAnswer && onNext ? (
                <Button variant="contained" onClick={onNext} size="small">
                  Next →
                </Button>
              ) : onClose ? (
                <Box
                  component="button"
                  onClick={onClose}
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    border: '1px solid var(--rule, #cfc4a8)',
                    background: 'transparent',
                    color: 'var(--ink-2, #3a322a)',
                    display: 'grid',
                    placeItems: 'center',
                    cursor: 'pointer',
                    fontSize: '20px',
                    lineHeight: 1,
                    transition: 'all .15s',
                    '&:hover': {
                      background: 'var(--ink, #1a1612)',
                      color: 'var(--paper, #f1ead9)',
                      borderColor: 'var(--ink, #1a1612)',
                    },
                  }}
                >
                  {mode === 'quiz' && answerSubmitted && !isCorrectAnswer ? '↩' : '×'}
                </Box>
              ) : null}
            </Box>
          </Box>
        </DialogTitle>

        {/* DIALOG CONTENT */}
        <DialogContent sx={{ pt: 1, pb: 1 }}>
          {/* Collection Filter - Only visible in test mode */}
          {process.env.REACT_APP_TEST && setSelectedCollections && (
            <Box sx={{ mb: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Image Collections</InputLabel>
                <Select
                  multiple
                  value={selectedCollections}
                  onChange={(e) => setSelectedCollections(e.target.value)}
                  renderValue={(selected) => selected.join(', ')}
                  label="Image Collections"
                >
                  {['Albert Kahn', 'Children in Art', 'Public Domain Review', 'Met Museum'].map((name) => (
                    <MenuItem key={name} value={name}>
                      <Checkbox checked={selectedCollections.includes(name)} />
                      <ListItemText primary={name} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          {/* Show content */}
          {(
            // Content display
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',  // Stack children vertically
              gap: 3                    // 24px gap between sections
            }}>
              {/*
                Unified image display for both quiz and explore modes:
                - Always show all images with map at top
                - Only difference: action buttons (Try Again/Next vs Close)
              */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                }}
              >
                {/* Map always at the top */}
                <QuizImageDisplay
                  imagesByCollection={{}}
                  countryName={countryName}
                  countryISO={countryISO}
                  onShowAll={null}
                  showMap={true}
                  hideNoImagesMessage={true}
                  hideMainTitle={true}
                />

                {/* Skeleton + image section share the same space.
                    Skeleton is position:absolute so it never affects layout height.
                    Content keeps its natural height; skeleton overlays it while fading. */}
                <Box sx={{ position: 'relative', minHeight: imagesLoading ? 320 : 0 }}>

                  {/* Skeleton — absolutely overlaid, fades out on load */}
                  <Box sx={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 2,
                    bgcolor: '#f1ead9',
                    opacity: imagesLoading ? 1 : 0,
                    transition: 'opacity 0.35s ease-in-out',
                    pointerEvents: 'none',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.45 },
                    },
                    animation: imagesLoading ? 'pulse 1.6s ease-in-out infinite' : 'none',
                  }} />

                  {/* Image section — fades in when loaded */}
                  <Box sx={{
                    opacity: imagesLoading ? 0 : 1,
                    transition: 'opacity 0.35s ease-in-out',
                  }}>
                  {showAll ? (
                    /* All images — ordered by priority */
                    (() => {
                      const priorityOrder = ['Children in Art', 'Albert Kahn', 'Met Museum', 'Public Domain Review'];
                      const sortedEntries = Object.entries(imagesByCollection).sort(([a], [b]) => {
                        const ia = priorityOrder.indexOf(a);
                        const ib = priorityOrder.indexOf(b);
                        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
                      });
                      return sortedEntries.flatMap(([collection, images]) =>
                        images?.map((image, index) => (
                          <QuizImageDisplay
                            key={`${collection}-${index}`}
                            imagesByCollection={{ [collection]: [image] }}
                            countryName={countryName}
                            countryISO={countryISO}
                            onShowAll={null}
                            showMap={false}
                            hideNoImagesMessage={true}
                            hideMainTitle={true}
                          />
                        )) || []
                      );
                    })()
                  ) : (
                    /* Single featured image */
                    featuredImage && (
                      <QuizImageDisplay
                        key={`featured-${featuredImage.collection}`}
                        imagesByCollection={{ [featuredImage.collection]: [featuredImage.image] }}
                        countryName={countryName}
                        countryISO={countryISO}
                        onShowAll={null}
                        showMap={false}
                        hideNoImagesMessage={true}
                        hideMainTitle={true}
                      />
                    )
                  )}
                  </Box>{/* end fade wrapper */}
                </Box>{/* end relative container */}

                {/* See all / Show less button — appears 3s after images load */}
                {(seeAllVisible || showAll) && totalImages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', pb: 1 }}>
                    <Box
                      component="button"
                      onClick={() => setShowAll(prev => !prev)}
                      sx={{
                        background: 'none',
                        border: '1px solid var(--rule, #cfc4a8)',
                        borderRadius: '999px',
                        px: 2.5,
                        py: 0.75,
                        fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                        fontSize: '10px',
                        fontWeight: 500,
                        letterSpacing: '.18em',
                        textTransform: 'uppercase',
                        color: 'var(--ink-3, #6c6356)',
                        cursor: 'pointer',
                        transition: 'all .15s',
                        '&:hover': {
                          borderColor: 'var(--accent, #b34727)',
                          color: 'var(--accent, #b34727)',
                        },
                      }}
                    >
                      {showAll ? 'Show less' : `See all (${totalImages})`}
                    </Box>
                  </Box>
                )}
              </Box>
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
