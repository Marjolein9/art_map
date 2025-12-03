from flask import Flask, jsonify, request
from flask_cors import CORS
import random
import os
from db_utils import get_db_connection
from config import DATABASE_PATH, PORT, DEBUG

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

@app.route('/api/countries', methods=['GET'])
def get_countries():
    """Get all countries with their regions"""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT iso3, name, continent, subregion FROM countries ORDER BY name')
    countries = [dict(row) for row in cursor.fetchall()]

    conn.close()

    return jsonify({
        'countries': countries,
        'count': len(countries)
    })

@app.route('/api/game/random-country', methods=['GET'])
def random_country():
    """Return a random country that has artwork"""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Get all countries with artworks
    cursor.execute('SELECT DISTINCT iso3 FROM artworks')
    country_isos = [row['iso3'] for row in cursor.fetchall()]

    if not country_isos:
        conn.close()
        return jsonify({'error': 'No countries available'}), 500

    # Select random country
    selected_iso = random.choice(country_isos)

    # Get country details
    cursor.execute('''
        SELECT iso3, name, continent, subregion
        FROM countries
        WHERE iso3 = ?
    ''', (selected_iso,))

    country = cursor.fetchone()
    conn.close()

    if not country:
        return jsonify({'error': 'Country not found'}), 404

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
    """Get artworks for a specific country"""
    iso3 = request.args.get('iso3')

    if not iso3:
        return jsonify({'error': 'iso3 parameter required'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT
            id, iso3, artist_name, country, work_title,
            work_url, image_path, source, tags, birth_date,
            death_date, birth_place, location_reason,
            author_background, more_info, public_domain, is_local
        FROM artworks
        WHERE iso3 = ?
        ORDER BY id
    ''', (iso3,))

    artworks = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return jsonify({
        'artworks': artworks,
        'count': len(artworks),
        'iso3': iso3
    })

@app.route('/api/game/check-answer', methods=['POST'])
def check_answer():
    """Check if the selected country matches the target"""
    data = request.get_json()
    selected_iso = data.get('selectedCountryIso')
    target_iso = data.get('targetCountryIso')

    correct = selected_iso == target_iso

    return jsonify({
        'correct': correct,
        'selectedCountry': selected_iso,
        'targetCountry': target_iso
    })

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT COUNT(*) as count FROM countries')
    countries_count = cursor.fetchone()['count']

    cursor.execute('SELECT COUNT(*) as count FROM artworks')
    artworks_count = cursor.fetchone()['count']

    conn.close()

    return jsonify({
        'status': 'healthy',
        'database': 'connected',
        'countries_count': countries_count,
        'artworks_count': artworks_count
    })

if __name__ == '__main__':
    # Check database exists
    if not os.path.exists(DATABASE_PATH):
        print("❌ Database not found! Please run: python3 init_database.py")
        exit(1)

    # Get counts
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) FROM countries')
    countries_count = cursor.fetchone()[0]
    cursor.execute('SELECT COUNT(*) FROM artworks')
    artworks_count = cursor.fetchone()[0]
    conn.close()

    print(f"🎨 Loaded {artworks_count} artworks from {countries_count} countries")
    print(f"🚀 Starting server on http://localhost:{PORT}")
    app.run(debug=DEBUG, port=PORT)
