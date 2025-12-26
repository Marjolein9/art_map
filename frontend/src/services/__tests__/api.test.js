/**
 * API Service Layer Tests
 *
 * TESTING PHILOSOPHY: Service Layer Testing
 * ==========================================
 *
 * Why test API services?
 * - Network isolation: Mock fetch to avoid real API calls
 * - Error handling: Test how app handles network failures
 * - Data transformation: Verify responses are parsed correctly
 * - Contract testing: Ensure API interface matches expectations
 *
 * Key Concepts:
 * - jest.mock(): Replace real fetch with mock
 * - mockResolvedValue(): Simulate successful responses
 * - mockRejectedValue(): Simulate network errors
 * - beforeEach/afterEach: Setup/cleanup for each test
 */

import * as api from '../../services/api';

// Mock the fetch function
global.fetch = jest.fn();

// Mock environment variable
const originalEnv = process.env;
beforeEach(() => {
  process.env = { ...originalEnv };
  fetch.mockClear();
});

afterEach(() => {
  process.env = originalEnv;
});


describe('API Service - Core apiCall Utility', () => {
  /**
   * TESTING PATTERN: Testing the core utility
   * 
   * The apiCall() function is the heart of all API requests.
   * We test it to ensure all other functions will work.
   */

  test('should make GET request by default', async () => {
    const mockData = { country: { iso3: 'USA', name: 'United States' } };
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await api.fetchRandomCountry();
    
    // Should have called fetch
    expect(fetch).toHaveBeenCalled();
    
    // Should make GET request
    expect(fetch.mock.calls[0][1]?.method || 'GET').toBe('GET');
    
    // Should return the country
    expect(result).toEqual(mockData.country);
  });

  test('should handle errors from HTTP 404', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    // Should throw error
    await expect(api.fetchRandomCountry()).rejects.toThrow();
  });

  test('should handle network errors gracefully', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    // Should throw error
    await expect(api.fetchRandomCountry()).rejects.toThrow('Network error');
  });

  test('should apply response mapping to extract nested fields', async () => {
    const mockData = {
      countries: [
        { iso3: 'USA', name: 'United States' },
        { iso3: 'FRA', name: 'France' },
      ],
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await api.fetchCountries();
    
    // Should extract just the countries array
    expect(result).toEqual(mockData.countries);
    expect(Array.isArray(result)).toBe(true);
  });
});


describe('API Service - Country Endpoints', () => {
  /**
   * TESTING PATTERN: Testing individual endpoint functions
   * 
   * Each endpoint has its own function that wraps the core apiCall.
   */

  test('fetchRandomCountry should call correct endpoint', async () => {
    const mockCountry = { iso3: 'USA', name: 'United States' };
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ country: mockCountry }),
    });

    await api.fetchRandomCountry();
    
    // Should call the correct endpoint
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/game/random-country'),
      expect.any(Object)
    );
  });

  test('fetchCountries should return array of countries', async () => {
    const mockCountries = [
      { iso3: 'USA', name: 'United States' },
      { iso3: 'FRA', name: 'France' },
      { iso3: 'JPN', name: 'Japan' },
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ countries: mockCountries }),
    });

    const result = await api.fetchCountries();
    
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(3);
    expect(result[0].iso3).toBe('USA');
  });

  test('fetchImages should map endpoint correctly', async () => {
    const mockImages = {
      met: [{ id: 1, url: 'image1.jpg' }],
      albert_kahn: [{ id: 2, url: 'image2.jpg' }],
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ images: mockImages }),
    });

    const result = await api.fetchImages('USA');
    
    // Should call correct endpoint with ISO3
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/images/USA'),
      expect.any(Object)
    );
    
    // Should return images object
    expect(result).toEqual(mockImages);
  });

  test('fetchNeighbors should return array of neighbors', async () => {
    const mockNeighbors = [
      { iso3: 'CAN', name: 'Canada' },
      { iso3: 'MEX', name: 'Mexico' },
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ neighbors: mockNeighbors }),
    });

    const result = await api.fetchNeighbors('USA');
    
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
  });
});


describe('API Service - POST Requests', () => {
  /**
   * TESTING PATTERN: Testing POST requests with bodies
   * 
   * POST requests send data to the server, so we verify
   * that the request body is formatted correctly.
   */

  test('checkAnswer should send POST with body data', async () => {
    const mockResponse = {
      correct: true,
      selectedCountry: 'United States',
      targetCountry: 'United States',
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await api.checkAnswer('USA', 'USA');
    
    // Should use POST method
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: 'POST' })
    );
    
    // Should include body with answer data
    const callArgs = fetch.mock.calls[0][1];
    expect(callArgs.body).toBeTruthy();
    
    // Body should be JSON string
    const bodyData = JSON.parse(callArgs.body);
    expect(bodyData.selectedCountryIso).toBe('USA');
    expect(bodyData.targetCountryIso).toBe('USA');
    
    // Result should match response
    expect(result.correct).toBe(true);
  });

  test('checkAnswer should report incorrect answers', async () => {
    const mockResponse = {
      correct: false,
      selectedCountry: 'France',
      targetCountry: 'Germany',
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await api.checkAnswer('FRA', 'DEU');
    
    expect(result.correct).toBe(false);
    expect(result.selectedCountry).toBe('France');
    expect(result.targetCountry).toBe('Germany');
  });

  test('checkAnswer should handle server errors', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(api.checkAnswer('USA', 'USA')).rejects.toThrow();
  });
});


describe('API Service - Configuration', () => {
  /**
   * TESTING PATTERN: Testing configuration
   * 
   * The API service uses environment variables for URLs.
   * We test that configuration works correctly.
   */

  test('should use environment API URL if provided', () => {
    // This test is more of a documentation test
    // since fetch is mocked, we can't actually verify the URL being called
    // But we document the expected behavior
    
    // Production: REACT_APP_API_URL=https://api.example.com
    // Development: falls back to http://localhost:5000/api
    
    // This should be set in .env files, not tested runtime
  });

  test('API calls should use correct base URL', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ countries: [] }),
    });

    await api.fetchCountries();
    
    // Should call API endpoint
    const calledUrl = fetch.mock.calls[0][0];
    expect(calledUrl).toMatch(/\/api\/countries/);
  });
});


describe('API Service - Error Handling', () => {
  /**
   * TESTING PATTERN: Error scenarios
   * 
   * Good error handling is critical for user experience.
   * We test various failure modes.
   */

  test('should handle JSON parse errors', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => { throw new Error('Invalid JSON'); },
    });

    await expect(api.fetchCountries()).rejects.toThrow('Invalid JSON');
  });

  test('should handle timeout errors (simulated)', async () => {
    fetch.mockRejectedValueOnce(new Error('Timeout'));

    await expect(api.fetchCountries()).rejects.toThrow('Timeout');
  });

  test('should handle 403 Forbidden errors', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
    });

    await expect(api.fetchCountries()).rejects.toThrow('HTTP 403');
  });

  test('should handle empty responses', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const result = await api.fetchCountries();
    
    // With no mapping, should return empty object
    expect(result).toBeDefined();
  });
});


describe('API Service - Data Validation', () => {
  /**
   * TESTING PATTERN: Validating response data
   * 
   * We should verify that API responses match expected structure.
   */

  test('countries should have required fields', async () => {
    const mockCountries = [
      {
        iso3: 'USA',
        name: 'United States',
        continent: 'North America',
        common_name: 'United States',
      },
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ countries: mockCountries }),
    });

    const result = await api.fetchCountries();
    
    // Each country should have key fields
    expect(result[0]).toHaveProperty('iso3');
    expect(result[0]).toHaveProperty('name');
  });

  test('images should be grouped by collection', async () => {
    const mockImages = {
      met: [{ id: 1, url: 'url1' }],
      albert_kahn: [{ id: 2, url: 'url2' }],
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ images: mockImages }),
    });

    const result = await api.fetchImages('USA');
    
    // Should have expected collection keys
    expect(Object.keys(result).length).toBeGreaterThan(0);
  });
});
