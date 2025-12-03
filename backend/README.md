# Backend - Flask REST API

This is the backend server for the Art Map Quiz application. It provides a REST API for serving country and artwork data.

## What is Flask?

Flask is a lightweight Python web framework. Think of it as a tool that:
1. Listens for HTTP requests (like when a browser asks for data)
2. Runs Python functions to handle those requests
3. Sends back responses (usually JSON data)

## Architecture Overview

```
HTTP Request → Flask App → Route Handler → Database → Response
     ↓            ↓             ↓            ↓          ↓
  /api/...    app.py      get_countries()  SQLite   JSON data
```

## File Structure

```
backend/
├── app.py              # Main Flask application (API routes)
├── init_database.py    # Script to initialize/reset database
├── config.py           # Configuration constants (paths, ports, etc.)
├── db_utils.py         # Database helper functions
├── data/
│   └── regions.json    # Country to region mappings
├── database.db         # SQLite database file (auto-generated)
└── requirements.txt    # Python dependencies
```

## Key Files Explained

### app.py - Main Application

This file contains:
- **Flask app initialization**: Creates the web server
- **Route handlers**: Functions that respond to different URLs
- **CORS configuration**: Allows frontend to communicate with backend

**Key concepts:**
```python
# Decorator - tells Flask which URL triggers this function
@app.route('/api/countries', methods=['GET'])
def get_countries():
    # This runs when someone visits http://localhost:5000/api/countries
    return jsonify({'countries': [...]})
```

### init_database.py - Database Setup

This script:
1. Deletes the old database (if it exists)
2. Creates new tables (countries, artworks)
3. Reads data from CSV file
4. Populates the database

Run this whenever you update the CSV file.

### config.py - Configuration

Centralized place for all configuration values:
- Database path
- CSV file path
- Server port (5000)
- Debug mode

**Why separate config?** Makes it easy to change settings without editing multiple files.

### db_utils.py - Database Helpers

Reusable database functions:
- `get_db_connection()`: Creates a connection to the SQLite database

**Why separate this?** Avoid repeating the same database connection code everywhere.

## API Endpoints

### GET /api/countries

**Purpose:** Get all countries with their regions

**Response:**
```json
{
  "countries": [
    {
      "iso3": "USA",
      "name": "United States",
      "continent": "Americas",
      "subregion": "North America"
    },
    ...
  ],
  "count": 84
}
```

### GET /api/game/random-country

**Purpose:** Get a random country that has artwork (for quiz)

**How it works:**
1. Query database for all countries with artworks
2. Use Python's `random.choice()` to pick one
3. Return country details

**Response:**
```json
{
  "country": {
    "iso": "JPN",
    "name": "Japan",
    "continent": "Asia",
    "subregion": "East Asia"
  }
}
```

### GET /api/artworks?iso3={CODE}

**Purpose:** Get all artworks for a specific country

**Parameters:**
- `iso3`: Three-letter country code (e.g., "USA", "FRA")

**How it works:**
1. Extract `iso3` parameter from URL query string
2. Query database for artworks matching that country
3. Return list of artworks

**Example request:**
```
GET /api/artworks?iso3=USA
```

**Response:**
```json
{
  "artworks": [
    {
      "id": 1,
      "iso3": "USA",
      "artist_name": "Jose Campeche",
      "work_title": "Portrait",
      "image_path": "https://...",
      ...
    }
  ],
  "count": 5,
  "iso3": "USA"
}
```

### POST /api/game/check-answer

**Purpose:** Check if user's answer is correct

**Request body:**
```json
{
  "selectedCountryIso": "FRA",
  "targetCountryIso": "FRA"
}
```

**Response:**
```json
{
  "correct": true,
  "selectedCountry": "FRA",
  "targetCountry": "FRA"
}
```

### GET /api/health

**Purpose:** Check if server is running and database is connected

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "countries_count": 84,
  "artworks_count": 134
}
```

## Database Schema

### countries table

Stores information about each country.

```sql
CREATE TABLE countries (
    iso3 TEXT PRIMARY KEY,      -- Three-letter country code (e.g., "USA")
    name TEXT NOT NULL,          -- Full country name (e.g., "United States")
    continent TEXT NOT NULL,     -- Continent (e.g., "Americas")
    subregion TEXT NOT NULL      -- Subregion (e.g., "North America")
)
```

### artworks table

Stores artwork information linked to countries.

```sql
CREATE TABLE artworks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,  -- Unique ID for each artwork
    iso3 TEXT NOT NULL,                    -- Country code (foreign key)
    artist_name TEXT,                      -- Name of the artist
    country TEXT,                          -- Country name
    work_title TEXT,                       -- Title of the artwork
    work_url TEXT,                         -- URL to artwork page
    image_path TEXT,                       -- URL to image file
    birth_date TEXT,                       -- Artist birth date
    death_date TEXT,                       -- Artist death date
    birth_place TEXT,                      -- Where artist was born
    location_reason TEXT,                  -- Why artwork is associated with country
    author_background TEXT,                -- Link to artist info
    source TEXT,                           -- Where image came from
    tags TEXT,                             -- Tags/categories
    more_info TEXT,                        -- Additional information
    public_domain TEXT,                    -- Public domain status
    is_local TEXT,                         -- Whether image is stored locally
    FOREIGN KEY (iso3) REFERENCES countries(iso3)
)
```

**Foreign Key:** Links artworks to countries table

## Flask Concepts Explained

### Decorators

Decorators in Python modify functions. Flask uses them to define routes:

```python
@app.route('/api/health')  # Decorator: maps URL to function
def health():              # Function that handles the request
    return jsonify({...})  # Return JSON response
```

When you visit `/api/health`, Flask calls the `health()` function.

### CORS (Cross-Origin Resource Sharing)

```python
CORS(app)  # Enable CORS for React frontend
```

**Why needed?** 
- Frontend runs on http://localhost:3000
- Backend runs on http://localhost:5000
- Browsers block requests between different origins (security)
- CORS tells browser: "It's okay, allow these requests"

### jsonify()

```python
return jsonify({'status': 'healthy'})
```

Converts Python dictionary to JSON format:
- Python: `{'status': 'healthy'}`
- JSON: `{"status": "healthy"}`

Also sets correct HTTP headers (`Content-Type: application/json`)

### request object

```python
from flask import request

iso3 = request.args.get('iso3')  # Get URL parameter
data = request.get_json()        # Get JSON from POST body
```

Flask provides `request` object to access:
- URL parameters (`?iso3=USA`)
- POST body data
- Headers, cookies, etc.

## Database Concepts

### SQLite

**What is it?**
- Lightweight database stored in a single file (database.db)
- No separate server needed
- Perfect for small to medium applications

**Comparison:**
- Like Excel: Tables = Spreadsheets, Rows = Rows, Columns = Columns
- Unlike Excel: Can query, join, and relate data efficiently

### Row Factory

```python
conn.row_factory = sqlite3.Row
```

**What this does:**
- Normally, database returns tuples: `(123, 'USA', 'United States')`
- With Row factory, returns dict-like objects: `{'iso3': 'USA', 'name': 'United States'}`
- Easier to work with in code!

### Cursor

```python
cursor = conn.cursor()
cursor.execute('SELECT * FROM countries')
results = cursor.fetchall()
```

**What is a cursor?**
- Like a pointer that moves through database results
- `execute()`: Run a SQL query
- `fetchall()`: Get all results
- `fetchone()`: Get one result

## Running the Backend

### First Time Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Initialize database
python3 init_database.py
```

### Start Server

```bash
python3 app.py
```

Server will start on http://localhost:5000

### Reinitialize Database

If you update the CSV data or want to reset:

```bash
python3 init_database.py
```

This will delete and recreate database.db

## Common Issues

### Port 5000 already in use

**Error:** `Address already in use`

**Solution:**
```bash
# Find process using port 5000
lsof -i :5000

# Kill that process
kill -9 <PID>
```

Or change PORT in config.py

### Database not found

**Error:** `database.db not found`

**Solution:**
```bash
python3 init_database.py
```

### CORS errors

**Error:** Browser console shows CORS error

**Solution:**
- Check that `CORS(app)` is in app.py
- Verify flask-cors is installed
- Restart backend server

## Development Tips

### Testing API Endpoints

Use curl to test without frontend:

```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Test random country
curl http://localhost:5000/api/game/random-country

# Test artworks
curl http://localhost:5000/api/artworks?iso3=USA

# Test check answer (POST)
curl -X POST http://localhost:5000/api/game/check-answer \
  -H "Content-Type: application/json" \
  -d '{"selectedCountryIso": "USA", "targetCountryIso": "USA"}'
```

### Viewing Database

Use SQLite command line:

```bash
sqlite3 database.db

# Show tables
.tables

# View countries
SELECT * FROM countries LIMIT 5;

# View artworks
SELECT * FROM artworks LIMIT 5;

# Exit
.quit
```

Or use a GUI tool like [DB Browser for SQLite](https://sqlitebrowser.org/)

### Debug Mode

Debug mode is enabled in config.py:

```python
DEBUG = True
```

**Benefits:**
- Auto-reload when you change code
- Detailed error messages
- Interactive debugger

**Important:** Turn off for production!

## Next Steps

1. Read the comments in `app.py` to understand route handlers
2. Look at `init_database.py` to see how data is loaded
3. Try adding a new API endpoint
4. Experiment with different database queries

## Learning Resources

- [Flask Tutorial](https://flask.palletsprojects.com/en/3.0.x/tutorial/)
- [SQLite Tutorial](https://www.sqlitetutorial.net/)
- [REST API Design](https://restfulapi.net/)
