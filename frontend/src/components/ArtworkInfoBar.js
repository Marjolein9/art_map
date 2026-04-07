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

  // overlayVisible: Controls whether the overlay is shown
  const [overlayVisible, setOverlayVisible] = useState(false);

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
    // Reset images if no country selected
    if (!countryISO) {
      setImagesByCollection({});
      setOverlayVisible(false);
      return;
    }

    // Always fetch all images, filtering by nudity setting
    console.log('🔍 Fetching images for:', countryISO, 'showNudity:', showNudity);
    fetchImages(countryISO, showNudity)
      .then(data => {
        console.log('📦 Raw API response (already unwrapped by apiCall):', data);

        // Filter out empty collections and randomize order within each collection
        const filtered = {};

        // Object.entries(obj): Converts object to array of [key, value] pairs
        // Example: {a: 1, b: 2} becomes [["a", 1], ["b", 2]]
        // Note: apiCall already extracts data.images, so 'data' is the images object
        Object.entries(data || {}).forEach(([collection, images]) => {
          console.log(`📚 Processing collection "${collection}":`, images?.length, 'images');
          // Destructuring in parameters: [collection, images] extracts key and value

          // Only keep collections that have images, and shuffle them
          if (images && images.length > 0) {
            filtered[collection] = shuffleArray(images);
          }
        });

        console.log('✅ Filtered images:', filtered);
        console.log('📊 Collections with images:', Object.keys(filtered));
        setImagesByCollection(filtered);

        // Initialize image index to 0 for each collection
        const initialIndex = {};

        // Object.keys(obj): Returns array of object's keys
        // Example: {a: 1, b: 2} becomes ["a", "b"]
        Object.keys(filtered).forEach(c => {
          initialIndex[c] = 0;  // Start at first image (index 0)
        });
        setCurrentImageIndex(initialIndex);

        // Show overlay after images are loaded to prevent size changes
        setOverlayVisible(true);
      })
      .catch(() => {
        // If fetching fails, reset to empty and show overlay
        setImagesByCollection({});
        setOverlayVisible(true);
      });
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
        open={overlayVisible}
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
            // Fixed height to prevent layout shifts during loading
            // Smaller height when no images available
            minHeight: totalImages === 0 ? '300px' : '80vh',
            maxHeight: totalImages === 0 ? '300px' : '80vh',

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
        <DialogTitle
          sx={{
            display: 'flex',           // Flexbox layout
            justifyContent: 'space-between',  // Push items to edges
            alignItems: 'center',      // Vertically center items
            gap: 2,                    // 16px gap (2 * 8px theme spacing)
          }}
        >
          {/* Country name title and subtitle container */}
          <Box sx={{ flex: 1, textAlign: 'center' }}>
            {/* Country name title */}
            <Typography
              variant="h6"     // MUI variant for heading level 6
              component="div"  // Render as <div> instead of default <h6>
              sx={{
                fontWeight: 600,   // Semi-bold font
              }}
            >
              <CountryTitle />
            </Typography>


          </Box>

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
                {/* Show map once at the top */}
                <QuizImageDisplay
                  imagesByCollection={{}}
                  countryName={countryName}
                  countryISO={countryISO}
                  onShowAll={null}
                  showMap={true}
                  hideNoImagesMessage={true}
                  hideMainTitle={true}
                />

                {/* Show all images without maps - ordered by priority */}
                {(() => {
                  console.log('🎨 Rendering images. imagesByCollection state:', imagesByCollection);
                  console.log('🎨 Total entries:', Object.entries(imagesByCollection).length);
                  // Priority order: Children in Art → Albert Kahn → Met Museum → Public Domain Review
                  const priorityOrder = ['Children in Art', 'Albert Kahn', 'Met Museum', 'Public Domain Review'];
                  const sortedEntries = Object.entries(imagesByCollection).sort(([collectionA], [collectionB]) => {
                    const indexA = priorityOrder.indexOf(collectionA);
                    const indexB = priorityOrder.indexOf(collectionB);
                    // If not in priority list, put at end
                    const orderA = indexA === -1 ? 999 : indexA;
                    const orderB = indexB === -1 ? 999 : indexB;
                    return orderA - orderB;
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
                        hideMainTitle={true}
                      />
                    )) || []
                  );
                })()}
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
