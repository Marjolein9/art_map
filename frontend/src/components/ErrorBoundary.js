/**
 * Error Boundary Component for Art Map
 *
 * REACT ERROR BOUNDARIES: Catching Component Errors
 * =================================================
 *
 * What is an Error Boundary?
 * An Error Boundary is a React component that catches JavaScript errors
 * anywhere in the child component tree, logs those errors, and displays a
 * fallback UI instead of crashing the entire app.
 *
 * What it DOES catch:
 * ✅ Rendering errors
 * ✅ Lifecycle method errors
 * ✅ Constructor errors in child components
 * ✅ Errors in useEffect hooks
 *
 * What it DOES NOT catch:
 * ❌ Event handler errors (use try/catch instead)
 * ❌ Async errors in promises (use .catch())
 * ❌ Server-side rendering errors
 * ❌ Errors in the ErrorBoundary itself
 *
 * INTERVIEW PREP: Why Error Boundaries Matter
 * ===========================================
 *
 * Before Error Boundary:
 * - Any child component error → entire app crashes to white screen
 * - User sees broken page with no recovery option
 * - Hard to debug which component failed
 *
 * After Error Boundary:
 * - Error is caught and contained
 * - User sees friendly error message
 * - Rest of app continues working
 * - Error is logged for debugging
 *
 * Use Cases:
 * 1. Wrap entire app in ErrorBoundary for top-level catch-all
 * 2. Wrap individual features to isolate failures
 * 3. Wrap third-party components that might error
 *
 * Example:
 * <ErrorBoundary>
 *   <MyFeature />
 * </ErrorBoundary>
 *
 * If MyFeature crashes, ErrorBoundary catches it and shows fallback UI.
 */

import React from 'react';
import COLOR_SCHEME from '../styles/colorSchemes';
import { error as logError } from '../utils/logger';

class ErrorBoundary extends React.Component {
  /**
   * Initialize error boundary state.
   *
   * REACT PATTERN: Class Component for Error Boundaries
   * ==================================================
   * Error Boundaries must be class components (not functional components).
   * This is because error boundaries use lifecycle methods:
   * - componentDidCatch() - catches errors in child components
   * - static getDerivedStateFromError() - updates state when error occurs
   *
   * These lifecycle methods are only available in class components.
   * (Functional component hooks don't support error catching yet)
   *
   * State:
   *   hasError: true if error occurred
   *   error: the Error object
   *   errorInfo: additional error context
   */
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0  // Track how many errors occurred
    };
  }

  /**
   * Update state when error is detected.
   *
   * INTERVIEW PREP: getDerivedStateFromError
   * ======================================
   * This static method is called after an error in a descendant component.
   * It should return a new state to trigger re-render with fallback UI.
   *
   * Important: This runs during render phase, so it must be pure.
   * Don't perform side effects here. Use componentDidCatch() for that.
   *
   * @param {Error} error - The error that was thrown
   * @returns {Object} - New state
   */
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  /**
   * Handle error in child components.
   *
   * INTERVIEW PREP: componentDidCatch
   * ================================
   * This lifecycle method is called after an error in a descendant component.
   * Use it for side effects like:
   * - Logging errors to error reporting service
   * - Displaying error messages
   * - Sending metrics to analytics
   *
   * This runs in the commit phase (after render), so side effects are allowed.
   *
   * @param {Error} error - The error object
   * @param {ErrorInfo} errorInfo - Object with componentStack string showing which components errored
   */
  componentDidCatch(error, errorInfo) {
    // Update state with error details for display
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Log error for debugging
    logError('Error caught by ErrorBoundary:');
    logError('Error:', error);
    logError('Component Stack:', errorInfo.componentStack);

    // In production, you'd send this to an error reporting service
    // Example: Sentry, LogRocket, Bugsnag
    // this.logErrorToService(error, errorInfo);
  }

  /**
   * Reset error state - called when user clicks "Try Again"
   */
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            backgroundColor: COLOR_SCHEME.warning,  // Light warning color
            padding: '20px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto'
          }}
        >
          {/* Error Icon */}
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>⚠️</div>

          {/* Error Title */}
          <h1 style={{ color: COLOR_SCHEME.textPrimary, margin: '0 0 10px 0', fontSize: '24px' }}>
            Oops! Something went wrong
          </h1>

          {/* Error Message */}
          <p style={{ color: COLOR_SCHEME.textPrimary, fontSize: '16px', maxWidth: '500px', textAlign: 'center', lineHeight: '1.6' }}>
            We encountered an unexpected error. Our team has been notified.
            {this.state.error && (
              <>
                <br />
                <strong>Error:</strong> {this.state.error.toString()}
              </>
            )}
          </p>

          {/* Error Details (Developer Info) */}
          {this.state.errorInfo && (
            <details
              style={{
                marginTop: '20px',
                padding: '15px',
                backgroundColor: COLOR_SCHEME.bgSecondary,
                borderRadius: '5px',
                maxWidth: '700px',
                maxHeight: '300px',
                overflow: 'auto',
                border: `1px solid ${COLOR_SCHEME.borderSecondary}`
              }}
            >
              <summary style={{ cursor: 'pointer', color: COLOR_SCHEME.textPrimary, fontWeight: 'bold' }}>
                Technical Details (for developers)
              </summary>
              <pre
                style={{
                  margin: '10px 0 0 0',
                  fontSize: '1rem',
                  color: COLOR_SCHEME.textPrimary,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}

          {/* Error Count */}
          {this.state.errorCount > 1 && (
            <p style={{ color: COLOR_SCHEME.textPrimary, fontSize: '1rem', marginTop: '15px' }}>
              Errors encountered: {this.state.errorCount}
            </p>
          )}

          {/* Action Buttons */}
          <div style={{ marginTop: '30px', display: 'flex', gap: '10px' }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: '10px 20px',
                backgroundColor: COLOR_SCHEME.textPrimary,
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                padding: '10px 20px',
                backgroundColor: COLOR_SCHEME.textSecondary,
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            >
              Go Home
            </button>
          </div>
        </div>
      );
    }

    // No error - render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;

/**
 * USAGE EXAMPLES
 * ==============
 *
 * 1. Wrap entire app (top-level error boundary):
 *
 *    function App() {
 *      return (
 *        <ErrorBoundary>
 *          <WorldMap />
 *          <ArtworkInfoBar />
 *        </ErrorBoundary>
 *      );
 *    }
 *
 * 2. Wrap individual features (granular error boundaries):
 *
 *    function App() {
 *      return (
 *        <>
 *          <ErrorBoundary>
 *            <WorldMap />
 *          </ErrorBoundary>
 *          <ErrorBoundary>
 *            <ArtworkInfoBar />
 *          </ErrorBoundary>
 *        </>
 *      );
 *    }
 *
 * 3. Custom error messages per boundary:
 *
 *    <ErrorBoundary fallback="WorldMap">
 *      <WorldMap />
 *    </ErrorBoundary>
 *
 * When to use Error Boundaries:
 * ✅ Wrap third-party components that might error
 * ✅ Isolate major features (so one error doesn't crash entire app)
 * ✅ Provide graceful degradation for users
 *
 * What to use instead:
 * ❌ For API errors: Use try/catch in async functions
 * ❌ For event handlers: Use try/catch in onClick handlers
 * ❌ For promise rejections: Use .catch() or try/catch in async/await
 */
