# Art Map Quiz

An interactive geography quiz game that displays artwork from different countries and challenges users to identify the country on a 3D globe.

## Overview

This is a full-stack web application combining:
- **Backend**: Python Flask REST API with SQLite database
- **Frontend**: React application with 3D globe visualization
- **Data**: 134 artworks from 84 countries

## Project Structure

```
art_map/
├── backend/                    # Flask API server
│   ├── app.py                 # Main Flask application with API routes
│   ├── init_database.py       # Database initialization script
│   ├── config.py              # Configuration constants
│   ├── db_utils.py            # Database helper functions
│   ├── data/
│   │   └── regions.json       # ISO3 country code to region mappings
│   ├── database.db            # SQLite database (generated)
│   └── requirements.txt       # Python dependencies
│
├── frontend/                   # React application
│   ├── src/
│   │   ├── components/        # React UI components
│   │   ├── services/          # API communication layer
│   │   ├── hooks/             # Custom React hooks
│   │   ├── config/            # Configuration files
│   │   └── App.js            # Main React component
│   ├── public/
│   │   └── artwork_images/   # Local artwork image files
│   └── package.json          # Node.js dependencies
│
├── children_combined_with_iso3.csv  # Source data with artwork information
└── background_work/           # Development files and notes
```

## Getting Started

### Prerequisites

**Backend:**
- Python 3.7+
- pip (Python package manager)

**Frontend:**
- Node.js 14+
- npm (Node package manager)

### Installation

**1. Backend Setup**

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Initialize the database from CSV data
python3 init_database.py

# Start the Flask server
python3 app.py
```

The backend will start on http://localhost:5000

**2. Frontend Setup**

```bash
# Navigate to frontend directory
cd frontend

# Install Node.js dependencies
npm install

# Start the React development server
npm start
```

The frontend will start on http://localhost:3000

## Key Concepts for Beginners

### Flask (Backend Framework)

**What is Flask?**
- Lightweight Python web framework
- Handles HTTP requests and responses
- Routes map URLs to Python functions

**Example:**
```python
@app.route('/api/countries', methods=['GET'])
def get_countries():
    # This function runs when someone visits /api/countries
    return jsonify({'countries': [...]})
```

### React (Frontend Framework)

**What is React?**
- JavaScript library for building user interfaces
- Components are reusable pieces of UI
- Hooks manage state and side effects

**Key React Concepts:**
- `useState`: Store data that can change
- `useEffect`: Run code when something changes
- Custom Hooks: Reusable logic

### REST API

**What is a REST API?**
- Way for frontend and backend to communicate
- Uses HTTP methods (GET, POST) to request/send data
- Data exchanged in JSON format

## Technologies Used

**Backend:**
- Flask 3.0.0 - Web framework
- Flask-CORS 4.0.0 - Cross-origin resource sharing
- SQLite3 - Database

**Frontend:**
- React 18+ - UI framework
- react-globe.gl - 3D globe visualization

See backend/README.md and frontend/README.md for detailed documentation.
