/**
 * Application-wide constants for timing, dimensions, and configuration
 */

/**
 * Timing constants for delays, timeouts, and animations (in milliseconds)
 */
export const TIMING = {
  /** Give React time to batch state updates */
  STATE_UPDATE_DELAY: 100,
  /** Time between backend reconnection attempts */
  BACKEND_RETRY_DELAY: 10000,
  /** Delay before triggering country click in explore mode */
  COUNTRY_CLICK_DELAY: 1000,
  /** Timeout for hints fetch operation */
  HINTS_TIMEOUT: 5000,
} as const;

/**
 * Image dimension constants (in pixels)
 */
export const IMAGE = {
  /** Minimum carousel height */
  MIN_HEIGHT: 150,
  /** Maximum carousel height */
  MAX_HEIGHT: 600,
  /** Warn if image is larger than this threshold */
  LARGE_IMAGE_THRESHOLD: 2000,
} as const;

/**
 * API and network-related constants
 */
export const API = {
  /** Maximum number of retry attempts for failed requests */
  MAX_RETRIES: 3,
  /** Base delay for exponential backoff (in ms) */
  RETRY_BASE_DELAY: 1000,
} as const;

/**
 * Type definitions for constants
 */
export type TimingKeys = keyof typeof TIMING;
export type ImageKeys = keyof typeof IMAGE;
export type ApiKeys = keyof typeof API;
