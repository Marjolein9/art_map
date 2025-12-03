"""
Database utility functions
"""
import sqlite3
from config import DATABASE_PATH

def get_db_connection():
    """Get SQLite database connection with row factory for dictionary results"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row  # Return rows as dictionaries
    return conn
