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

// Backend API base URL
// All endpoints start with this URL
const API_URL = 'http://localhost:5000/api';

/**
 * Fetch a random country that has artwork.
 *
 * Python equivalent:
 *   import requests
 *   response = requests.get('http://localhost:5000/api/game/random-country')
 *   data = response.json()
 *   return data['country']
 *
 * Returns: Country object with {iso, name, continent, subregion}
 */
export const fetchRandomCountry = async () => {
  // fetch() makes HTTP GET request to the URL
  // Returns a Promise that resolves to a Response object
  // await pauses execution until Promise resolves
  const response = await fetch(`${API_URL}/game/random-country`);

  // .json() parses the JSON response body
  // Also returns a Promise, so we await it
  // Python equivalent: response.json()
  const data = await response.json();

  // Return just the country object (not the whole response)
  // Backend sends: {country: {...}}
  // We return: {...}
  return data.country;
};

/**
 * Fetch all countries with their regions
 */
export const fetchCountries = async () => {
  const response = await fetch(`${API_URL}/countries`);
  const data = await response.json();
  return data.countries;
};

/**
 * Fetch artworks for a specific country
 * @param {string} iso3 - Country ISO3 code
 */
export const fetchArtworks = async (iso3) => {
  const response = await fetch(`${API_URL}/artworks?iso3=${iso3}`);
  const data = await response.json();
  return data.artworks;
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
  // POST request with body (unlike GET which has no body)
  const response = await fetch(`${API_URL}/game/check-answer`, {
    method: 'POST',  // HTTP method (GET, POST, PUT, DELETE, etc.)

    // Headers tell server what kind of data we're sending
    // 'Content-Type': 'application/json' means we're sending JSON
    headers: {
      'Content-Type': 'application/json',
    },

    // Body contains the data we're sending
    // JSON.stringify() converts JavaScript object → JSON string
    // Python equivalent: json.dumps(data)
    //
    // Shorthand property names:
    // {selectedCountryIso, targetCountryIso} is same as
    // {selectedCountryIso: selectedCountryIso, targetCountryIso: targetCountryIso}
    body: JSON.stringify({
      selectedCountryIso,
      targetCountryIso
    })
  });

  // Parse JSON response
  const data = await response.json();

  // Return entire response object
  // Contains: {correct: true/false, selectedCountry: ..., targetCountry: ...}
  return data;
};

/**
 * Health check endpoint
 */
export const checkHealth = async () => {
  const response = await fetch(`${API_URL}/health`);
  const data = await response.json();
  return data;
};
