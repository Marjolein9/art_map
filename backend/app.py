"""
Flask REST API for Art Map Quiz

FLASK BASICS FOR BEGINNERS
===========================
Flask is a lightweight Python web framework that handles HTTP requests and responses.

Key Concepts:
- Routes: Map URLs to Python functions (e.g., /api/countries → get_countries())
- Decorators: @app.route() tells Flask which function handles which URL
- HTTP Methods: GET (retrieve data), POST (send data)
- JSON Responses: Convert Python dicts to JSON format for frontend

Example Flow:
Browser → GET /api/countries → Flask → get_countries() → Database → JSON → Browser
"""

# Import Flask core components
# Flask: The main application class
# jsonify: Converts Python dicts to JSON responses (sets proper headers)
# request: Contains data from incoming HTTP requests (URL params, body, etc.)
from flask import Flask, jsonify, request

# CORS (Cross-Origin Resource Sharing) - allows frontend to call backend
# Why needed? Browser security prevents requests between different origins.
# Frontend (localhost:3000) and Backend (localhost:5000) are different origins.
# CORS tells browser: "It's okay to allow these cross-origin requests"
from flask_cors import CORS

# Standard Python libraries
import random  # For selecting random country in quiz
import os  # For checking if database file exists

# Our custom modules (from other files in backend/)
from db_utils import get_db_connection  # Database connection helper
from config import DATABASE_PATH, PORT, DEBUG  # Configuration constants

# Create Flask application instance
# __name__ tells Flask the name of the current module
# This helps Flask know where to look for resources (templates, static files)
app = Flask(__name__)

# Enable CORS for all routes
# This allows the React frontend (port 3000) to make requests to this backend (port 5000)
# Without this, browser would block the requests due to Same-Origin Policy
CORS(app)

# ==============================================================================
# API ROUTES (Endpoints)
# ==============================================================================
# Each route is a function with @app.route() decorator
# Decorator syntax: @app.route(url_path, methods=[HTTP_methods])
# When someone visits the URL, Flask calls the decorated function

@app.route('/api/countries', methods=['GET'])
def get_countries():
    """
    Get all countries with their regions.

    HTTP Method: GET (retrieve data, no body needed)
    URL: http://localhost:5000/api/countries
    Returns: JSON with list of all countries

    Example response:
    {
      "countries": [{"iso3": "USA", "name": "United States", ...}, ...],
      "count": 84
    }
    """
    # Step 1: Connect to database
    # get_db_connection() returns a connection object
    conn = get_db_connection()

    # Step 2: Create cursor (think of it as a pointer that moves through results)
    # cursor.execute() runs SQL queries
    # cursor.fetchall() retrieves all results
    cursor = conn.cursor()

    # Step 3: Execute SQL query
    # SELECT: Get data from database
    # FROM countries: From the 'countries' table
    # ORDER BY name: Sort results alphabetically by country name
    cursor.execute('SELECT iso3, name, continent, subregion FROM countries ORDER BY name')

    # Step 4: Fetch results and convert to list of dicts
    # cursor.fetchall() returns list of Row objects
    # [dict(row) for row in ...] is a list comprehension that converts each Row to dict
    # Result: [{'iso3': 'USA', 'name': 'United States', ...}, ...]
    countries = [dict(row) for row in cursor.fetchall()]

    # Step 5: Close connection to free resources
    # Important! Always close database connections when done
    conn.close()

    # Step 6: Return JSON response
    # jsonify() converts Python dict → JSON string
    # Also sets Content-Type header to 'application/json'
    # Frontend receives this as JSON and can parse it
    return jsonify({
        'countries': countries,  # List of all country objects
        'count': len(countries)  # Total number of countries (helpful for frontend)
    })

@app.route('/api/game/random-country', methods=['GET'])
def random_country():
    """
    Return a random country that has artwork.

    HTTP Method: GET
    URL: http://localhost:5000/api/game/random-country
    Purpose: Used by quiz game to select which country to show

    Returns: JSON with one random country's details
    Example: {"country": {"iso": "JPN", "name": "Japan", ...}}

    HTTP Status Codes:
    - 200: Success
    - 404: Country not found (shouldn't happen)
    - 500: No countries available in database
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Get all unique country codes that have at least one artwork
    # SELECT DISTINCT: Get unique values only (no duplicates)
    # FROM artworks: Look in the artworks table
    # iso3 is the three-letter country code (USA, FRA, JPN, etc.)
    cursor.execute('SELECT DISTINCT iso3 FROM artworks')

    # Extract just the iso3 codes into a Python list
    # [row['iso3'] for row in ...] is list comprehension
    # Before: [{'iso3': 'USA'}, {'iso3': 'FRA'}, {'iso3': 'JPN'}]
    # After: ['USA', 'FRA', 'JPN']
    country_isos = [row['iso3'] for row in cursor.fetchall()]

    # Error handling: What if database is empty?
    # This shouldn't happen in production, but good to check
    if not country_isos:
        conn.close()
        # Return error response with HTTP status code 500 (Internal Server Error)
        # Format: (json_data, status_code)
        return jsonify({'error': 'No countries available'}), 500

    # Select one random country code from the list
    # random.choice() picks one random item from a list
    # Example: random.choice(['USA', 'FRA', 'JPN']) → 'FRA'
    selected_iso = random.choice(country_isos)

    # Now fetch full details for that country from the countries table
    # Why a second query? artworks table only has iso3, not full country details
    #
    # SQL INJECTION PREVENTION:
    # ? is a placeholder - prevents SQL injection attacks
    # NEVER do: f"WHERE iso3 = '{selected_iso}'" - DANGEROUS!
    # Always use: 'WHERE iso3 = ?' with tuple parameter
    # (selected_iso,) is a tuple with one element (comma makes it a tuple)
    cursor.execute('''
        SELECT iso3, name, continent, subregion
        FROM countries
        WHERE iso3 = ?
    ''', (selected_iso,))

    # fetchone() gets single result (vs fetchall() which gets all results)
    # Returns None if no match found
    country = cursor.fetchone()
    conn.close()

    # Safety check: Country should exist (we got iso3 from artworks table)
    # But database could be in inconsistent state, so check anyway
    if not country:
        return jsonify({'error': 'Country not found'}), 404

    # Return country details in nested structure
    # We create a nested dict so frontend gets: data.country.name
    # instead of: data.name (which would be confusing)
    return jsonify({
        'country': {
            'iso': country['iso3'],
            'name': country['name'],
            'continent': country['continent'],
            'subregion': country['subregion']
        }
    })

@app.route('/api/artworks', methods=['GET'])
def get_artworks():
    """
    Get artworks for a specific country.

    HTTP Method: GET
    URL: http://localhost:5000/api/artworks?iso3=USA
    URL Parameter: iso3 (required) - three-letter country code

    Example Request: GET /api/artworks?iso3=USA
    Returns: JSON with list of artworks for that country

    HTTP Status Codes:
    - 200: Success
    - 400: Bad Request (missing iso3 parameter)
    """
    # Extract URL parameter 'iso3' from query string
    # Query string is the part after ? in URL: /api/artworks?iso3=USA
    # request.args is a dict-like object containing all URL parameters
    # .get('iso3') retrieves the value, returns None if parameter doesn't exist
    # Example URL: /api/artworks?iso3=USA → iso3 = 'USA'
    iso3 = request.args.get('iso3')

    # INPUT VALIDATION: Check if required parameter was provided
    # Good practice to validate inputs before using them
    if not iso3:
        # Return error with HTTP 400 (Bad Request) status code
        # Client made a mistake - forgot required parameter
        return jsonify({'error': 'iso3 parameter required'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    # Query database for all artworks matching this country
    # We explicitly list all columns instead of SELECT *
    # Why? Makes it clear what data we're returning, better for documentation
    # WHERE iso3 = ? filters to only artworks from the specified country
    # ORDER BY type, id sorts results by type first, then artwork ID
    cursor.execute('''
        SELECT
            id, iso3, type, artist_name, country, work_title,
            work_url, image_path, source, tags, birth_date,
            death_date, birth_place, location_reason,
            author_background, more_info, public_domain, is_local
        FROM artworks
        WHERE iso3 = ?
        ORDER BY type, id
    ''', (iso3,))

    # Convert all database rows to list of dicts
    # This makes the data easy to work with in JavaScript
    artworks = [dict(row) for row in cursor.fetchall()]
    conn.close()

    # Return list of artworks with metadata
    return jsonify({
        'artworks': artworks,  # List of artwork objects
        'count': len(artworks),  # How many artworks found (0 if country has none)
        'iso3': iso3  # Echo back the requested country code
    })

@app.route('/api/game/check-answer', methods=['POST'])
def check_answer():
    """
    Check if the selected country matches the target.

    HTTP Method: POST (because we're sending data in request body)
    URL: http://localhost:5000/api/game/check-answer

    Request Body (JSON):
    {
      "selectedCountryIso": "FRA",
      "targetCountryIso": "FRA"
    }

    Why POST instead of GET?
    - GET is for retrieving data (no body)
    - POST is for sending data to server (with body)
    - We're sending answer data, so POST is semantically correct

    Returns: JSON with whether answer is correct
    {"correct": true, "selectedCountry": "FRA", "targetCountry": "FRA"}
    """
    # Get JSON data from request body
    # request.get_json() parses JSON string → Python dict
    # Example: '{"selectedCountryIso": "USA"}' → {'selectedCountryIso': 'USA'}
    # Frontend sends this in the body of the POST request
    data = request.get_json()

    # Extract values from the parsed JSON dict
    # .get() returns None if key doesn't exist (safer than data['key'])
    selected_iso = data.get('selectedCountryIso')
    target_iso = data.get('targetCountryIso')

    # Simple comparison: are they the same string?
    # == in Python compares values (not memory addresses like some languages)
    # Returns boolean: True or False
    correct = selected_iso == target_iso

    # Return result
    # Frontend can check: if (data.correct) { showSuccess(); }
    return jsonify({
        'correct': correct,  # Boolean: True or False
        'selectedCountry': selected_iso,  # Echo back what user selected
        'targetCountry': target_iso  # Echo back correct answer
    })


@app.route('/api/health', methods=['GET'])
def health():
    """
    Health check endpoint.

    HTTP Method: GET
    URL: http://localhost:5000/api/health

    Purpose:
    - Quick way to check if server is running
    - Verify database connection works
    - Get database statistics without querying all data
    - Monitoring systems can ping this endpoint

    Returns: Server and database status
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Count total countries in database
    # COUNT(*) returns number of rows in the table
    # 'as count' names the result column 'count' (instead of 'COUNT(*)')
    cursor.execute('SELECT COUNT(*) as count FROM countries')
    countries_count = cursor.fetchone()['count']

    # Count total artworks in database
    cursor.execute('SELECT COUNT(*) as count FROM artworks')
    artworks_count = cursor.fetchone()['count']

    conn.close()

    # Return health information
    # Frontend or monitoring tools can check this
    return jsonify({
        'status': 'healthy',  # Could be 'healthy' or 'unhealthy'
        'database': 'connected',  # Database connection successful
        'countries_count': countries_count,  # Total countries in DB
        'artworks_count': artworks_count  # Total artworks in DB
    })


# ==============================================================================
# SERVER STARTUP
# ==============================================================================
# This block runs when you execute: python3 app.py
# It won't run if you import this file as a module in another script

if __name__ == '__main__':
    # Pre-flight check: Make sure database exists before starting server
    # Database should be created by running: python3 init_database.py
    if not os.path.exists(DATABASE_PATH):
        print("❌ Database not found! Please run: python3 init_database.py")
        exit(1)  # Exit with error code 1 (non-zero = error)

    # Display startup information: Show how much data is loaded
    # This helps verify database was initialized correctly
    conn = get_db_connection()
    cursor = conn.cursor()

    # Get total counts
    cursor.execute('SELECT COUNT(*) FROM countries')
    countries_count = cursor.fetchone()[0]  # [0] gets first column value

    cursor.execute('SELECT COUNT(*) FROM artworks')
    artworks_count = cursor.fetchone()[0]

    conn.close()

    # Print startup message to console
    # f-string: f"text {variable}" embeds variable values in string
    print(f"🎨 Loaded {artworks_count} artworks from {countries_count} countries")
    print(f"🚀 Starting server on http://localhost:{PORT}")

    # Start Flask development server
    # This starts a web server that listens for HTTP requests
    #
    # Parameters:
    # - debug=DEBUG: Enable debug mode (auto-reload, detailed errors)
    # - port=PORT: Which port to listen on (default 5000)
    #
    # Server runs until you press Ctrl+C
    # Each request is logged to console
    #
    # IMPORTANT: This is a DEVELOPMENT server
    # For production, use a proper WSGI server like Gunicorn or uWSGI
    app.run(debug=DEBUG, port=PORT)
