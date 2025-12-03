"""
Database Utility Functions

This module provides reusable database connection functions.
Instead of repeating the same database connection code in every file,
we centralize it here.

Why this is useful:
1. DRY (Don't Repeat Yourself) - write connection code once
2. Consistency - all connections configured the same way
3. Easy to modify - change in one place affects everywhere
"""
import sqlite3
from config import DATABASE_PATH


def get_db_connection():
    """
    Get SQLite database connection with row factory for dictionary results.

    What this function does:
    1. Connects to the SQLite database file at DATABASE_PATH
    2. Configures the connection to return rows as dict-like objects
    3. Returns the connection object for use

    Returns:
        sqlite3.Connection: Database connection object

    Example usage:
        # In any file that needs database access:
        from db_utils import get_db_connection

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM countries')
        countries = cursor.fetchall()
        conn.close()

        # Now 'countries' is a list of dict-like objects:
        # [{'iso3': 'USA', 'name': 'United States', ...}, ...]

    What is Row Factory?
    -------------------
    By default, SQLite returns tuples:
        ('USA', 'United States', 'Americas', 'North America')

    With row_factory = sqlite3.Row, it returns dict-like Row objects:
        {'iso3': 'USA', 'name': 'United States', 'continent': 'Americas', ...}

    This makes code more readable:
        # Without row factory (tuple):
        country_name = row[1]  # What is index 1?

        # With row factory (dict-like):
        country_name = row['name']  # Much clearer!

    Note about connections:
    ----------------------
    Always close connections when done to free resources:
        conn.close()

    Or use context manager (preferred):
        with get_db_connection() as conn:
            cursor = conn.cursor()
            # ... do database work ...
        # Connection automatically closed
    """
    # sqlite3.connect() creates a connection to the database file
    # If file doesn't exist, it would create it (but we want it to exist already)
    conn = sqlite3.connect(DATABASE_PATH)

    # Set row factory to return dict-like Row objects instead of tuples
    # This makes results easier to work with in Python
    conn.row_factory = sqlite3.Row

    return conn
