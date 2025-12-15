"""
Database Utility Functions - PostgreSQL Only

This module provides PostgreSQL database connection functions.
All environments (local and production) use PostgreSQL.

Why this is useful:
1. DRY (Don't Repeat Yourself) - write connection code once
2. Consistency - all connections configured the same way
3. Easy to modify - change in one place affects everywhere
"""
import os
import psycopg2
from psycopg2.extras import RealDictCursor


def get_db_connection():
    """
    Get PostgreSQL database connection with dictionary results.

    Deployment Strategy:
    -------------------
    - **Local Development:** Uses local PostgreSQL (createdb artmap_dev)
    - **Production (Render):** Uses Render PostgreSQL (DATABASE_URL env var)

    Both environments use the same PostgreSQL database engine.

    How it works:
    1. Read DATABASE_URL environment variable
    2. Convert postgres:// to postgresql:// if needed (Render compatibility)
    3. Connect to PostgreSQL with RealDictCursor for dict-like results

    Returns:
        psycopg2.Connection: Database connection with dict cursor

    Example usage:
        from db_utils import get_db_connection

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM countries WHERE iso3 = %s', ('USA',))
        country = cursor.fetchone()
        conn.close()

        # Returns: {'iso3': 'USA', 'name': 'United States', ...}

    PostgreSQL Setup:
    ----------------
    **Local Development:**
        brew install postgresql
        createdb artmap_dev
        export DATABASE_URL="postgresql://localhost/artmap_dev"
        python3 init_database_postgres.py

    **Production (Render):**
        DATABASE_URL is automatically provided by Render when you link the database

    URL Format Handling:
    -------------------
    - Render provides: postgres://user:pass@host:port/db
    - psycopg2 requires: postgresql://user:pass@host:port/db
    - This function handles the conversion automatically

    Context Manager Support:
    -----------------------
    Always close connections to avoid resource leaks:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            # ... do work ...
        # Automatically closed
    """
    # Get DATABASE_URL from environment
    database_url = os.getenv('DATABASE_URL')

    if not database_url:
        raise EnvironmentError(
            "DATABASE_URL environment variable not set!\n"
            "\n"
            "Local development:\n"
            "  1. Install PostgreSQL: brew install postgresql\n"
            "  2. Create database: createdb artmap_dev\n"
            "  3. Set DATABASE_URL: export DATABASE_URL='postgresql://localhost/artmap_dev'\n"
            "  4. Initialize database: python3 backend/init_database_postgres.py\n"
            "\n"
            "Production (Render):\n"
            "  DATABASE_URL is automatically provided when you link a PostgreSQL database"
        )

    # Handle Render's postgres:// URL format (convert to postgresql://)
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)

    # Add SSL parameters to URL for remote PostgreSQL (not localhost)
    if 'localhost' not in database_url and '127.0.0.1' not in database_url:
        if '?' in database_url:
            database_url += '&sslmode=require'
        else:
            database_url += '?sslmode=require'

    # Connect to PostgreSQL with RealDictCursor for dict-like results
    conn = psycopg2.connect(database_url, cursor_factory=RealDictCursor)

    return conn
