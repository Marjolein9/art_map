/**
 * API Service for Backend Communication
 *
 * MODULE PURPOSE:
 * This module centralizes all HTTP requests to the Flask backend.
 * Instead of writing fetch() calls throughout the app, we put them all here.
 * This is a common pattern called "service layer" or "API layer".
 *
 * JAVASCRIPT ASYNC/AWAIT FOR BEGINNERS:
 * =======================================
 *
 * ASYNCHRONOUS PROGRAMMING:
 * - Synchronous: Code runs line by line, waiting for each line to finish
 * - Asynchronous: Code can start tasks and continue without waiting
 * - Example: Ordering at a restaurant - you don't stand at the counter waiting,
 *   you get a number and sit down while they prepare your food
 *
 * PROMISES:
 * - A Promise represents a value that will be available in the future
 * - Like a receipt for your restaurant order - it's a promise of food to come
 * - States: pending (cooking), fulfilled (here's your food), rejected (we're out of that)
 *
 * ASYNC/AWAIT:
 * - async: Declares a function that returns a Promise
 * - await: Pauses execution until a Promise resolves (gets its value)
 * - Makes async code look like synchronous code (easier to read)
 *
 * Example without await (callback hell):
 *   fetch(url)
 *     .then(response => response.json())
 *     .then(data => console.log(data))
 *     .catch(error => console.error(error));
 *
 * Same example with await (cleaner):
 *   const response = await fetch(url);
 *   const data = await response.json();
 *   console.log(data);
 *
 * Python comparison (for Python developers):
 *   JavaScript:  const data = await fetch(url);
 *   Python:      data = await fetch(url)  # with asyncio
 *
 * HTTP REQUESTS:
 * - fetch(): Browser API for making network requests
 * - GET: Retrieve data (like reading a file)
 * - POST: Send data (like writing to a file)
 * - Response: What the server sends back
 */

// Import centralized API configuration
import { API_URL_FULL as API_URL } from '../utils/apiConfig';
// Import with alias: "import { X as Y }" - imports X but names it Y locally
// This is called "named import with aliasing"

// Import logger utility
import { error as logError } from '../utils/logger';

/**
 * @typedef {Object} Country
 * @property {string} iso3 - ISO 3166-1 alpha-3 country code
 * @property {string} name - Country name
 * @property {string} continent - Continent name
 * @property {string} subregion - Geographic subregion
 * @property {string} [wikipedia_url] - Wikipedia URL for the country
 */

/**
 * @typedef {Object} Image
 * @property {string} filepath - Path to the image file
 * @property {string} [title] - Image title
 * @property {string} [description] - Image description
 * @property {string} [source] - Image source attribution
 * @property {string} [year] - Year the image was created
 * @property {boolean} [has_nudity] - Whether the image contains nudity
 */

/**
 * @typedef {Object} ImageCollection
 * @property {Image[]} [albert_kahn_images] - Images from Albert Kahn collection
 * @property {Image[]} [children_artwork_images] - Images from Children in Art collection
 * @property {Image[]} [met_images] - Images from Metropolitan Museum
 * @property {Image[]} [public_domain_images] - Images from Public Domain Review
 */

/**
 * CORE API CALL UTILITY
 *
 * DRY PRINCIPLE (Don't Repeat Yourself):
 * Instead of writing the same fetch code in every API function, we centralize it here.
 * This makes code easier to maintain - fix bugs in one place, add features once.
 *
 * FUNCTION PARAMETERS:
 * @param {string} endpoint - The API path (e.g., '/countries', '/images/USA')
 * @param {object} options - Additional fetch() options (method, headers, body, etc.)
 *                           Default: {} (empty object) if not provided
 * @param {string|function|null} responseMapping - How to transform the response
 *                                                  - string: Extract that property from response
 *                                                  - function: Custom transformation
 *                                                  - null: Return response as-is
 * @returns {Promise} - Resolves to the API response data
 */
const apiCall = async (endpoint, options = {}, responseMapping = null) => {
  // async keyword: Makes this function return a Promise
  // Arrow function with default parameters: (param = defaultValue) sets default if undefined

  try {
    /**
     * TRY/CATCH ERROR HANDLING:
     * - try block: Code that might throw an error
     * - catch block: Handles errors if they occur
     * - Similar to Python's try/except
     */

    // Make the HTTP request
    // await: Pauses here until fetch() completes and returns the response
    const response = await fetch(`${API_URL}${endpoint}`, {
      /**
       * TEMPLATE LITERALS (backticks):
       * `${variable}` embeds variables in strings
       * Example: `Hello ${name}!` with name="Alice" becomes "Hello Alice!"
       * More powerful than string concatenation: API_URL + endpoint
       */

      method: 'GET',  // HTTP method: GET retrieves data (default)

      ...options
      /**
       * SPREAD OPERATOR (...):
       * Spreads/expands object properties into another object
       * Example:
       *   options = { method: 'POST', headers: {...} }
       *   { method: 'GET', ...options }  // method becomes 'POST' (overridden)
       *
       * Later properties override earlier ones
       * This lets us set defaults (method: 'GET') then override with options
       */
    });

    /**
     * ERROR CHECKING:
     * response.ok is true if HTTP status is 200-299 (success)
     * false for 4xx (client errors) or 5xx (server errors)
     */
    if (!response.ok) {
      // throw: Creates and throws an Error
      // This jumps immediately to the catch block
      // Error object: Built-in JavaScript class for representing errors
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      // response.status: HTTP status code (e.g., 404, 500)
      // response.statusText: Human-readable message (e.g., "Not Found")
    }

    // Parse JSON response
    // await: Pause until response.json() extracts and parses the JSON data
    // JSON.parse() is called internally to convert JSON string to JavaScript object
    const data = await response.json();

    /**
     * RESPONSE MAPPING: Transform data before returning
     *
     * This provides flexibility in how we extract data from responses
     */

    // typeof: Operator that returns the type of a value
    // Possible types: 'string', 'number', 'boolean', 'object', 'function', 'undefined', 'symbol'
    if (responseMapping && typeof responseMapping === 'string') {
      // String mapping: Extract a specific property
      // Example: data = {country: {...}}, responseMapping = 'country'
      // Returns: data['country'] (bracket notation for property access)
      return data[responseMapping];
    }

    if (responseMapping && typeof responseMapping === 'function') {
      // Function mapping: Apply custom transformation
      // Call the function with data as argument
      return responseMapping(data);
    }

    // No mapping: return raw data
    return data;

  } catch (error) {
    /**
     * CATCH BLOCK:
     * Executes if any error occurs in the try block
     * error parameter: The Error object that was thrown
     */

    // Enhanced error logging for debugging
    logError(`API Error [${endpoint}]:`, {
      // logError: Environment-aware error logging (always logs errors even in production)

      message: error.message,  // Error message text
      endpoint,                // Which API endpoint failed
      /**
       * OBJECT PROPERTY SHORTHAND:
       * { endpoint } is shorthand for { endpoint: endpoint }
       * When key and value have the same name, you can write it once
       */

      timestamp: new Date().toISOString()
      /**
       * Date object: Represents a point in time
       * new Date(): Creates Date object for current time
       * .toISOString(): Converts to standardized string format
       * Example: "2025-01-15T10:30:00.000Z"
       */
    });

    // Re-throw error so calling code can handle it
    // throw without 'new Error()': Throws the existing error object
    // This lets the calling function catch and handle the error
    throw error;
  }
};

/**
 * API ENDPOINT FUNCTIONS
 *
 * These are the public API of this module - what other files import and use.
 * Each function wraps apiCall() with specific endpoint and parameters.
 *
 * EXPORT:
 * - export: Makes function available to other files
 * - export const: Exports a constant (function that can't be reassigned)
 * - Other files use: import { fetchRandomCountry } from './api'
 */

/**
 * Fetch a random country that has artwork
 *
 * ENDPOINT: GET /game/random-country?region=Africa&countriesOnly=true&requireChildrenArtwork=true
 *
 * @param {string|null} region - Optional region filter (Africa, Americas, Asia, Europe, Oceania)
 * @param {boolean} [countriesOnly=true] - Only include sovereign countries
 * @param {boolean} [requireChildrenArtwork=false] - Only include countries with children artwork
 * @returns {Promise<{iso3: string, name: string, continent: string, subregion: string}>} Country object
 *
 * @example
 * const country = await fetchRandomCountry('Europe', true, true);
 * // Returns: { iso3: 'ITA', name: 'Italy', continent: 'Europe', subregion: 'Southern Europe' }
 *
 * Python equivalent using requests library:
 *   import requests
 *   response = requests.get('http://localhost:5000/api/game/random-country?region=Africa&countriesOnly=true&requireChildrenArtwork=true')
 *   return response.json()['country']
 */
export const fetchRandomCountry = async (region = null, countriesOnly = false, requireChildrenArtwork = false) => {
  // Arrow function with optional parameters
  // async makes it return a Promise

  // Build endpoint with optional query parameters
  const params = new URLSearchParams();
  if (region) {
    params.append('region', region);
  }
  params.append('countriesOnly', countriesOnly.toString());
  params.append('requireChildrenArtwork', requireChildrenArtwork.toString());

  const endpoint = `/game/random-country?${params.toString()}`;

  // Using response mapping to extract just the 'country' field from response
  // If backend returns {country: {...}, other: ...}, we get just the country object
  return apiCall(endpoint, {}, 'country');
};

/**
 * Fetch all countries with their regions
 *
 * ENDPOINT: GET /countries
 *
 * @param {Object} [options={}] - Optional fetch options (e.g., signal for AbortController)
 * @param {AbortSignal} [options.signal] - AbortSignal for cancelling the request
 * @returns {Promise<Array<{iso3: string, name: string, continent: string, subregion: string}>>} Array of country objects
 *
 * @example
 * const controller = new AbortController();
 * const countries = await fetchCountries({ signal: controller.signal });
 * // Returns: [{ iso3: 'USA', name: 'United States', ... }, ...]
 */
export const fetchCountries = async (options = {}) => {
  // Maps response.countries → returns just the array of countries
  return apiCall('/countries', options, 'countries');
};

/**
 * Fetch images for a specific country from all collections
 *
 * ENDPOINT: GET /images/{iso3}?showNudity=true
 *
 * @param {string} iso3 - Country ISO3 code (e.g., "USA", "DEU", "JPN")
 * @param {boolean} [showNudity=false] - Include images with nudity
 * @returns {Promise<ImageCollection>} Images grouped by collection type
 *
 * @example
 * const images = await fetchImages('ITA', false);
 * // Returns: { albert_kahn_images: [...], met_images: [...], ... }
 */
export const fetchImages = async (iso3, showNudity = false) => {
  // Template literal in endpoint: `/images/${iso3}`
  // Example: iso3="USA" → endpoint becomes "/images/USA"
  const endpoint = `/images/${iso3}?showNudity=${showNudity}`;
  return apiCall(endpoint, {}, 'images');
};

/**
 * Fetch one random image for a specific country
 *
 * ENDPOINT: GET /images/{iso3}/random?showNudity=true
 *
 * This is optimized for quiz mode - only fetches one image instead of all images.
 * Significantly improves performance for countries with many images (like Italy).
 *
 * @param {string} iso3 - Country ISO3 code (e.g., "USA", "DEU", "JPN")
 * @param {boolean} [showNudity=false] - Include images with nudity
 * @returns {Promise<{image: Image, collection: string}>} Single random image with its collection
 *
 * @example
 * const result = await fetchRandomImage('FRA', false);
 * // Returns: { image: { filepath: '...', title: '...' }, collection: 'Albert Kahn' }
 */
export const fetchRandomImage = async (iso3, showNudity = false) => {
  const endpoint = `/images/${iso3}/random?showNudity=${showNudity}`;
  return apiCall(endpoint);
};

/**
 * Check if the selected country matches the target
 *
 * This demonstrates a POST request (sending data to server).
 *
 * ENDPOINT: POST /game/check-answer
 * BODY: {selectedCountryIso: string, targetCountryIso: string}
 *
 * HTTP METHODS:
 * - GET: Retrieve data (no body, parameters in URL)
 * - POST: Send data (data in body, not visible in URL)
 * - PUT: Update existing resource
 * - DELETE: Remove resource
 *
 * @param {string} selectedCountryIso - The country the user clicked
 * @param {string} targetCountryIso - The correct answer
 * @returns {Promise<{correct: boolean, selectedCountry: string, targetCountry: string}>} Result of the answer check
 *
 * @example
 * const result = await checkAnswer('ITA', 'FRA');
 * // Returns: { correct: false, selectedCountry: 'Italy', targetCountry: 'France' }
 *
 * Python equivalent using requests library:
 *   import requests
 *   response = requests.post(
 *       'http://localhost:5000/api/game/check-answer',
 *       json={'selectedCountryIso': selected_iso, 'targetCountryIso': target_iso}
 *   )
 *   return response.json()
 */
export const checkAnswer = async (selectedCountryIso, targetCountryIso) => {
  return apiCall('/game/check-answer', {
    // Options object: Configures the fetch request

    method: 'POST',
    // POST: We're sending data to the server

    headers: {
      /**
       * HEADERS: Metadata about the request
       * Content-Type: Tells server what format we're sending
       * application/json: The body contains JSON data
       */
      'Content-Type': 'application/json',
    },

    body: JSON.stringify({
      /**
       * JSON.stringify():
       * Converts JavaScript object to JSON string
       * Example: {name: "Alice"} → '{"name":"Alice"}'
       *
       * Why? fetch() body must be a string, not an object
       * The server parses this JSON string back into data
       */

      selectedCountryIso,
      targetCountryIso
      /**
       * Object property shorthand again:
       * { selectedCountryIso } is short for { selectedCountryIso: selectedCountryIso }
       *
       * Full form would be:
       * {
       *   selectedCountryIso: selectedCountryIso,
       *   targetCountryIso: targetCountryIso
       * }
       */
    })
  });
};

/**
 * Fetch neighboring countries for a given country
 *
 * ENDPOINT: GET /neighbors/{iso3}
 *
 * Used for the hints system to highlight nearby countries.
 *
 * @param {string} iso3 - Country ISO3 code
 * @returns {Promise<Array>} - Array of neighboring country objects
 */
export const fetchNeighbors = async (iso3) => {
  return apiCall(`/neighbors/${iso3}`, {}, 'neighbors');
};

/**
 * Fetch similar islands for hint purposes
 *
 * ENDPOINT: GET /similar-islands/{iso3}
 *
 * For island countries with no land neighbors, this returns other islands
 * in the same ocean/region to use as hints.
 *
 * @param {string} iso3 - Country ISO3 code
 * @returns {Promise<object>} - {is_island: boolean, islands: Array, count: number}
 */
export const fetchSimilarIslands = async (iso3) => {
  // No response mapping: returns the full response object
  return apiCall(`/similar-islands/${iso3}`);
};

/**
 * MODULE SUMMARY:
 *
 * This file exports 6 functions that make HTTP requests to the backend:
 * 1. fetchRandomCountry() - Get random country for quiz
 * 2. fetchCountries() - Get all countries
 * 3. fetchImages() - Get artwork images for a country
 * 4. checkAnswer() - Verify quiz answer
 * 5. fetchNeighbors() - Get neighboring countries for hints
 * 6. fetchSimilarIslands() - Get similar islands for hints
 *
 * All use the centralized apiCall() function for consistent error handling.
 */
