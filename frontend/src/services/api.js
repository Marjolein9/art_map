/**
 * API Service for Backend Communication
 *
 * This module centralizes all HTTP requests to the Flask backend.
 * Instead of writing fetch() calls throughout the app, we put them all here.
 *
 * JAVASCRIPT ASYNC/AWAIT FOR PYTHON DEVELOPERS
 * ============================================
 *
 * Python equivalent of async/await:
 *
 * JavaScript:
 *   async function fetchData() {
 *     const response = await fetch(url);
 *     const data = await response.json();
 *     return data;
 *   }
 *
 * Python (similar concept with asyncio):
 *   async def fetch_data():
 *       response = await fetch(url)
 *       data = await response.json()
 *       return data
 *
 * Key concepts:
 * - async: Marks function as asynchronous (returns Promise)
 * - await: Waits for Promise to resolve before continuing
 * - Promise: Like Python's Future - represents future value
 * - fetch(): Browser API for making HTTP requests
 *
 * Why async? Network requests take time. We don't want to block the UI while waiting.
 */

// Import centralized API configuration
import { API_URL_FULL as API_URL } from '../utils/apiConfig';

/**
 * REFACTORING: Core API Call Utility
 * 
 * This consolidates all fetch logic into a single function.
 * Previously: Each endpoint had duplicate fetch + error handling
 * Now: DRY principle - all requests go through apiCall()
 * 
 * Benefits:
 * - Single source of truth for error handling
 * - Easy to add logging, retry logic, interceptors
 * - Consistent error messages
 * 
 * @param {string} endpoint - The API endpoint (e.g., '/countries')
 * @param {object} options - fetch() options (method, headers, body, etc.)
 * @param {object} responseMapping - Maps response JSON to desired output
 * @returns {Promise} - Parsed and mapped response data
 */
const apiCall = async (endpoint, options = {}, responseMapping = null) => {
  try {
    // Make the HTTP request
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',  // Default to GET
      ...options      // Override with any provided options
    });

    // Check for HTTP errors (4xx, 5xx)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Parse JSON response
    const data = await response.json();

    // Apply response mapping if provided (e.g., extract nested field)
    // Example: responseMapping could be 'country' to extract data.country
    if (responseMapping && typeof responseMapping === 'string') {
      return data[responseMapping];
    }

    // If responseMapping is a function, use it for custom transformation
    if (responseMapping && typeof responseMapping === 'function') {
      return responseMapping(data);
    }

    // Return raw data if no mapping
    return data;
  } catch (error) {
    // Enhanced error logging for debugging
    console.error(`API Error [${endpoint}]:`, {
      message: error.message,
      endpoint,
      timestamp: new Date().toISOString()
    });

    // Re-throw error so calling code can handle it
    throw error;
  }
};

/**
 * Fetch a random country that has artwork.
 *
 * Python equivalent:
 *   import requests
 *   response = requests.get('http://localhost:5000/api/game/random-country')
 *   return response.json()['country']
 *
 * Returns: Country object with {iso, name, continent, subregion}
 */
export const fetchRandomCountry = async () => {
  // Using response mapping to extract just the 'country' field
  return apiCall('/game/random-country', {}, 'country');
};

/**
 * Fetch all countries with their regions
 */
export const fetchCountries = async () => {
  // Maps response.countries → returns just the array
  return apiCall('/countries', {}, 'countries');
};

/**
 * Fetch images for a specific country from all three collections
 * @param {string} iso3 - Country ISO3 code
 * @returns {object} - Images grouped by collection type
 */
export const fetchImages = async (iso3) => {
  return apiCall(`/images/${iso3}`, {}, 'images');
};

/**
 * Check if the selected country matches the target.
 *
 * This demonstrates a POST request (sending data to server).
 *
 * Python equivalent:
 *   import requests
 *   response = requests.post(
 *       'http://localhost:5000/api/game/check-answer',
 *       json={
 *           'selectedCountryIso': selected_iso,
 *           'targetCountryIso': target_iso
 *       }
 *   )
 *   return response.json()
 *
 * @param {string} selectedCountryIso - Selected country ISO3 code
 * @param {string} targetCountryIso - Target country ISO3 code
 * @returns {object} - {correct: boolean, selectedCountry: string, targetCountry: string}
 */
export const checkAnswer = async (selectedCountryIso, targetCountryIso) => {
  return apiCall('/game/check-answer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      selectedCountryIso,
      targetCountryIso
    })
  });
};

/**
 * Fetch neighboring countries for a given country
 * @param {string} iso3 - Country ISO3 code
 */
export const fetchNeighbors = async (iso3) => {
  return apiCall(`/neighbors/${iso3}`, {}, 'neighbors');
};

/**
 * Fetch similar islands for hint purposes (for island countries with no neighbors)
 * @param {string} iso3 - Country ISO3 code
 * @returns {object} - {is_island: boolean, islands: array, count: number}
 */
export const fetchSimilarIslands = async (iso3) => {
  return apiCall(`/similar-islands/${iso3}`);
};

/**
 * Fetch child mortality data for a specific country
 * @param {string} iso3 - Country ISO3 code
 * @returns {object} - {start_year, start_rate, end_year, end_rate, difference, candle_count}
 */
export const fetchChildMortality = async (iso3) => {
  return apiCall(`/child-mortality/${iso3}`);
};

/**
 * Fetch external links for a specific country
 * @param {string} iso3 - Country ISO3 code
 * @returns {object} - {gapminder_url, tasteatlas_url, extra_links}
 */
export const fetchExternalLinks = async (iso3) => {
  return apiCall(`/external-links/${iso3}`);
};
