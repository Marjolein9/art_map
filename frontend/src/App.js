/*
 * REACT BASICS FOR BEGINNERS
 * ===========================
 * React is a JavaScript library for building user interfaces with reusable components.
 *
 * Key Concepts in this file:
 *
 * 1. COMPONENTS
 *    - Components are reusable pieces of UI (like building blocks)
 *    - Example: <WorldMap /> renders a 3D globe component
 *    - App is the main component that combines all other components
 *
 * 2. STATE (useState)
 *    - State is data that can change over time
 *    - When state changes, React automatically re-renders the component
 *    - Syntax: const [value, setValue] = useState(initialValue)
 *    - Example: const [mode, setMode] = useState('quiz')
 *      - mode is the current value
 *      - setMode is the function to update it
 *      - 'quiz' is the initial value
 *
 * 3. EFFECTS (useEffect)
 *    - Run code when component mounts or when dependencies change
 *    - Example: Fetch data from API when component loads
 *
 * 4. CUSTOM HOOKS (useQuiz)
 *    - Reusable logic extracted into a function
 *    - Returns values and functions other components can use
 *
 * 5. PROPS
 *    - Data passed from parent component to child component
 *    - Example: <WorldMap targetCountry={targetCountry?.iso} />
 *      - targetCountry is a prop passed to WorldMap
 */

// Import React hooks for managing state and side effects
// useState: Manage component state (data that can change)
// useEffect: Run code when component mounts or updates
// useRef: Create a mutable reference that persists across renders
import { useState, useEffect, useRef } from 'react';

// Import CSS styles for this component
import './styles/App.css';
import './styles/components.css';

// Import child components (reusable UI pieces)
import WorldMap from './components/WorldMap';  // 3D globe component
import ArtworkInfoBar from './components/ArtworkInfoBar';  // Side panel showing artwork

// Import configuration and utilities
import COLOR_SCHEME from './styles/colorSchemes';  // Color palette for UI
import { useQuiz } from './hooks/useQuiz';  // Custom hook for quiz game logic
import { fetchCountries } from './services/api';  // API call to fetch country data

/**
 * App Component - Main component that orchestrates the entire application
 *
 * This component manages:
 * - Quiz mode vs Explore mode
 * - User interactions (country clicks, mode toggle)
 * - Info bar visibility
 * - Answer checking and game flow
 */
function App() {
  // ===========================================================================
  // STATE MANAGEMENT
  // ===========================================================================

  // Quiz game state from custom hook
  // This hook handles: random country selection, answer checking, game status
  const { targetCountry, loading, gameStatus, handleCountryClick, fetchNewCountry, resetGameStatus, setManualTargetCountry } = useQuiz();

  // Mode: 'quiz' or 'explore'
  // Quiz mode: User guesses countries from artwork
  // Explore mode: User browses countries and their artwork freely
  const [mode, setMode] = useState('explore');

  // Country selected in explore mode
  const [exploreCountry, setExploreCountry] = useState(null);

  // Info bar visibility (sidebar showing artwork and info)
  const [infoBarOpen, setInfoBarOpen] = useState(false);

  // Country lookup table: { 'USA': 'United States', 'GBR': 'United Kingdom', ... }
  // Used to quickly get country name from ISO3 code
  const [countryLookup, setCountryLookup] = useState({});

  // Track which country user clicked (for showing info even if incorrect)
  const [clickedCountry, setClickedCountry] = useState(null);

  // Track if user has submitted an answer (to show result)
  const [answerSubmitted, setAnswerSubmitted] = useState(false);

  // Loading state for explore mode
  const [exploreLoading, setExploreLoading] = useState(true);
  const isExploreInitialLoad = useRef(true);

  // Use vintage color scheme (1900s themed UI colors)
  const COLORS = COLOR_SCHEME;

  // ===========================================================================
  // EFFECTS (Run once when component mounts)
  // ===========================================================================

  // Fetch all countries from API when component first loads
  // useEffect with empty array [] means: "run once when component mounts"
  // This is like componentDidMount in class components
  useEffect(() => {
    // Call API to get list of all countries
    const loadCountries = async () => {
      try {
        const countries = await fetchCountries();
        // Build a lookup object for quick name retrieval using common_name
        // Input: [{ iso3: 'USA', name: 'United States of America', common_name: 'United States' }, ...]
        // Output: { 'USA': 'United States', 'GBR': 'United Kingdom', ... }
        const lookup = {};
        countries.forEach(country => {
          // Use common_name if available, fallback to name
          lookup[country.iso3] = country.common_name || country.name;
        });
        // Update state with the lookup object
        setCountryLookup(lookup);

        // Add 5-second delay ONLY on initial load for explore mode (for testing)
        if (isExploreInitialLoad.current) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          isExploreInitialLoad.current = false;
          setExploreLoading(false);
        }
      } catch (error) {
        console.error('Error fetching countries:', error);
        // Keep loading state true if backend is unavailable
        // This shows the loading spinner until backend is available
      }
    };

    loadCountries();
  }, []); // Empty array = run only once on mount

  // ===========================================================================
  // EVENT HANDLERS (Functions that respond to user interactions)
  // ===========================================================================

  /**
   * Toggle between Quiz mode and Explore mode
   * Quiz mode: User guesses countries from artwork
   * Explore mode: User clicks any country to see its artwork
   */
  const handleModeToggle = () => {
    // Toggle between 'quiz' and 'explore'
    const newMode = mode === 'quiz' ? 'explore' : 'quiz';
    setMode(newMode);

    // Reset explore country when switching to quiz mode
    if (newMode === 'quiz') {
      setExploreCountry(null);
    }
  };

  /**
   * Handle when user clicks a country on the globe
   * Behavior differs based on current mode:
   * - Explore mode: Show country's artwork
   * - Quiz mode: Check if answer is correct
   */
  const handleExploreClick = (countryIso) => {
    if (mode === 'explore') {
      // Explore mode: Show the selected country's artwork
      setExploreCountry(countryIso);
      setInfoBarOpen(true); // Open info bar when country is selected
    } else {
      // In quiz mode, handle the answer check
      setClickedCountry(countryIso); // Store the clicked country
      setAnswerSubmitted(true); // Mark that an answer was submitted
      handleCountryClick(countryIso);
      // Always open info bar in quiz mode to show result (correct or incorrect)
      setInfoBarOpen(true);
    }
  };

  // Handle close info bar (Try Again)
  const handleCloseInfoBar = () => {
    setInfoBarOpen(false);
    setClickedCountry(null); // Clear clicked country when closing
    setAnswerSubmitted(false); // Reset answer submitted state
    resetGameStatus(); // Reset game status to 'playing' so user can try again
  };

  // Handle next country in quiz mode
  const handleNextCountry = () => {
    setInfoBarOpen(false); // Close info bar for next question
    setClickedCountry(null); // Clear clicked country when moving to next
    setAnswerSubmitted(false); // Reset answer submitted state
    fetchNewCountry();
  };

  // Handle backdrop click (clicking outside info bar)
  const handleBackdropClick = (e) => {
    // Only close if clicking the backdrop itself, not the info bar content
    if (e.target === e.currentTarget) {
      if (mode === 'explore') {
        handleCloseInfoBar();
      } else if (mode === 'quiz') {
        // In quiz mode: if correct answer, go to next; if incorrect, try again
        const isCorrect = clickedCountry === targetCountry?.iso;
        if (isCorrect) {
          handleNextCountry();
        } else {
          handleCloseInfoBar();
        }
      }
    }
  };

  // Get current country name
  const getCurrentCountryData = () => {
    if (mode === 'quiz') {
      // If user clicked a country (correct or incorrect), show that country's info
      if (clickedCountry) {
        const isCorrect = clickedCountry === targetCountry?.iso;
        return {
          iso: isCorrect ? targetCountry?.iso : clickedCountry,
          name: isCorrect ? targetCountry?.name : countryLookup[clickedCountry]
        };
      }
      // Otherwise show target country (initial state or after closing)
      return {
        iso: targetCountry?.iso,
        name: targetCountry?.name
      };
    } else {
      return {
        iso: exploreCountry,
        name: countryLookup[exploreCountry]
      };
    }
  };

  const currentCountry = getCurrentCountryData();

  return (
    <div className="App">
      {/* App background with dynamic color theme */}
      <div
        className="app-background"
        style={{ '--bg-gradient': COLORS.backgroundGradient }}
      >
        <div className="app-container">
          <div className="app-content">
            {/* Map container - Full width */}
            <div
              className="map-container map-container-full"
              style={{
                '--card-bg': COLORS.cardBg,
                '--glow-color': COLORS.glow,
                '--border-color': COLORS.border
              }}
            >
              <WorldMap
                onCountryClick={handleExploreClick}
                targetCountry={mode === 'quiz' ? targetCountry?.iso : null}
                targetCountryName={mode === 'quiz' ? targetCountry?.name : null}
                region={mode === 'quiz' && !loading ? (targetCountry?.subregion || targetCountry?.continent) : null}
                gameStatus={gameStatus}
                colors={COLORS}
                onNewGame={fetchNewCountry}
                onStartOver={fetchNewCountry}
                mode={mode}
                onModeToggle={handleModeToggle}
                loading={(loading && mode === 'quiz') || (exploreLoading && mode === 'explore')}
                onManualCountrySelect={setManualTargetCountry}
                countryLookup={countryLookup}
              />

              {/* Loading overlay - shown while data is loading */}
              {((loading && mode === 'quiz') || (exploreLoading && mode === 'explore')) && (
                <div className="loading-overlay">
                  <div className="loading-content" style={{
                    '--card-bg': COLORS.cardBg,
                    '--text-color': COLORS.text,
                    '--glow-color': COLORS.glow,
                    '--border-color': COLORS.border
                  }}>
                    <div className="loading-spinner"></div>
                    <p className="loading-text">
                      {mode === 'quiz' ? 'Loading quiz data...' : 'Loading explore mode...'}
                    </p>
                  </div>
                </div>
              )}

              {/* Artwork Info Bar - Overlay centered over map */}
              {infoBarOpen && currentCountry.iso && (
                <div className="artwork-backdrop" onClick={handleBackdropClick}>
                  <div className="artwork-overlay">
                    <ArtworkInfoBar
                      countryISO={currentCountry.iso}
                      countryName={currentCountry.name}
                      colors={COLORS}
                      mode={mode}
                      answerSubmitted={answerSubmitted}
                      isCorrectAnswer={clickedCountry === targetCountry?.iso}
                      onClose={handleCloseInfoBar}
                      onNext={handleNextCountry}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
