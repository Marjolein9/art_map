/**
 * API service for backend communication
 */

const API_URL = 'http://localhost:5000/api';

/**
 * Fetch a random country that has artwork
 */
export const fetchRandomCountry = async () => {
  const response = await fetch(`${API_URL}/game/random-country`);
  const data = await response.json();
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
 * Check if the selected country matches the target
 * @param {string} selectedCountryIso - Selected country ISO3 code
 * @param {string} targetCountryIso - Target country ISO3 code
 */
export const checkAnswer = async (selectedCountryIso, targetCountryIso) => {
  const response = await fetch(`${API_URL}/game/check-answer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      selectedCountryIso,
      targetCountryIso
    })
  });
  const data = await response.json();
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
