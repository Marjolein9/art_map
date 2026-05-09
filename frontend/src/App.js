/**
 * REACT IMPORTS
 *
 * Interview Note: React hooks are functions that let you "hook into" React features
 * - useState: Manages component state (data that changes over time)
 * - useEffect: Handles side effects (data fetching, subscriptions, DOM manipulation)
 */
import { useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from '@vercel/analytics/react';
import muiTheme from './theme/muiTheme';
import './styles/App.css';
import './styles/components.css';
import WorldMap from './components/WorldMap';
import ArtworkInfoBar from './components/ArtworkInfoBar';
import OnLoadOverlay from './components/OnLoadOverlay';
import WelcomeOverlay from './components/WelcomeOverlay.mui';
import COLOR_SCHEME from './styles/colorSchemes';
import { useQuiz } from './hooks/useQuiz';
import { fetchCountries } from './services/api';
import { getDisplayName } from './utils/displayHelpers';
import { debug, info, error as logError } from './utils/logger';
import { GameSettingsProvider, useGameSettings } from './contexts/GameSettingsContext';
import { ContentSettingsProvider } from './contexts/ContentSettingsContext';

/**
 * APP CONTENT COMPONENT
 *
 * Interview Note: This component contains the application logic
 * - Separated from App so it can use context hooks
 * - App renders providers, AppContent consumes context
 * - This is a common pattern to avoid prop drilling
 */
function AppContent() {
  // ===========================================================================
  // CONTEXT HOOKS
  // ===========================================================================

  /**
   * Interview Note: Context Hooks
   *
   * Game and content settings are now managed via React Context.
   * Child components (WorldMap, WelcomeOverlay, ArtworkInfoBar) access these
   * directly using useGameSettings() and useContentSettings() hooks.
   * This eliminates prop drilling - no need to pass props through AppContent.
   */

  // Get only the values needed in AppContent
  const { selectedQuizRegion, quizCountriesOnly } = useGameSettings();

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

  // Map of ISO3 codes to full country objects (includes wikipedia_url)
  const [countryDataLookup, setCountryDataLookup] = useState({});

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

  // Controls on-load overlay visibility (shown once on initial load)
  const [showOnLoad, setShowOnLoad] = useState(true);

  // Controls welcome/settings overlay visibility (opened via gear icon)
  const [showWelcome, setShowWelcome] = useState(false);

  // Note: The following state has been moved to React Context to eliminate prop drilling:
  // - Game settings (hints, region, quiz countries) -> GameSettingsContext
  // - Content settings (nudity filter, collections) -> ContentSettingsContext
  // Components now access these directly via useGameSettings() and useContentSettings()

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
    // Modern cancellation pattern using AbortController
    const controller = new AbortController();
    let retryTimeoutId = null;

    /**
     * Async function to load countries from backend
     *
     * Interview Note: Why define function inside useEffect?
     * - Allows access to useEffect's closure variables (controller)
     * - Keeps async logic organized
     * - Can be called recursively for retries
     */
    const loadCountries = async () => {
      try {
        debug('[API] Trying to fetch countries...');
        const countries = await fetchCountries({ signal: controller.signal });

        /**
         * Build lookup object for O(1) country name access
         *
         * Interview Note: Why use an object instead of array.find()?
         * - Object lookup: O(1) time complexity
         * - Array.find(): O(n) time complexity
         * - Matters when looking up countries frequently during rendering
         */
        const lookup = {};
        const dataLookup = {};
        countries.forEach(country => {
          lookup[country.iso3] = getDisplayName(country);
          dataLookup[country.iso3] = country; // Store full country object
        });
        setCountryLookup(lookup);
        setCountryDataLookup(dataLookup);

        setExploreLoading(false);
        setBackendReady(true);
        info('[API] Backend available, explore mode ready');
      } catch (error) {
        // Don't retry if the request was aborted (component unmounted)
        if (error.name === 'AbortError') {
          debug('[API] Fetch aborted');
          return;
        }

        /**
         * Retry logic: Backend might still be starting up
         *
         * Interview Note: Why setTimeout instead of setInterval?
         * - setTimeout ensures previous request completes before next one
         * - setInterval could stack requests if response is slow
         * - Prevents overwhelming the backend with concurrent requests
         */
        logError('[API] Backend unavailable, retrying in 10s...', error);
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
     * - Aborts in-flight requests using AbortController
     * - Runs before component unmounts AND before next effect runs
     */
    return () => {
      controller.abort();
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
    setManualTargetCountry,  // Function to set target country manually
    clearTargetCountry       // Function to clear target before fetching new one
  } = useQuiz(backendReady, selectedQuizRegion, quizCountriesOnly); // Pass backendReady, selected region, and quiz countries only flag

  // Fetch initial target country when starting in quiz mode (but not while OnLoadOverlay is showing)
  useEffect(() => {
    if (backendReady && mode === 'quiz' && !targetCountry && !showOnLoad) {
      fetchNewCountry();
    }
  }, [backendReady, mode, targetCountry, fetchNewCountry, showOnLoad]);

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
    if (newMode === 'quiz') {
      setExploreCountry(null);
      clearTargetCountry(); // Null out stale target immediately so it can't flash before new one arrives
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


  const getCurrentCountryData = () => {
    if (mode === 'quiz') {
      if (clickedCountry) {
        const isCorrect = clickedCountry === targetCountry?.iso;
        return {
          iso: isCorrect ? targetCountry?.iso : clickedCountry,
          name: isCorrect ? targetCountry?.name : countryLookup[clickedCountry],
          wikipedia_url: isCorrect ? targetCountry?.wikipedia_url : countryDataLookup[clickedCountry]?.wikipedia_url,
        };
      }
      return {
        iso: targetCountry?.iso,
        name: targetCountry?.name,
        wikipedia_url: targetCountry?.wikipedia_url,
      };
    } else {
      return {
        iso: exploreCountry,
        name: countryLookup[exploreCountry],
        wikipedia_url: countryDataLookup[exploreCountry]?.wikipedia_url,
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
                {/* On-Load Overlay - Shows once when app first loads */}
                {showOnLoad && (
                  <OnLoadOverlay
                    onStartQuiz={() => {
                      setShowOnLoad(false);
                      setMode('quiz');
                      fetchNewCountry();
                    }}
                    onExplore={() => {
                      setShowOnLoad(false);
                      setMode('explore');
                    }}
                    onClose={() => {
                      setShowOnLoad(false);
                      setMode('explore'); // Default to explore mode when closing without selection
                    }}
                  />
                )}

                {/* Welcome/Settings Overlay - Opened via gear icon */}
                {showWelcome && (
                  <WelcomeOverlay
                    onClose={() => {
                      setShowWelcome(false);
                      // Auto-next when closing in quiz mode
                      if (mode === 'quiz') {
                        setTimeout(() => fetchNewCountry(), 100);
                      }
                    }}
                    colors={COLORS}
                    mode={mode}
                    onModeToggle={handleModeToggle}
                    onRegionChange={() => {
                      if (mode === 'quiz') {
                        // Small delay to ensure state has updated
                        setTimeout(() => fetchNewCountry(), 100);
                      }
                    }}
                  />
                )}

                {/* TESTING SUBREGION ZOOM: Only use subregion (no continent fallback)
                    TO REVERT: Change region line below back to (targetCountry?.subregion || targetCountry?.continent) */}
                <WorldMap
                  backendReady={backendReady}
                  onCountryClick={handleExploreClick}
                  targetCountry={mode === 'quiz' ? targetCountry?.iso : null}
                  targetCountryName={mode === 'quiz' ? targetCountry?.name : null}
                  region={mode === 'quiz' && !loading ? targetCountry?.subregion : null}
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
                />

                {(!backendReady || (loading && mode === 'quiz') || (exploreLoading && mode === 'explore')) && (
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
                        {!backendReady
                          ? 'Connecting to backend...'
                          : mode === 'quiz' ? 'Loading quiz data...' : 'Loading explore mode...'}
                      </p>
                    </div>
                  </div>
                )}

                {infoBarOpen && currentCountry.iso && (
                  <ArtworkInfoBar
                    countryISO={currentCountry.iso}
                    countryName={currentCountry.name}
                    wikipediaUrl={currentCountry.wikipedia_url}
                    colors={COLORS}
                    mode={mode}
                    answerSubmitted={answerSubmitted}
                    isCorrectAnswer={clickedCountry === targetCountry?.iso}
                    onClose={handleCloseInfoBar}
                    onNext={handleNextCountry}
                  />
                )}
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
              <span className="footer-author">Created by: Marjolein Oostrom</span>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}

/**
 * APP COMPONENT
 *
 * Root component that wraps AppContent with context providers
 * This separation allows AppContent to use context hooks
 */
function App() {
  return (
    <GameSettingsProvider>
      <ContentSettingsProvider>
        <AppContent />
        <SpeedInsights />
        <Analytics />
      </ContentSettingsProvider>
    </GameSettingsProvider>
  );
}

export default App;
