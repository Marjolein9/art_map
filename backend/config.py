"""
Backend configuration constants
"""
import os

# Base directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Database configuration
DATABASE_PATH = os.path.join(BASE_DIR, 'database.db')

# Data files
REGIONS_JSON_PATH = os.path.join(BASE_DIR, 'data', 'regions.json')
CSV_PATH = os.path.join(BASE_DIR, '..', 'children_combined_with_iso3.csv')

# Server configuration
PORT = 5000
DEBUG = True
