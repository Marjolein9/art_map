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
export const useQuiz = (backendReady, selectedRegion = null) => {
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
    try {
      // TRY/CATCH: Error handling pattern
      // try block: Code that might fail
      // catch block: Handles errors if they occur

      // Show loading screen only on initial load
      if (isInitialLoad.current) setLoading(true);

      // Reset to playing state
      setGameStatus('playing');

      // await: Pause here until fetchRandomCountry() completes
      // fetchRandomCountry() returns a Promise that resolves to country data
      // Pass selectedRegion to filter by continent/region
      const country = await fetchRandomCountry(selectedRegion);

      // Create new country object with preferred display name
      const countryWithDisplayName = {
        ...country,  // Spread operator: Copy all properties from country object
        name: country.common_name || country.name
        // Logical OR (||): Use common_name if it exists, otherwise fallback to name
        // This overwrites the 'name' property from the spread
      };

      // Update target country state
      setTargetCountry(countryWithDisplayName);

      // On initial load, hide loading screen
      if (isInitialLoad.current) {
        // Mark that initial load is complete
        isInitialLoad.current = false;

        // Hide loading screen
        setLoading(false);
      }
    } catch (err) {
      // catch: Runs if any error occurs in the try block
      // err: The error object containing details about what went wrong

      console.error('Error fetching random country:', err);

      // Make sure to hide loading screen even if error occurs
      if (isInitialLoad.current) setLoading(false);
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
      console.error('Error checking answer:', err);
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
  return {
    targetCountry,          // Current target country object
    loading,                // Loading state
    gameStatus,             // Current game status ('playing', 'correct', 'incorrect')
    handleCountryClick,     // Function to check user's answer
    fetchNewCountry,        // Function to get a new random country
    resetGameStatus,        // Function to reset game to 'playing' state
    setManualTargetCountry  // Function to manually set target country
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
