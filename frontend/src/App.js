/**
 * REACT IMPORTS
 *
 * Interview Note: React hooks are functions that let you "hook into" React features
 * - useState: Manages component state (data that changes over time)
 * - useEffect: Handles side effects (data fetching, subscriptions, DOM manipulation)
 */
import { useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import muiTheme from './theme/muiTheme';
import './styles/App.css';
import './styles/components.css';
import WorldMap from './components/WorldMap';
import ArtworkInfoBar from './components/ArtworkInfoBar';
import WelcomeOverlay from './components/WelcomeOverlay.mui';
import COLOR_SCHEME from './styles/colorSchemes';
import { useQuiz } from './hooks/useQuiz';
import { fetchCountries } from './services/api';

/**
 * APP COMPONENT
 *
 * Interview Note: This is the root component of the application
 * - Manages global state (mode, countries, UI state)
 * - Coordinates communication between child components
 * - Handles data fetching and error recovery
 * - Implements two modes: Quiz mode and Explore mode
 */
function App() {
  // ===========================================================================
  // STATE MANAGEMENT
  // ===========================================================================

  /**
   * Interview Note: useState Hook
   *
   * useState returns an array with two elements:
   * 1. Current state value
   * 2. Function to update that value
   *
   * Why use array destructuring?
   * - Allows us to name the state and setter whatever we want
   * - Example: const [mode, setMode] = useState('explore')
   *
   * When state updates:
   * - React schedules a re-render of the component
   * - State updates are asynchronous and batched for performance
   * - Never mutate state directly (React won't detect the change)
   */

  // Application mode: 'explore' (free browsing) or 'quiz' (game mode)
  const [mode, setMode] = useState('quiz');

  // Currently selected country in explore mode
  const [exploreCountry, setExploreCountry] = useState(null);

  // Controls visibility of the artwork sidebar
  const [infoBarOpen, setInfoBarOpen] = useState(false);

  // Map of ISO3 codes to country names for quick lookups (O(1) time complexity)
  const [countryLookup, setCountryLookup] = useState({});

  // Tracks which country user clicked in quiz mode
  const [clickedCountry, setClickedCountry] = useState(null);

  // Whether user has submitted their quiz answer
  const [answerSubmitted, setAnswerSubmitted] = useState(false);

  // Loading state for initial explore mode setup
  const [exploreLoading, setExploreLoading] = useState(true);

  // Tracks if backend API is available (handles backend startup delay)
  const [backendReady, setBackendReady] = useState(false);

  // Controls disclaimer modal visibility
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);

  // Controls welcome overlay visibility on initial load
  const [showWelcome, setShowWelcome] = useState(false);

  // Selected image collections to display (all selected by default)
  const [selectedCollections, setSelectedCollections] = useState([
    'Albert Kahn',
    'Children in Art',
    'Public Domain Review',
    'Met Museum'
  ]);

  // Selected region for quiz filtering (null = all regions)
  const [selectedQuizRegion, setSelectedQuizRegion] = useState(null);

  // Color scheme constants (not state because they never change)
  const COLORS = COLOR_SCHEME;

  // ===========================================================================
  // DATA FETCHING WITH useEffect
  // ===========================================================================

  /**
   * Interview Note: useEffect Hook for Data Fetching
   *
   * useEffect runs side effects after render
   * Signature: useEffect(callback, dependencies)
   *
   * Key concepts to explain:
   * 1. Dependency Array ([]):
   *    - Empty array [] = run once on mount (like componentDidMount)
   *    - No array = run after every render (usually bad!)
   *    - [var1, var2] = run when var1 or var2 changes
   *
   * 2. Cleanup Function:
   *    - Return a function from useEffect to clean up
   *    - Runs before next effect and on unmount
   *    - Critical for preventing memory leaks
   *
   * 3. Race Condition Prevention:
   *    - 'cancelled' flag prevents setting state after unmount
   *    - Without this, you'd get "Can't perform a React state update on an unmounted component"
   *
   * 4. Retry Logic:
   *    - Handles backend startup delay gracefully
   *    - Uses exponential backoff pattern (10s retry)
   */
  useEffect(() => {
    // Race condition prevention: tracks if component is still mounted
    let cancelled = false;
    let retryTimeoutId = null;

    /**
     * Async function to load countries from backend
     *
     * Interview Note: Why define function inside useEffect?
     * - Allows access to useEffect's closure variables (cancelled)
     * - Keeps async logic organized
     * - Can be called recursively for retries
     */
    const loadCountries = async () => {
      try {
        console.log('[API] Trying to fetch countries...');
        const countries = await fetchCountries();

        // Check if component unmounted during fetch
        if (cancelled) return;

        /**
         * Build lookup object for O(1) country name access
         *
         * Interview Note: Why use an object instead of array.find()?
         * - Object lookup: O(1) time complexity
         * - Array.find(): O(n) time complexity
         * - Matters when looking up countries frequently during rendering
         */
        const lookup = {};
        countries.forEach(country => {
          lookup[country.iso3] = country.common_name || country.name;
        });
        setCountryLookup(lookup);

        setExploreLoading(false);
        setBackendReady(true);
        console.log('[API] Backend available, explore mode ready');
      } catch (error) {
        /**
         * Retry logic: Backend might still be starting up
         *
         * Interview Note: Why setTimeout instead of setInterval?
         * - setTimeout ensures previous request completes before next one
         * - setInterval could stack requests if response is slow
         * - Prevents overwhelming the backend with concurrent requests
         */
        console.error('[API] Backend unavailable, retrying in 10s...', error);
        retryTimeoutId = setTimeout(loadCountries, 10000);
      }
    };

    // Start initial load
    loadCountries();

    /**
     * Cleanup function
     *
     * Interview Note: Why is cleanup important?
     * - Prevents memory leaks
     * - Cancels pending timeouts when component unmounts
     * - Sets 'cancelled' flag to prevent state updates after unmount
     * - Runs before component unmounts AND before next effect runs
     */
    return () => {
      cancelled = true;
      if (retryTimeoutId) clearTimeout(retryTimeoutId);
    };
  }, []); // Empty dependency array = run once on mount

  // ===========================================================================
  // CUSTOM HOOKS
  // ===========================================================================

  /**
   * Interview Note: Custom Hooks
   *
   * Custom hooks let you extract component logic into reusable functions
   *
   * Benefits:
   * - Separation of concerns (quiz logic separate from UI logic)
   * - Reusability (can use in multiple components)
   * - Easier testing (can test hook logic independently)
   * - Better code organization
   *
   * Naming convention: Must start with "use" (React's rules of hooks)
   *
   * This hook manages:
   * - Quiz game state (target country, loading, game status)
   * - Quiz game logic (checking answers, fetching new countries)
   * - Returns both state and functions (common pattern)
   *
   * Object destructuring lets us pick what we need from the hook
   */
  const {
    targetCountry,           // Current country to guess
    loading,                 // Loading state for fetching new country
    gameStatus,              // 'correct' | 'incorrect' | null
    handleCountryClick,      // Function to check user's answer
    fetchNewCountry,         // Function to get next quiz question
    resetGameStatus,         // Function to reset game state
    setManualTargetCountry   // Function to set target country manually
  } = useQuiz(backendReady, selectedQuizRegion); // Pass backendReady and selected region

  // Fetch initial target country when starting in quiz mode
  useEffect(() => {
    if (backendReady && mode === 'quiz' && !targetCountry) {
      fetchNewCountry();
    }
  }, [backendReady, mode, targetCountry, fetchNewCountry]);

  // ===========================================================================
  // EVENT HANDLERS
  // ===========================================================================

  /**
   * Interview Note: Event Handlers in React
   *
   * Why define handlers in the component body?
   * - They need access to component state and props (closure)
   * - Can call setState functions to update state
   * - Re-created on each render (new reference each time)
   *
   * Performance consideration:
   * - If passing handler to child component, consider useCallback
   * - useCallback memoizes the function to prevent unnecessary child re-renders
   * - Not needed here because handlers are used directly in this component
   */

  /**
   * Toggles between 'quiz' and 'explore' modes
   *
   * Interview Note: Why not just setMode(mode === 'quiz' ? 'explore' : 'quiz')?
   * - We do! But storing in variable makes code more readable
   * - Also allows us to check the NEW mode (not just old mode)
   * - Demonstrates thinking about code readability
   */
  const handleModeToggle = () => {
    const newMode = mode === 'quiz' ? 'explore' : 'quiz';
    setMode(newMode);
    // Clear explore selection and fetch new target country when switching to quiz mode
    if (newMode === 'quiz') {
      setExploreCountry(null);
      fetchNewCountry();
    }
  };

  /**
   * Handles country click on map
   *
   * Interview Note: Polymorphic function pattern
   * - Same function handles clicks in both modes
   * - Behavior changes based on current mode (mode state)
   * - Keeps map component simple (doesn't need to know about modes)
   * - Demonstrates conditional logic and state management
   */
  const handleExploreClick = (countryIso) => {
    if (mode === 'explore') {
      // Explore mode: just show country info
      setExploreCountry(countryIso);
      setInfoBarOpen(true);
    } else {
      // Quiz mode: check answer and show results
      setClickedCountry(countryIso);
      setAnswerSubmitted(true);
      handleCountryClick(countryIso); // From useQuiz hook
      setInfoBarOpen(true);
    }
  };

  /**
   * Closes info sidebar and resets related state
   *
   * Interview Note: State management pattern
   * - Reset multiple related pieces of state together
   * - Ensures UI is in consistent state after closing
   * - Prevents stale state from affecting next interaction
   */
  const handleCloseInfoBar = () => {
    setInfoBarOpen(false);
    setClickedCountry(null);
    setAnswerSubmitted(false);
    resetGameStatus(); // From useQuiz hook
  };

  /**
   * Moves to next country in quiz mode
   *
   * Interview Note: Why separate from handleCloseInfoBar?
   * - Different intent: close vs. next
   * - Next also fetches new country data
   * - Keeps functions focused (Single Responsibility Principle)
   */
  const handleNextCountry = () => {
    setInfoBarOpen(false);
    setClickedCountry(null);
    setAnswerSubmitted(false);
    fetchNewCountry(); // From useQuiz hook - triggers new quiz question
  };

  /**
   * Handles clicks on modal backdrop (dark overlay)
   *
   * Interview Note: Event bubbling and stopPropagation
   * - e.target = element that triggered the event
   * - e.currentTarget = element with the event listener
   * - Only close if clicked directly on backdrop (not child elements)
   * - Prevents closing when clicking inside the info panel
   *
   * Optional chaining (?.) protects against null/undefined
   * - targetCountry?.iso returns undefined if targetCountry is null
   * - Prevents "Cannot read property 'iso' of null" error
   */
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      if (mode === 'explore') {
        handleCloseInfoBar();
      } else {
        // Quiz mode: auto-advance if correct, close if incorrect
        const isCorrect = clickedCountry === targetCountry?.iso;
        if (isCorrect) handleNextCountry();
        else handleCloseInfoBar();
      }
    }
  };

  const getCurrentCountryData = () => {
    if (mode === 'quiz') {
      if (clickedCountry) {
        const isCorrect = clickedCountry === targetCountry?.iso;
        return {
          iso: isCorrect ? targetCountry?.iso : clickedCountry,
          name: isCorrect ? targetCountry?.name : countryLookup[clickedCountry],
        };
      }
      return {
        iso: targetCountry?.iso,
        name: targetCountry?.name,
      };
    } else {
      return {
        iso: exploreCountry,
        name: countryLookup[exploreCountry],
      };
    }
  };

  const currentCountry = getCurrentCountryData();

  // ===========================================================================
  // RENDER
  // ===========================================================================
  return (
    <ThemeProvider theme={muiTheme}>
      <div className="App">
        <div className="app-background" style={{
          '--bg-gradient': COLORS.backgroundGradient,
          '--bg-primary': COLORS.bgPrimary,
          '--bg-secondary': COLORS.bgSecondary,
          '--text-primary': COLORS.textPrimary,
          '--text-secondary': COLORS.textSecondary,
          '--link-color': COLORS.linkColor,
          '--link-hover': COLORS.linkHover
        }}>
            <div className="app-content">
              <div
                className="map-container map-container-full"
                style={{
                  '--card-bg': COLORS.cardBg,
                  '--glow-color': COLORS.glow,
                  '--border-color': COLORS.border,
                  '--text-color': COLORS.text,
                }}
              >
                {/* Welcome Overlay - Shows on initial load */}
                {showWelcome && (
                  <WelcomeOverlay
                    onStartQuiz={() => {
                      setShowWelcome(false);
                      setMode('quiz');
                      fetchNewCountry();
                    }}
                    onExplore={() => {
                      setShowWelcome(false);
                      setMode('explore');
                    }}
                    colors={COLORS}
                  />
                )}

                <WorldMap
                  backendReady={backendReady}
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
                  setShowWelcome={setShowWelcome}
                  selectedQuizRegion={selectedQuizRegion}
                  onQuizRegionChange={setSelectedQuizRegion}
                />

                {((loading && mode === 'quiz') || (exploreLoading && mode === 'explore')) && (
                  <div className="loading-overlay">
                    <div
                      className="loading-content"
                      style={{
                        '--card-bg': COLORS.cardBg,
                        '--text-color': COLORS.text,
                        '--glow-color': COLORS.glow,
                        '--border-color': COLORS.border,
                      }}
                    >
                      <div className="loading-spinner"></div>
                      <p className="loading-text">
                        {mode === 'quiz' ? 'Loading quiz data...' : 'Loading explore mode...'}
                      </p>
                    </div>
                  </div>
                )}

                {infoBarOpen && currentCountry.iso && (
                  <div  onClick={handleBackdropClick}>
                    <div >
                      <ArtworkInfoBar
                        countryISO={currentCountry.iso}
                        countryName={currentCountry.name}
                        colors={COLORS}
                        mode={mode}
                        answerSubmitted={answerSubmitted}
                        isCorrectAnswer={clickedCountry === targetCountry?.iso}
                        onClose={handleCloseInfoBar}
                        onNext={handleNextCountry}
                        selectedCollections={selectedCollections}
                        onCollectionsChange={setSelectedCollections}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Disclaimer Modal */}
          {disclaimerOpen && (
            <div className="disclaimer-backdrop" onClick={() => setDisclaimerOpen(false)}>
              <div className="disclaimer-modal" onClick={(e) => e.stopPropagation()}>
                <h3>Disclaimer</h3>
                <p>
                  The information presented on this website is provided for educational and informational purposes only.
                  While I strive for accuracy, I make no representations or warranties of any kind, express or implied,
                  about the completeness, accuracy, reliability, or suitability of the information, images, or materials
                  displayed.
                </p>
                <p>
                  The information may contain errors or omissions.
                  Users are encouraged to conduct their own research and verify information from authoritative sources
                  before relying on it for any purpose.
                </p>
                <p>
                  By using this website, you acknowledge that any reliance on the information provided is at your own risk.
                </p>
                <button className="disclaimer-close-btn" onClick={() => setDisclaimerOpen(false)}>
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Footer with Disclaimer Link */}
          <div className="app-footer">
            <button className="disclaimer-link" onClick={() => setDisclaimerOpen(true)}>
              Disclaimer
            </button>
          </div>
        </div>
    </ThemeProvider>
  );
}

export default App;
