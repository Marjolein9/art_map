/**
 * useAsyncError Hook for Standardized API Error Handling
 *
 * CUSTOM HOOKS: Reusable Logic
 * ============================
 *
 * A custom hook is a JavaScript function that uses React hooks internally.
 * It allows you to extract component logic into reusable functions.
 *
 * Why create useAsyncError hook?
 * ✅ Avoid duplicating error handling code in every component
 * ✅ Consistent error state management
 * ✅ Easy to update error handling in one place
 * ✅ Testable in isolation
 *
 * When to use:
 * - API calls that might fail
 * - Async operations with error states
 * - Any component that fetches data
 *
 * Hook Rules:
 * 1. Hooks can only be called at the top level of functional components
 * 2. Hooks can't be called inside conditionals/loops
 * 3. Hook names must start with "use"
 * 4. Custom hooks can call other hooks
 *
 * INTERVIEW PREP: Error Handling Patterns
 * ======================================
 *
 * Common patterns:
 * 1. Try/catch in useEffect
 * 2. Error boundary for rendering errors
 * 3. Custom hook for repeated error logic (this)
 * 4. Error toast notifications
 * 5. Retry logic with exponential backoff
 *
 * This hook demonstrates:
 * - useState for error state
 * - useEffect for async operations
 * - useCallback for memoized handlers
 * - Separation of concerns (hook vs component)
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for handling async API calls with standardized error management.
 *
 * USAGE EXAMPLE:
 *   const { data, loading, error, retry } = useAsyncError(
 *     () => fetchCountries(),
 *     [dependencies]
 *   );
 *
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   return <div>{data}</div>;
 *
 * @param {Function} asyncFunction - Async function that returns data or throws error
 * @param {Array} dependencies - Dependency array (like useEffect)
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Object} - { data, loading, error, retry, retryCount }
 */
const useAsyncError = (asyncFunction, dependencies = [], maxRetries = 3) => {
  // State management for async operation
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null,
    retryCount: 0
  });

  /**
   * Execute the async function with retry logic.
   *
   * INTERVIEW PREP: Async/Await Pattern
   * ==================================
   *
   * async/await is syntactic sugar for Promises.
   *
   * Before (callbacks):
   *   function fetchData(callback) {
   *     fetch(url)
   *       .then(resp => resp.json())
   *       .then(data => callback(data))
   *       .catch(err => console.error(err));
   *   }
   *
   * After (async/await):
   *   async function fetchData() {
   *     try {
   *       const resp = await fetch(url);
   *       const data = await resp.json();
   *       return data;
   *     } catch (err) {
   *       console.error(err);
   *     }
   *   }
   *
   * Benefits:
   * - Reads like synchronous code
   * - Easier error handling with try/catch
   * - More readable than nested .then() chains
   */
  const executeAsync = useCallback(async (retryAttempt = 0) => {
    try {
      // Reset state when starting new attempt
      setState(prev => ({
        ...prev,
        loading: true,
        error: null,
        retryCount: retryAttempt
      }));

      // Execute the async function
      const result = await asyncFunction();

      // Success! Update state with data
      setState({
        data: result,
        loading: false,
        error: null,
        retryCount: 0
      });
    } catch (err) {
      /**
       * Error occurred. Should we retry?
       *
       * Retry Strategy:
       * - Network errors: Retry up to maxRetries
       * - Client errors (4xx): Don't retry
       * - Server errors (5xx): Retry
       *
       * This hook retries any error automatically,
       * but you could make it smarter by checking error type.
       */

      const isNetworkError = !err.response || err.response.status >= 500;
      const shouldRetry = isNetworkError && retryAttempt < maxRetries;

      if (shouldRetry) {
        // Wait before retrying (exponential backoff)
        // 1st retry: wait 1s, 2nd retry: wait 2s, etc.
        const delay = Math.pow(2, retryAttempt) * 1000;
        console.warn(`Retrying in ${delay}ms (attempt ${retryAttempt + 1}/${maxRetries})`);

        setTimeout(() => {
          executeAsync(retryAttempt + 1);
        }, delay);
      } else {
        // No more retries - show error to user
        const errorState = {
          data: null,
          loading: false,
          error: {
            message: err.message || 'An error occurred',
            code: err.response?.status || 'UNKNOWN',
            details: err.response?.data || {},
            timestamp: new Date().toISOString(),
            retryAttempt
          },
          retryCount: retryAttempt
        };

        setState(errorState);

        // Log error for debugging
        console.error('Async operation failed:', {
          error: err,
          retryAttempt,
          maxRetries
        });
      }
    }
  }, [asyncFunction, maxRetries]);

  /**
   * Effect: Run async function when component mounts or dependencies change.
   *
   * INTERVIEW PREP: useEffect Hook
   * =============================
   *
   * useEffect runs after the component renders.
   * It's used for side effects (API calls, DOM updates, subscriptions).
   *
   * Syntax: useEffect(callback, [dependencies])
   *
   * Dependencies:
   * - [] (empty): Run once on mount
   * - [dep1, dep2]: Run when dep1 or dep2 changes
   * - undefined: Run after every render (avoid!)
   *
   * Cleanup:
   * Return a function from useEffect to clean up (unsubscribe, cancel requests).
   */
  useEffect(() => {
    // Execute async function when component mounts
    executeAsync(0);  // Start with 0 retries

    // Cleanup: Could cancel pending requests here
    // return () => { /* cleanup */ };
  }, dependencies);  // Re-run if dependencies change

  /**
   * Manual retry handler - allows component to retry on user action.
   *
   * Example:
   *   {error && <button onClick={retry}>Retry</button>}
   */
  const retry = useCallback(() => {
    executeAsync(0);  // Reset retry count
  }, [executeAsync]);

  return {
    ...state,
    retry
  };
};

export default useAsyncError;

/**
 * USAGE EXAMPLES
 * ==============
 *
 * Example 1: Simple data fetching
 *
 *   function CountriesList() {
 *     const { data: countries, loading, error, retry } = useAsyncError(
 *       () => fetchCountries(),
 *       []  // Run once on mount
 *     );
 *
 *     if (loading) return <p>Loading countries...</p>;
 *     if (error) return (
 *       <div>
 *         <p>Error: {error.message}</p>
 *         <button onClick={retry}>Try again</button>
 *       </div>
 *     );
 *
 *     return (
 *       <ul>
 *         {countries.map(c => <li key={c.iso3}>{c.name}</li>)}
 *       </ul>
 *     );
 *   }
 *
 * Example 2: Refetch when parameter changes
 *
 *   function CountryDetail({ iso3 }) {
 *     const { data: country, loading, error, retry } = useAsyncError(
 *       () => fetchCountry(iso3),
 *       [iso3]  // Re-run when iso3 changes
 *     );
 *
 *     // Hook automatically refetches when iso3 changes
 *     return <div>{country?.name}</div>;
 *   }
 *
 * Example 3: Custom retry logic
 *
 *   function DataViewer() {
 *     const { data, loading, error, retry, retryCount } = useAsyncError(
 *       () => fetchData(),
 *       [],
 *       5  // Max 5 retries
 *     );
 *
 *     return (
 *       <>
 *         {error && (
 *           <div>
 *             <p>Failed after {retryCount} attempts: {error.message}</p>
 *             <button onClick={retry}>Try again</button>
 *           </div>
 *         )}
 *         {!error && data && <p>{data}</p>}
 *       </>
 *     );
 *   }
 *
 * BENEFITS OVER DOING IT MANUALLY:
 * =================================
 * ✅ Reusable: Use in any component that needs async
 * ✅ DRY: No duplicate try/catch code
 * ✅ Consistent: All components handle errors the same way
 * ✅ Testable: Can test hook logic independently
 * ✅ Maintainable: Update retry logic in one place
 * ✅ Retry logic: Automatic exponential backoff
 *
 * WHEN TO USE OTHER APPROACHES:
 * =============================
 * - Redux/Zustand: For global state management (multiple components need data)
 * - React Query: For complex caching and synchronization
 * - SWR: For data fetching with built-in caching
 * - Error Boundary: For rendering errors (use useAsyncError for API errors)
 */
