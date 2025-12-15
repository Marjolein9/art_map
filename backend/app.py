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
from io import BytesIO  # For serving images from memory

# Image processing
from PIL import Image

# Our custom modules (from other files in backend/)
from db_utils import get_db_connection  # Database connection helper
from config import PORT, DEBUG  # Configuration constants

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
    # ORDER BY common_name: Sort results alphabetically by common country name
    cursor.execute('SELECT iso3, iso2, name, common_name, m49, continent, subregion, is_country FROM countries ORDER BY common_name')

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

    # Get all unique country codes that have at least one image from any collection
    # SELECT DISTINCT: Get unique values only (no duplicates)
    # UNION combines results from all three image tables
    cursor.execute('''
        SELECT DISTINCT alpha3 as iso3 FROM albert_kahn_images
        UNION
        SELECT DISTINCT alpha3 as iso3 FROM children_artwork_images
        UNION
        SELECT DISTINCT alpha3 as iso3 FROM public_domain_images
    ''')

    # Extract just the iso3 codes into a Python list
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
    # Always use: 'WHERE iso3 = %s' with tuple parameter
    # (selected_iso,) is a tuple with one element (comma makes it a tuple)
    cursor.execute('''
        SELECT iso3, name, common_name, continent, subregion
        FROM countries
        WHERE iso3 = %s
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
            'common_name': country['common_name'],
            'continent': country['continent'],
            'subregion': country['subregion']
        }
    })

@app.route('/api/images/<alpha3>', methods=['GET'])
def get_images(alpha3):
    """
    Get all images for a country from all three collections.

    HTTP Method: GET
    URL: http://localhost:5000/api/images/USA
    URL Parameter: alpha3 (required) - three-letter country code in URL path

    Example Request: GET /api/images/USA
    Returns: JSON with images grouped by collection type

    HTTP Status Codes:
    - 200: Success
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Query Albert Kahn images
    cursor.execute('''
        SELECT 'Albert Kahn' as collection_type,
               filepath, title_en as title, location, date,
               operator, inventory_number, page_url
        FROM albert_kahn_images
        WHERE alpha3 = %s
    ''', (alpha3,))
    albert_kahn = [dict(row) for row in cursor.fetchall()]

    # Query Children Artwork images
    cursor.execute('''
        SELECT 'Children in Art' as collection_type,
               filepath, title, artist_name,
               artist_nationality, author_wikilink, work_url
        FROM children_artwork_images
        WHERE alpha3 = %s
    ''', (alpha3,))
    children_art = [dict(row) for row in cursor.fetchall()]

    # Query Public Domain images
    cursor.execute('''
        SELECT 'Public Domain Review' as collection_type,
               filepath, title, country, source_link,
               source_url, description
        FROM public_domain_images
        WHERE alpha3 = %s
    ''', (alpha3,))
    public_domain = [dict(row) for row in cursor.fetchall()]

    # Query Met Museum images
    cursor.execute('''
        SELECT 'Met Museum' as collection_type,
               filepath, title, artist_name, object_date,
               medium, department, culture, object_url
        FROM met_images
        WHERE alpha3 = %s
    ''', (alpha3,))
    met_museum = [dict(row) for row in cursor.fetchall()]

    conn.close()

    return jsonify({
        'images': {
            'Albert Kahn': albert_kahn,
            'Children in Art': children_art,
            'Public Domain Review': public_domain,
            'Met Museum': met_museum
        },
        'total_count': len(albert_kahn) + len(children_art) + len(public_domain) + len(met_museum),
        'alpha3': alpha3
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
    conn = get_db_connection()
    cursor = conn.cursor()

    # Get all neighbors for this country with M49 codes
    cursor.execute('''
        SELECT c.iso3, c.m49, c.name, c.common_name
        FROM country_borders cb
        JOIN countries c ON cb.neighbor_iso3 = c.iso3
        WHERE cb.country_iso3 = %s
        ORDER BY c.common_name
    ''', (iso3,))

    neighbors = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return jsonify({
        'country_iso3': iso3,
        'neighbors': neighbors,
        'count': len(neighbors)
    })

@app.route('/api/similar-islands/<iso3>', methods=['GET'])
def get_similar_islands(iso3):
    """
    Get similar island countries for hint purposes.

    HTTP Method: GET
    URL: http://localhost:5000/api/similar-islands/JPN
    Purpose: Used for quiz hints when target is an island - show other islands

    Returns: JSON with list of similar island countries (preferably same subregion/continent)
    Example: {"islands": [{"iso3": "PHL", "m49": 608, "name": "Philippines"}, ...], "count": 2, "is_island": true}
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if the target country is an island (has no neighbors)
    cursor.execute('''
        SELECT COUNT(*) as neighbor_count
        FROM country_borders
        WHERE country_iso3 = %s
    ''', (iso3,))

    neighbor_count = cursor.fetchone()['neighbor_count']
    is_island = neighbor_count == 0

    if not is_island:
        conn.close()
        return jsonify({
            'country_iso3': iso3,
            'is_island': False,
            'islands': [],
            'count': 0
        })

    # Get the target country's details
    cursor.execute('''
        SELECT iso3, name, common_name, m49, continent, subregion
        FROM countries
        WHERE iso3 = %s
    ''', (iso3,))

    target = cursor.fetchone()
    if not target:
        conn.close()
        return jsonify({'error': 'Country not found'}), 404

    # Find other islands (countries with no neighbors) excluding the target
    # Priority: same subregion > same continent > any other islands
    # Also check if they have images in any collection
    cursor.execute('''
        SELECT DISTINCT c.iso3, c.m49, c.name, c.common_name, c.continent, c.subregion,
               CASE
                   WHEN c.subregion = %s THEN 1
                   WHEN c.continent = %s THEN 2
                   ELSE 3
               END as priority
        FROM countries c
        LEFT JOIN country_borders cb ON c.iso3 = cb.country_iso3
        WHERE c.iso3 != %s
        AND c.iso3 NOT IN ('ATA')  -- Exclude Antarctica
        GROUP BY c.iso3
        HAVING COUNT(cb.neighbor_iso3) = 0
        ORDER BY priority, RANDOM()
        LIMIT 2
    ''', (target['subregion'], target['continent'], iso3))

    islands = [dict(row) for row in cursor.fetchall()]

    # Remove the priority field before returning
    for island in islands:
        island.pop('priority', None)
        island.pop('continent', None)
        island.pop('subregion', None)

    conn.close()

    return jsonify({
        'country_iso3': iso3,
        'is_island': True,
        'islands': islands,
        'count': len(islands),
        'target_subregion': target['subregion'],
        'target_continent': target['continent']
    })

@app.route('/api/countries/empty', methods=['GET'])
def get_empty_countries():
    """
    Get list of countries with no images.

    HTTP Method: GET
    URL: http://localhost:5000/api/countries/empty
    Purpose: Return list of country ISO3 codes that have no images

    Returns: JSON with list of empty country ISO3 codes
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Get all countries
    cursor.execute('SELECT iso3 FROM countries')
    all_countries = {row['iso3'] for row in cursor.fetchall()}

    # Get countries that have at least one image
    cursor.execute('''
        SELECT DISTINCT alpha3 FROM albert_kahn_images
        UNION
        SELECT DISTINCT alpha3 FROM children_artwork_images
        UNION
        SELECT DISTINCT alpha3 FROM public_domain_images
    ''')
    countries_with_images = {row[0] for row in cursor.fetchall()}

    conn.close()

    # Find countries without any images
    empty_countries = sorted(all_countries - countries_with_images)

    return jsonify({
        'empty_countries': empty_countries,
        'count': len(empty_countries)
    })


@app.route('/api/child-mortality/<country_code>', methods=['GET'])
def get_child_mortality(country_code):
    """
    Get child mortality data for a specific country.

    HTTP Method: GET
    URL: http://localhost:5000/api/child-mortality/<country_code>

    Returns: JSON with 1989 and 2023 child mortality rates and the difference
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Get all mortality data for this country
    cursor.execute('''
        SELECT year, mortality_rate
        FROM child_mortality
        WHERE country_code = %s
        ORDER BY year
    ''', (country_code,))

    rows = cursor.fetchall()
    conn.close()

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


@app.route('/api/external-links/<iso3>', methods=['GET'])
def get_external_links(iso3):
    """
    Get external links for a specific country.

    HTTP Method: GET
    URL: http://localhost:5000/api/external-links/<iso3>

    Returns: JSON with Gapminder, TasteAtlas, and extra links
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT gapminder_url, tasteatlas_url, extra_links
        FROM country_external_links
        WHERE iso3 = %s
    ''', (iso3,))

    row = cursor.fetchone()
    conn.close()

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
    conn = get_db_connection()
    cursor = conn.cursor()

    # Count total countries in database
    cursor.execute('SELECT COUNT(*) as count FROM countries')
    countries_count = cursor.fetchone()['count']

    # Count images from all four collections (Albert Kahn, Children in Art, Public Domain Review, Met Museum)
    cursor.execute('SELECT COUNT(*) as count FROM albert_kahn_images')
    albert_kahn_count = cursor.fetchone()['count']

    cursor.execute('SELECT COUNT(*) as count FROM children_artwork_images')
    children_art_count = cursor.fetchone()['count']

    cursor.execute('SELECT COUNT(*) as count FROM public_domain_images')
    public_domain_count = cursor.fetchone()['count']

    cursor.execute('SELECT COUNT(*) as count FROM met_images')
    met_count = cursor.fetchone()['count']

    conn.close()

    # Return health information with breakdown by collection
    return jsonify({
        'status': 'healthy',
        'database': 'connected',
        'countries_count': countries_count,
        'albert_kahn_count': albert_kahn_count,
        'children_art_count': children_art_count,
        'public_domain_count': public_domain_count,
        'met_count': met_count,
        'total_images': albert_kahn_count + children_art_count + public_domain_count + met_count
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

@app.route('/images/thumbnail/<path:filename>')
def serve_thumbnail(filename):
    """
    Serve thumbnail version of images (200x200 max).

    HTTP Method: GET
    URL: http://localhost:5000/images/thumbnail/USA/albert_kahn/file.jpg
    Purpose: Serve smaller thumbnail versions for faster loading

    Query Parameters:
    - size: Max dimension in pixels (default 200)

    Example: /images/thumbnail/USA/file.jpg?size=150

    Returns: Resized JPEG image
    """
    try:
        # Get size from query params (default 200)
        size = int(request.args.get('size', 200))
        size = min(size, 500)  # Cap at 500px for safety

        # Get the image file
        images_dir = os.path.join(os.path.dirname(__file__), 'images')
        image_path = os.path.join(images_dir, filename)

        if not os.path.exists(image_path):
            return jsonify({'error': 'Image not found'}), 404

        # Open and resize image
        img = Image.open(image_path)

        # Convert to RGB if needed
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
            img = background
        elif img.mode != 'RGB':
            img = img.convert('RGB')

        # Thumbnail maintains aspect ratio
        img.thumbnail((size, size), Image.LANCZOS)

        # Save to bytes
        img_io = BytesIO()
        img.save(img_io, 'JPEG', quality=80, optimize=True)
        img_io.seek(0)

        # Return with proper headers
        from flask import Response
        return Response(img_io.getvalue(), mimetype='image/jpeg')

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/images/resize/<path:filename>')
def serve_resized(filename):
    """
    Serve dynamically resized images.

    HTTP Method: GET
    URL: http://localhost:5000/images/resize/USA/albert_kahn/file.jpg?width=400
    Purpose: Serve images resized to specific dimensions for responsive design

    Query Parameters:
    - width: Target width in pixels (required)
    - quality: JPEG quality 1-100 (default 85)

    Example: /images/resize/USA/file.jpg?width=400&quality=90

    Returns: Resized JPEG image maintaining aspect ratio
    """
    try:
        # Get parameters
        width = request.args.get('width', type=int)
        quality = min(int(request.args.get('quality', 85)), 100)

        if not width:
            return jsonify({'error': 'width parameter required'}), 400

        # Cap width at 1200px for safety
        width = min(width, 1200)

        # Get the image file
        images_dir = os.path.join(os.path.dirname(__file__), 'images')
        image_path = os.path.join(images_dir, filename)

        if not os.path.exists(image_path):
            return jsonify({'error': 'Image not found'}), 404

        # Open image
        img = Image.open(image_path)

        # Convert to RGB if needed
        if img.mode != 'RGB':
            img = img.convert('RGB')

        # Resize maintaining aspect ratio
        original_width, original_height = img.size

        if original_width > width:
            ratio = width / original_width
            new_height = int(original_height * ratio)
            img = img.resize((width, new_height), Image.LANCZOS)

        # Save to bytes
        img_io = BytesIO()
        img.save(img_io, 'JPEG', quality=quality, optimize=True)
        img_io.seek(0)

        # Return with proper headers
        from flask import Response
        return Response(img_io.getvalue(), mimetype='image/jpeg')

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==============================================================================
# SERVER STARTUP
# ==============================================================================
# This block runs when you execute: python3 app.py
# It won't run if you import this file as a module in another script

if __name__ == '__main__':
    # Display startup information: Show how much data is loaded
    # This helps verify database was initialized correctly
    conn = get_db_connection()
    cursor = conn.cursor()

    # Get total counts from all image collections
    cursor.execute('SELECT COUNT(*) as count FROM countries')
    countries_count = cursor.fetchone()['count']

    cursor.execute('SELECT COUNT(*) as count FROM albert_kahn_images')
    albert_kahn_count = cursor.fetchone()['count']

    cursor.execute('SELECT COUNT(*) as count FROM children_artwork_images')
    children_art_count = cursor.fetchone()['count']

    cursor.execute('SELECT COUNT(*) as count FROM public_domain_images')
    public_domain_count = cursor.fetchone()['count']

    total_images = albert_kahn_count + children_art_count + public_domain_count

    conn.close()

    # Print startup message to console
    print(f"🖼️  Loaded {total_images} images ({albert_kahn_count} Albert Kahn, {children_art_count} Children Art, {public_domain_count} Public Domain)")
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
