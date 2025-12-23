"""
Backend Configuration Constants

This file centralizes all configuration values used across the backend.
Instead of hardcoding paths and settings in multiple files, we define them
once here and import them where needed.

This app uses PostgreSQL for both local development and production.

Example usage in other files:
    from config import PORT, ALLOWED_ORIGINS

    app.run(port=PORT)
"""
import os
from dotenv import load_dotenv

# Load environment variables from .env file (local development)
load_dotenv()

# =============================================================================
# DIRECTORY PATHS
# =============================================================================

# BASE_DIR: Absolute path to the backend directory
# __file__ is the path to this config.py file
# os.path.dirname() gets the directory containing this file
# os.path.abspath() converts to absolute path (e.g., /Users/you/project/backend)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Example: If this file is at /Users/you/art_map/backend/config.py
# Then BASE_DIR = /Users/you/art_map/backend

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================

# This app uses PostgreSQL for database storage
# The DATABASE_URL environment variable is configured in:
#   - Local: backend/.env (e.g., postgresql://localhost/artmap_dev)
#   - Production: Render dashboard environment variables
# Connection is handled in db_utils.py using the psycopg2 library

# =============================================================================
# DATA FILES
# =============================================================================

# M49_JSON_PATH: Path to UN M49 standard country classification JSON
# This is the single source of truth for all country data, regions, and codes
# Source: https://tmrk.github.io/m49-list/m49-list.json
M49_JSON_PATH = os.path.join(BASE_DIR, 'data', 'm49-list.json')

# EXPORTS_DIR: Directory for exported CSV files from database
# Used for inspection and backup
EXPORTS_DIR = os.path.join(BASE_DIR, 'data', 'exports')

# BORDERS_CSV_PATH: Path to the country borders CSV file
# Contains country border relationships (which countries border which)
BORDERS_CSV_PATH = os.path.join(BASE_DIR, 'data', 'GEODATASOURCE-COUNTRY-BORDERS.CSV')

# IMAGE COLLECTION CSV PATHS
# Paths to the CSV files containing image metadata for each collection
ALBERT_KAHN_CSV_PATH = os.path.join(BASE_DIR, 'data', 'albert_kahn_metadata.csv')
CHILDREN_ARTWORK_CSV_PATH = os.path.join(BASE_DIR, 'data', 'artwork_final.csv')
PUBLIC_DOMAIN_CSV_PATH = os.path.join(BASE_DIR, 'data', 'public_review_images.csv')
MET_METADATA_CSV_PATH = os.path.join(BASE_DIR, 'data', 'met_metadata.csv')

# COUNTRY_EXTERNAL_LINKS_CSV_PATH: Path to external links for countries
# Contains verified links to Gapminder Dollar Street and other resources
COUNTRY_EXTERNAL_LINKS_CSV_PATH = os.path.join(BASE_DIR, 'data', 'country_external_links.csv')

# =============================================================================
# SERVER CONFIGURATION
# =============================================================================

# PORT: Which port the Flask server listens on
# Environment variable: PORT (e.g., Render sets this automatically)
# Default: 5000 for local development
PORT = int(os.getenv('PORT', 5000))

# DEBUG: Enable Flask's debug mode
# Environment variable: DEBUG (set to 'true' or 'false')
# When True:
#   - Server auto-reloads when you change code
#   - Detailed error messages in browser
#   - Interactive debugger for errors
# When False (production):
#   - No auto-reload
#   - Generic error messages (more secure)
#   - Better performance
# IMPORTANT: Always set to False in production!

DEBUG = os.getenv('DEBUG', 'True').lower() in ('true', '1', 'yes')

# ALLOWED_ORIGINS: CORS allowed origins for production
# Environment variable: ALLOWED_ORIGINS (comma-separated list)
# Examples:
#   - Local: ALLOWED_ORIGINS=http://localhost:3000
#   - Production: ALLOWED_ORIGINS=https://art-map.vercel.app,https://art-map-preview.vercel.app
#   - Wildcard (dev only): ALLOWED_ORIGINS=*
# Default: * (allow all - only for development!)
ALLOWED_ORIGINS_STR = os.getenv('ALLOWED_ORIGINS', '*')
if ALLOWED_ORIGINS_STR == '*':
    ALLOWED_ORIGINS = ['*']
else:
    ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS_STR.split(',')]

# =============================================================================
# IMAGE PROCESSING CONFIGURATION
# =============================================================================

# MAX_IMAGE_WIDTH: Maximum width for processed images
# Images wider than this will be resized while maintaining aspect ratio
MAX_IMAGE_WIDTH = 800

# MAX_IMAGE_DIMENSION: Maximum dimension (width or height) for images
# Used during image optimization to keep file sizes reasonable
MAX_IMAGE_DIMENSION = 1200

# JPEG_QUALITY: JPEG compression quality (0-100)
# Higher = better quality but larger files
# 85 is a good balance between quality and file size
JPEG_QUALITY = 85

# API_REQUEST_DELAY: Delay between API requests (in seconds)
# Used when fetching data from external APIs to avoid rate limiting
API_REQUEST_DELAY = 0.1
