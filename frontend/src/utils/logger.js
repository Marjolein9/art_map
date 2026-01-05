/**
 * Logger Utility
 *
 * Provides environment-aware logging that only outputs in development mode.
 * This prevents debug logs from cluttering production console while maintaining
 * debugging capability during development.
 *
 * Usage:
 *   import { debug, info, warn, error } from '../utils/logger';
 *
 *   debug('Detailed debug information');
 *   info('General information');
 *   warn('Warning message');
 *   error('Error message');
 */

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Log debug information (only in development)
 */
export const debug = (...args) => {
  if (isDevelopment) {
    console.log(...args);
  }
};

/**
 * Log informational messages (only in development)
 */
export const info = (...args) => {
  if (isDevelopment) {
    console.info(...args);
  }
};

/**
 * Log warning messages (only in development)
 */
export const warn = (...args) => {
  if (isDevelopment) {
    console.warn(...args);
  }
};

/**
 * Log error messages (always logged, even in production)
 * Errors are important enough to always track
 */
export const error = (...args) => {
  console.error(...args);
};

// Export a flag for conditional logic if needed
export { isDevelopment };
