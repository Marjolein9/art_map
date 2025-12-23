/**
 * API Configuration - Single Source of Truth
 *
 * Centralized API URL configuration used throughout the application.
 * This eliminates duplication and makes it easy to change API endpoints.
 */

// Get API URL from environment variable or use default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// API base URL (without /api suffix) - used for image serving
export const API_BASE = API_URL.replace('/api', '');

// Full API URL (with /api suffix) - used for API calls
export const API_URL_FULL = API_URL;

export default {
  API_BASE,
  API_URL: API_URL_FULL,
};
