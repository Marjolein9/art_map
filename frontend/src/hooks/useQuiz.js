/**
 * useQuiz - Custom React Hook
 *
 * CUSTOM HOOKS:
 * - Custom hooks are reusable functions that use React hooks internally
 * - They let you extract component logic into reusable functions
 * - Must start with "use" (naming convention required by React)
 * - Can use other hooks (useState, useEffect, etc.)
 * - Return values/functions that components can use
 *
 * This hook manages all the quiz game logic: fetching random countries,
 * checking answers, and tracking game state.
 */

// Import React hooks
import { useState, useRef } from 'react';
// useState: Manages state that triggers re-renders when updated
// useRef: Creates persistent references that don't trigger re-renders

// Import logger utility
import { error as logError } from '../utils/logger';

// Import API functions
import { fetchRandomCountry, checkAnswer } from '../services/api';
// fetchRandomCountry: Gets a random country from the backend
// checkAnswer: Verifies if the user's guess is correct

/**
 * useQuiz Hook
 *
 * @param {boolean} backendReady - Whether the backend server is ready
 * @param {string|null} selectedRegion - Selected region to filter countries (null = all regions)
 * @returns {Object} - Object containing state and functions for quiz management
 */
export const useQuiz = (selectedRegion = null, correctCountries = []) => {
  /**
   * STATE VARIABLES
   *
   * useState: Creates state variables that persist across re-renders
   * Updating state triggers component re-renders to show new data
   */

  // targetCountry: The country the user needs to find (null if no target set)
  // Contains: { iso, name, common_name, continent, subregion }
  const [targetCountry, setTargetCountry] = useState(null);

  // loading: Whether we're currently fetching/loading data
  const [loading, setLoading] = useState(false);

  // gameStatus: Current quiz state
  // Possible values: 'playing' (awaiting answer), 'correct' (right answer), 'incorrect' (wrong answer)
  const [gameStatus, setGameStatus] = useState('playing');

  // questionNumber: Track which question we're on (1-based, for first 2 questions use children artwork)
  const [questionNumber, setQuestionNumber] = useState(1);

  /**
   * REF VARIABLE
   *
   * useRef: Creates a mutable value that persists across re-renders
   * Unlike state, updating a ref does NOT trigger a re-render
   * Useful for values you need to track but don't need to display
   */

  // isInitialLoad: Tracks if this is the first time loading a country
  // Used to show loading screen only on first load, not subsequent loads
  const isInitialLoad = useRef(true);

  // isFetching: Prevents concurrent fetchNewCountry calls (StrictMode fires effects twice)
  const isFetching = useRef(false);

  /**
   * HELPER FUNCTIONS
   */

  // Reset game status back to 'playing' (used after showing result)
  const resetGameStatus = () => {
    setGameStatus('playing');
  };

  /**
   * ASYNC FUNCTION: Fetch New Country
   *
   * ASYNC/AWAIT:
   * - async: Declares a function that performs asynchronous operations
   * - await: Pauses execution until a Promise resolves
   * - Promises represent values that will be available in the future
   * - This lets us write async code that looks like synchronous code
   */
  const fetchNewCountry = async () => {
    if (isFetching.current) {
      console.log('[Quiz] ⛔ fetchNewCountry blocked — already in flight');
      return;
    }
    isFetching.current = true;
    console.log('[Quiz] 🎲 fetchNewCountry start — q#', questionNumber, '| region:', selectedRegion ?? 'all');
    try {
      // Show loading screen only on initial load
      if (isInitialLoad.current) setLoading(true);

      // Reset to playing state
      setGameStatus('playing');

      // For first 2 questions, only select countries with children artwork
      const requireChildrenArtwork = questionNumber <= 3;

      const country = await fetchRandomCountry(selectedRegion, undefined, requireChildrenArtwork, correctCountries);

      // Increment question number for next question
      setQuestionNumber(prev => prev + 1);

      const countryWithDisplayName = {
        ...country,
        name: country.common_name || country.name
      };

      setTargetCountry(countryWithDisplayName);

      if (isInitialLoad.current) {
        isInitialLoad.current = false;
        setLoading(false);
      }
    } catch (err) {
      logError('Error fetching random country:', err);
      if (isInitialLoad.current) setLoading(false);
    } finally {
      isFetching.current = false;
    }
  };

  /**
   * ASYNC FUNCTION: Handle Country Click
   *
   * Called when user clicks a country on the globe to submit their answer.
   *
   * @param {string} countryIso - ISO3 code of the clicked country (e.g., "USA", "DEU")
   */
  const handleCountryClick = async (countryIso) => {
    // Guard clauses: Prevent processing if game isn't active or no target set
    // Early return pattern: Exit function early if conditions aren't met
    if (gameStatus !== 'playing' || !targetCountry) return;

    try {
      // Send answer to backend for verification
      // await: Pause until checkAnswer() completes
      const result = await checkAnswer(countryIso, targetCountry.iso);

      // Update game status based on whether answer was correct
      // Ternary operator: condition ? ifTrue : ifFalse
      // result.correct is a boolean (true/false)
      setGameStatus(result.correct ? 'correct' : 'incorrect');
    } catch (err) {
      logError('Error checking answer:', err);
    }
  };

  /**
   * FUNCTION: Set Manual Target Country
   *
   * Allows manually selecting a country (used for testing via dropdown).
   *
   * @param {Object} country - Country object from the database
   */
  const setManualTargetCountry = (country) => {
    // Reset to playing state
    setGameStatus('playing');

    // Normalize country data format
    const countryWithDisplayName = {
      // Use iso3 if available, otherwise fallback to iso
      iso: country.iso3 || country.iso,
      name: country.common_name || country.name,
      common_name: country.common_name,
      continent: country.continent,
      subregion: country.subregion
    };

    // Set as target country
    setTargetCountry(countryWithDisplayName);
  };

  /**
   * RETURN OBJECT
   *
   * Custom hooks return values/functions that components can use.
   * This is the hook's public API - what components get when they call useQuiz().
   *
   * Object property shorthand: { targetCountry } is equivalent to { targetCountry: targetCountry }
   * When key and value have the same name, you can write it once.
   */
  const clearTargetCountry = () => setTargetCountry(null);

  return {
    targetCountry,          // Current target country object
    loading,                // Loading state
    gameStatus,             // Current game status ('playing', 'correct', 'incorrect')
    handleCountryClick,     // Function to check user's answer
    fetchNewCountry,        // Function to get a new random country
    resetGameStatus,        // Function to reset game to 'playing' state
    setManualTargetCountry, // Function to manually set target country
    clearTargetCountry      // Function to immediately clear target (prevents stale flash on mode switch)
  };
};

/**
 * USAGE EXAMPLE:
 *
 * In a component:
 * const { targetCountry, gameStatus, handleCountryClick } = useQuiz(backendReady);
 *
 * This destructures the returned object to get the specific values/functions you need.
 */
