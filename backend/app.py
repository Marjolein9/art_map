"""
Flask REST API for Art Map Quiz

INTERVIEW PREP: FLASK & REST API FUNDAMENTALS
==============================================

Flask is a lightweight Python web framework that handles HTTP requests and responses.

Key Interview Topics to Discuss:

1. REST API Principles:
   - RESTful design uses standard HTTP methods (GET, POST, PUT, DELETE)
   - Resources are accessed via URLs (/api/countries, /api/images/USA)
   - Stateless communication (each request contains all needed info)
   - Returns data in standard format (JSON)

2. Flask Architecture:
   - WSGI application (Web Server Gateway Interface)
   - Request/Response cycle: Client → WSGI Server → Flask → Your Code → Response
   - Decorator-based routing (@app.route)
   - Context-based design (request, session available globally)

3. Database Patterns:
   - Connection pooling for performance
   - Cursor pattern for query execution
   - Parameterized queries prevent SQL injection
   - Always close connections to prevent leaks

4. Performance Considerations:
   - Database queries in routes (consider caching for production)
   - Image serving (could use CDN in production)
   - CORS configuration (security vs accessibility)

Example Request Flow:
Browser → GET /api/countries → Flask Router → get_countries() → PostgreSQL →
JSON Response → Browser

Common Interview Questions:
Q: "Why use Flask over Django?"
A: Flask is lightweight and unopinionated. Django includes ORM, admin panel, etc.
   Flask gives more control, Django gives more built-in features.

Q: "How do you handle database connections?"
A: Use connection pooling, context managers, always close connections.
   We use psycopg2 with RealDictCursor for dict-like results.

Q: "What's CORS and why do we need it?"
A: Cross-Origin Resource Sharing. Browsers block requests between different origins
   (protocol + domain + port). CORS headers tell browser which cross-origin requests to allow.
"""

# Import Flask core components
# Flask: The main application class
# jsonify: Converts Python dicts to JSON responses (sets proper headers)
# request: Contains data from incoming HTTP requests (URL params, body, etc.)
# send_from_directory: Serves static files from a directory
from flask import Flask, jsonify, request, send_from_directory

# CORS (Cross-Origin Resource Sharing) - allows frontend to call backend
# Why needed? Browser security prevents requests between different origins.
# Frontend (localhost:3000) and Backend (localhost:5000) are different origins.
# CORS tells browser: "It's okay to allow these cross-origin requests"
from flask_cors import CORS

# Standard Python libraries
import random  # For selecting random country in quiz
import os  # For checking if database file exists

# Our custom modules (from other files in backend/)
from db_utils import execute_query, get_collection_counts  # Database utilities
from config import PORT, DEBUG  # Configuration constants
from error_handler import APIError, ValidationError, NotFoundError, InternalError, handle_api_error  # Standardized error handling

# Create Flask application instance
# __name__ tells Flask the name of the current module
# This helps Flask know where to look for resources (templates, static files)
app = Flask(__name__)

# Enable CORS for allowed origins
# In development: allows localhost:3000
# In production: allows only configured frontend URLs (Vercel)
# ALLOWED_ORIGINS is configured in config.py from environment variable
from config import ALLOWED_ORIGINS

CORS(app, origins=ALLOWED_ORIGINS)

# REFACTORING: Register error handler for standardized error responses
# This ensures all APIError exceptions are automatically converted to JSON responses
app.register_error_handler(APIError, handle_api_error)

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
      "countries": [{"iso3": "USA", "iso2": "US", "name": "United States", "m49": 840, ...}, ...],
      "count": 84
    }
    
    REFACTORING: This route now uses standardized error handling.
    Errors are automatically caught and converted to structured API responses.
    """
    try:
        # Execute query using utility function (automatically manages connection)
        # execute_query() handles: connect → execute → fetch → close
        countries = execute_query(
            'SELECT iso3, iso2, name, common_name, m49, continent, subregion, is_country FROM countries ORDER BY common_name'
        )

        # Return JSON response
        return jsonify({
            'countries': countries,
            'count': len(countries)
        })
    except Exception as e:
        # Catch any unexpected errors and convert to standardized format
        import traceback
        print(f"Error in get_countries: {str(e)}")
        print(traceback.format_exc())
        raise InternalError(
            'Failed to fetch countries',
            details={'endpoint': '/api/countries', 'error_type': type(e).__name__}
        )

@app.route('/api/game/random-country', methods=['GET'])
def random_country():
    """
    Return a random sovereign country (is_country = true).

    HTTP Method: GET
    URL: http://localhost:5000/api/game/random-country?region=Africa (optional)
    Purpose: Used by quiz game to select which country to show

    Query Parameters:
    - region (optional): Filter countries by continent (Africa, Americas, Asia, Europe, Oceania)

    Returns: JSON with one random country's details
    Example: {"country": {"iso": "JPN", "name": "Japan", ...}}

    HTTP Status Codes:
    - 200: Success
    - 404: Country not found (shouldn't happen)
    - 500: No countries available in database

    REFACTORING: Updated to use standardized error handling and support region filtering.
    """
    try:
        # Get optional region query parameter
        region = request.args.get('region')

        # List of territories to exclude from quiz mode
        excluded_territories = [
            'BES', 'BVT', 'CXR', 'CCK', 'GUF', 'GIB', 'GLP',
            'MTQ', 'MYT', 'REU', 'SJM', 'TKL', 'TUV', 'UMI'
        ]

        # Get all sovereign countries excluding small territories
        # Build dynamic query with correct number of placeholders
        placeholders = ', '.join(['%s'] * len(excluded_territories))

        # Build query parameters tuple
        query_params = list(excluded_territories)

        # Add optional region filter
        region_filter = ''
        if region:
            region_filter = 'AND continent = %s'
            query_params.append(region)

        countries = execute_query(f'''
            SELECT iso3, name, common_name, continent, subregion
            FROM countries
            WHERE is_country = TRUE
            AND iso3 NOT IN ({placeholders})
            {region_filter}
        ''', tuple(query_params))

        # Error handling: ensure countries exist
        if not countries:
            raise InternalError(
                'No countries available in database',
                details={'endpoint': '/api/game/random-country', 'excluded_count': len(excluded_territories)}
            )

        # Select one random country
        selected_country = random.choice(countries)

        return jsonify({
            'country': {
                'iso': selected_country['iso3'],
                'name': selected_country['name'],
                'common_name': selected_country['common_name'],
                'continent': selected_country['continent'],
                'subregion': selected_country['subregion']
            }
        })
    except APIError:
        raise
    except Exception as e:
        import traceback
        print(f"Error in random_country: {str(e)}")
        print(traceback.format_exc())
        raise InternalError(
            'Failed to get random country',
            details={'endpoint': '/api/game/random-country', 'error_type': type(e).__name__}
        )

@app.route('/api/images/<iso3>', methods=['GET'])
def get_images(iso3):
    """
    Get all images for a country from all collections.

    INTERVIEW TOPICS:
    ================

    1. RESTful URL Design:
       - Uses path parameter /<iso3> instead of query param ?iso3=USA
       - RESTful pattern: /resource/{identifier}
       - More semantic and cleaner than query strings

    2. Database Query Patterns:
       - Multiple queries vs. single JOIN query (we use multiple for simplicity)
       - Trade-off: More queries but simpler code and easier to debug
       - Alternative: Use JOIN or UNION ALL (more efficient but complex)

    3. SQL Injection Prevention:
       - ALWAYS use parameterized queries (%s placeholders)
       - NEVER use f-strings or string concatenation for SQL
       - psycopg2 automatically escapes parameters
       - Example: cursor.execute('WHERE iso3 = %s', (iso3,))

    4. Data Transformation:
       - Convert database rows to Python dicts
       - List comprehension: [dict(row) for row in cursor.fetchall()]
       - RealDictCursor returns dict-like objects, we convert to real dicts for JSON

    5. Performance Considerations:
       - Could cache results (country images rarely change)
       - Could use connection pooling (psycopg2.pool)
       - Could paginate results for countries with many images
       - Always close connections to prevent connection pool exhaustion

    HTTP Method: GET (idempotent - safe to call multiple times)
    URL: http://localhost:5000/api/images/USA
    URL Parameter: iso3 (required) - three-letter country code in URL path

    Returns: JSON with images grouped by collection type
    """
    # Query all collections using execute_query utility
    albert_kahn = execute_query('''
        SELECT 'Albert Kahn' as collection_type,
               filepath, title_en as title, location, date,
               operator, inventory_number, page_url, mission
        FROM albert_kahn_images
        WHERE iso3 = %s
    ''', (iso3,))

    children_art = execute_query('''
        SELECT 'Children in Art' as collection_type,
               filepath, title, artist_name,
               artist_nationality, author_wikilink, work_url, source
        FROM children_artwork_images
        WHERE artist_iso3 = %s
    ''', (iso3,))
    print(f"Children Art: {children_art}")  # Debug logging

    public_domain = execute_query('''
        SELECT 'Public Domain Review' as collection_type,
               filepath, title, country, source_link,
               source_url, description
        FROM public_domain_images
        WHERE iso3 = %s
    ''', (iso3,))

    met_museum = execute_query('''
        SELECT 'Met Museum' as collection_type,
               filepath, title, artist_name, object_date,
               medium, department, culture, object_url
        FROM met_images
        WHERE iso3 = %s
    ''', (iso3,))

    # Return JSON response
    return jsonify({
        'images': {
            'Albert Kahn': albert_kahn,
            'Children in Art': children_art,
            'Public Domain Review': public_domain,
            'Met Museum': met_museum
        },
        'total_count': len(albert_kahn) + len(children_art) + len(public_domain) + len(met_museum),
        'iso3': iso3
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


@app.route('/api/neighbors/<iso3>', methods=['GET'])
def get_neighbors(iso3):
    """
    Get neighboring countries for a specific country.

    HTTP Method: GET
    URL: http://localhost:5000/api/neighbors/USA
    Purpose: Used for quiz hints - show bordering countries

    Returns: JSON with list of neighboring countries including M49 codes
    Example: {"neighbors": [{"iso3": "CAN", "m49": 124, "name": "Canada"}, ...], "count": 2}
    """
    # Get all neighbors for this country with M49 codes
    neighbors = execute_query('''
        SELECT c.iso3, c.m49, c.name, c.common_name
        FROM country_borders cb
        JOIN countries c ON cb.neighbor_iso3 = c.iso3
        WHERE cb.country_iso3 = %s
        ORDER BY c.common_name
    ''', (iso3,))

    return jsonify({
        'country_iso3': iso3,
        'neighbors': neighbors,
        'count': len(neighbors)
    })

@app.route('/api/similar-islands/<iso3>', methods=['GET'])
def get_similar_islands(iso3):
    """
    Get countries from the same subregion for island hint purposes.

    HTTP Method: GET
    URL: http://localhost:5000/api/similar-islands/JPN
    Purpose: Used for quiz hints when target is an island - show 2 random countries from same subregion
    Priority: Other islands in same subregion > Any countries in same subregion

    Returns: JSON with list of 2 countries from the same subregion (preferring other islands)
    Example: {"islands": [{"iso3": "PHL", "m49": 608, "name": "Philippines"}, ...], "count": 2, "is_island": true}
    """
    # Check if the target country is an island (has no neighbors)
    neighbor_result = execute_query('''
        SELECT COUNT(*) as neighbor_count
        FROM country_borders
        WHERE country_iso3 = %s
    ''', (iso3,), fetch='one')

    is_island = neighbor_result['neighbor_count'] == 0

    if not is_island:
        return jsonify({
            'country_iso3': iso3,
            'is_island': False,
            'islands': [],
            'count': 0
        })

    # Get the target country's details
    target = execute_query('''
        SELECT iso3, name, common_name, m49, continent, subregion
        FROM countries
        WHERE iso3 = %s
    ''', (iso3,), fetch='one')

    if not target:
        return jsonify({'error': 'Country not found'}), 404

    # Find 2 random countries from the same subregion
    # Priority: other islands in same subregion > any countries in same subregion
    subregion_countries = execute_query('''
        SELECT c.iso3, c.m49, c.name, c.common_name,
               CASE
                   -- Check if it's an island (no neighbors)
                   WHEN (SELECT COUNT(*) FROM country_borders WHERE country_iso3 = c.iso3) = 0 THEN 1
                   ELSE 2
               END as priority
        FROM countries c
        WHERE c.iso3 != %s
        AND c.subregion = %s
        AND c.iso3 NOT IN ('ATA')  -- Exclude Antarctica
        ORDER BY priority, RANDOM()
        LIMIT 2
    ''', (iso3, target['subregion']))

    # Remove the priority field before returning
    for country in subregion_countries:
        country.pop('priority', None)

    return jsonify({
        'country_iso3': iso3,
        'is_island': True,
        'islands': subregion_countries,
        'count': len(subregion_countries),
        'target_subregion': target['subregion'],
        'target_continent': target['continent']
    })


@app.route('/api/child-mortality/<country_code>', methods=['GET'])
def get_child_mortality(country_code):
    """
    Get child mortality data for a specific country.

    HTTP Method: GET
    URL: http://localhost:5000/api/child-mortality/<country_code>

    Returns: JSON with 1989 and 2023 child mortality rates and the difference
    """
    # Get all mortality data for this country
    rows = execute_query('''
        SELECT year, mortality_rate
        FROM child_mortality
        WHERE country_code = %s
        ORDER BY year
    ''', (country_code,))

    if not rows:
        return jsonify({'error': f'No data found for country code: {country_code}'}), 404

    # Convert to dictionary
    mortality_data = {row['year']: row['mortality_rate'] for row in rows}

    # Find 1989 or next available year
    start_year = None
    start_rate = None
    for year in range(1989, 2024):
        if year in mortality_data:
            start_year = year
            start_rate = mortality_data[year]
            break

    # Get 2023 data
    end_year = 2023
    end_rate = mortality_data.get(2023)

    if start_rate is None or end_rate is None:
        return jsonify({'error': 'Insufficient data for comparison'}), 404

    # Calculate difference (keep precision for display)
    difference = end_rate - start_rate

    return jsonify({
        'country_code': country_code,
        'start_year': start_year,
        'start_rate': start_rate,
        'end_year': end_year,
        'end_rate': end_rate,
        'difference': difference,
        'candle_count': abs(difference)  # Preserve decimal for fractional candle rendering
    })


@app.route('/api/external-links/<iso3>', methods=['GET']) # todo combne wit othe pull
def get_external_links(iso3):
    """
    Get external links for a specific country.

    HTTP Method: GET
    URL: http://localhost:5000/api/external-links/<iso3>

    Returns: JSON with Gapminder, TasteAtlas, and extra links
    """
    row = execute_query('''
        SELECT gapminder_url, tasteatlas_url, extra_links
        FROM country_external_links
        WHERE iso3 = %s
    ''', (iso3,), fetch='one')

    if not row:
        return jsonify({'error': f'No links found for country: {iso3}'}), 404

    return jsonify({
        'iso3': iso3,
        'gapminder_url': row['gapminder_url'] or '',
        'tasteatlas_url': row['tasteatlas_url'] or '',
        'extra_links': row['extra_links'] or ''
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
    # Count total countries in database
    countries_result = execute_query('SELECT COUNT(*) as count FROM countries', fetch='one')
    countries_count = countries_result['count']

    # Get collection counts using utility function
    counts = get_collection_counts()

    # Return health information with breakdown by collection
    return jsonify({
        'status': 'healthy',
        'database': 'connected',
        'countries_count': countries_count,
        **counts  # Unpack all collection counts
    })


# ==============================================================================
# STATIC FILE SERVING
# ==============================================================================
# Serve images from the images directory
# This allows the frontend to load images via URLs like:
# http://localhost:5000/images/USA/albert_kahn/file.jpg

@app.route('/images/<path:filename>')
def serve_image(filename):
    """
    Serve static image files.

    HTTP Method: GET
    URL: http://localhost:5000/images/USA/albert_kahn/file.jpg
    Purpose: Serve image files from the backend/images directory

    The <path:filename> captures the entire path after /images/
    Example: /images/USA/albert_kahn/file.jpg → filename = 'USA/albert_kahn/file.jpg'

    send_from_directory() safely serves files from a directory
    - Prevents directory traversal attacks (e.g., /images/../../etc/passwd)
    - Sets proper Content-Type headers based on file extension
    - Handles caching headers for performance
    """
    # Get the absolute path to the images directory
    # os.path.dirname(__file__) gets the directory containing this file (backend/)
    # os.path.join() safely joins path components
    images_dir = os.path.join(os.path.dirname(__file__), 'images')

    # send_from_directory serves the file and handles all HTTP headers
    # Parameters:
    # - directory: Where to look for files
    # - path: Relative path to the file within that directory
    return send_from_directory(images_dir, filename)


# ==============================================================================
# SERVER STARTUP
# ==============================================================================
# This block runs when you execute: python3 app.py
# It won't run if you import this file as a module in another script

if __name__ == '__main__':
    # Display startup information: Show how much data is loaded
    # This helps verify database was initialized correctly
    countries_result = execute_query('SELECT COUNT(*) as count FROM countries', fetch='one')
    countries_count = countries_result['count']

    # Get collection counts using utility function
    counts = get_collection_counts()

    # Print startup message to console
    print(f"🖼️  Loaded {counts['total_images']} images ({counts['albert_kahn_count']} Albert Kahn, {counts['children_art_count']} Children Art, {counts['public_domain_count']} Public Domain)")
    print(f"🌍 {countries_count} countries in database")
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
