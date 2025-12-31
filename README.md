# Art Map - Geography Quiz with Historical Artwork

An interactive geography quiz game that displays historical artwork and photographs from countries around the world, challenging users to identify countries on a 3D globe.

## 🌍 Live Demo

- **Frontend**: https://art-map-two.vercel.app/
- **Backend API**: https://art-map-backend.onrender.com/api

---

## 📋 Project Overview

### What This Application Does

Art Map is a full-stack web application that combines geography education with art history. Users can:
- **Quiz Mode**: Guess countries based on historical artwork and photographs
- **Explore Mode**: Browse artwork and images from any country
- **Learn**: Discover geographical relationships (neighboring countries, regions)

### Target Audience

- Geography enthusiasts
- Art history students
- Educators looking for interactive teaching tools
- Anyone interested in world culture and history

---

## 🏗️ Architecture & Tech Stack

### System Architecture

```
┌─────────────┐         HTTPS          ┌──────────────┐
│   Browser   │ ◄──────────────────► │    Vercel    │
│  (Client)   │      React App         │  (Frontend)  │
└─────────────┘                        └──────────────┘
                                              │
                                       REST API Calls
                                              │
                                              ▼
                                       ┌──────────────┐
                                       │    Render    │
                                       │   (Backend)  │
                                       │  Flask API   │
                                       └──────────────┘
                                              │
                                         SQL Queries
                                              │
                                              ▼
                                       ┌──────────────┐
                                       │  PostgreSQL  │
                                       │   Database   │
                                       └──────────────┘
```

### Frontend Stack

**Core Technologies:**
- **React 19.2.0**: UI library for building component-based interfaces
- **Material-UI (MUI)**: Pre-built React component library with consistent design
- **D3.js**: Data visualization library for custom map interactions
- **react-globe.gl**: 3D globe visualization using WebGL
- **react-simple-maps**: 2D map rendering with TopoJSON

**Why These Choices:**
- React: Component reusability, virtual DOM performance, large ecosystem
- MUI: Consistent design system, accessibility built-in, responsive by default
- D3.js: Powerful data manipulation and custom visualizations
- Globe.gl: Impressive 3D visualization with minimal setup

**State Management:**
- React Hooks (useState, useEffect, custom hooks)
- Props drilling (simple enough to not need Redux/Context)
- Custom `useQuiz` hook for quiz logic separation

### Backend Stack

**Core Technologies:**
- **Flask 3.1.0**: Lightweight Python web framework
- **Gunicorn**: Production WSGI server for Flask
- **PostgreSQL**: Relational database for structured data
- **psycopg2**: PostgreSQL adapter for Python
- **Pillow**: Image processing library

**Why These Choices:**
- Flask: Simple, unopinionated, perfect for REST APIs
- PostgreSQL: Reliable, powerful querying, better than SQLite for production
- Gunicorn: Industry-standard Python WSGI server

**API Design:**
- RESTful architecture (GET, POST methods)
- JSON responses for all endpoints
- CORS enabled for cross-origin requests
- Standardized error handling

### Database Schema

**Countries Table** (248 records)
- UN M49 standard country data
- Columns: iso3, name, common_name, continent, subregion, etc.

**Image Collections** (4 tables)
- `albert_kahn_images` (95 images)
- `children_artwork_images` (67 images)
- `public_domain_images` (17 images)
- `met_images` (34 images)

**Supporting Tables**
- `country_borders` (642 relationships): Adjacency data for neighboring countries
- `child_mortality` (~45k records): Historical mortality rates by country

---

## 🎯 Key Features & Implementation

### 1. Quiz Mode

**How It Works:**
1. Backend selects a random country that has artwork
2. Frontend displays artwork without revealing country name
3. User clicks on globe/map to guess
4. System checks answer and highlights correct/incorrect country
5. Shows neighboring countries as hints (if enabled)

**Technical Implementation:**
- Random country selection with optional region filtering
- Efficient image loading (fetches one random image instead of all)
- Game state management via `useQuiz` custom hook
- Visual feedback with color-coded countries

### 2. Explore Mode

**How It Works:**
1. User browses 3D globe or 2D map freely
2. Click any country to view its artwork collection
3. Scroll through all images from multiple collections
4. View country information and neighboring countries

**Technical Implementation:**
- All countries clickable (not limited to ones with artwork)
- Lazy loading of images on country selection
- Grouped display by collection with headers

### 3. Interactive Map Visualization

**Globe View (3D):**
- WebGL-powered 3D globe using react-globe.gl
- Smooth rotation and zoom
- Country highlighting on hover
- Atmospheric effects and styling

**Map View (2D):**
- TopoJSON-based 2D projection
- D3.js for custom interactions
- Neighboring country hints visualization
- Responsive to different screen sizes

### 4. Image Collections Integration

**Collections:**
- **Albert Kahn Archive (1908-1931)**: Early color photography documenting the world
- **Children in Art**: Historical paintings featuring children, organized by artist nationality
- **Public Domain Review**: Curated historical images from various sources
- **Metropolitan Museum**: Artworks from the Met's open access collection

**Technical Details:**
- CSV metadata files store image information
- Flask serves images as static files
- Frontend groups images by collection
- Dynamic captions based on collection metadata

---

## 🔧 Development Setup

### Prerequisites

```bash
# Required software
- Node.js 16+
- Python 3.11+
- PostgreSQL
- Git
```

### Quick Start (Local Development)

**1. Clone and Navigate**
```bash
git clone https://github.com/Marjolein9/art_map.git
cd art_map
```

**2. Backend Setup**
```bash
cd backend

# Install PostgreSQL (macOS)
brew install postgresql
brew services start postgresql

# Create database
createdb artmap_dev

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
echo "DATABASE_URL=postgresql://localhost/artmap_dev
DEBUG=true
ALLOWED_ORIGINS=http://localhost:3000
PORT=5000" > .env

# Initialize database (this may take a few minutes)
python3 init_database_postgres.py

# Start backend server
python3 app.py
```

Backend runs at: http://localhost:5000

**3. Frontend Setup** (New terminal window)
```bash
cd frontend

# Install dependencies
npm install --legacy-peer-deps

# Create .env file
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env

# Start development server
npm start
```

Frontend runs at: http://localhost:3000

---

## 🚀 Production Deployment

### Backend Deployment (Render.com)

**Step 1: Create PostgreSQL Database**
1. Go to https://dashboard.render.com
2. Click **New** → **PostgreSQL**
3. Configure:
   - Name: `art-map-db`
   - Database: `artmap`
   - Region: Choose closest to your users
   - Plan: Free (or paid for better performance)
4. Click **Create Database**
5. Copy **External Database URL** (for initialization)
6. Copy **Internal Database URL** (for production backend)

**Step 2: Initialize Production Database**
```bash
cd backend
source venv/bin/activate

# Use EXTERNAL URL for initialization (allows connection from your computer)
export DATABASE_URL="<paste-external-database-url-here>"

# Run initialization
python3 init_database_postgres.py

# Wait for completion (2-5 minutes)
```

**Step 3: Deploy Backend Service**
1. Push code to GitHub:
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. In Render dashboard: **New** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `art-map-backend`
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --timeout 120`
   - **Plan**: Free or paid

5. **Environment Variables**:
   - `DATABASE_URL`: Auto-filled with Internal URL ✓
   - `PYTHON_VERSION`: `3.11.9`
   - `DEBUG`: `false`
   - `ALLOWED_ORIGINS`: Leave blank for now (add after frontend deployment)

6. Click **Create Web Service**
7. Wait ~5-10 minutes for deployment
8. Test: Visit `https://your-service-name.onrender.com/api/health`

### Frontend Deployment (Vercel)

**Step 1: Deploy to Vercel**
1. Go to https://vercel.com
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Create React App (auto-detected)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `build` (auto-detected)

5. **Environment Variables**:
   - Key: `REACT_APP_API_URL`
   - Value: `https://your-backend-service.onrender.com/api`
   - Environments: Production ✓

6. Click **Deploy**
7. Wait ~3-5 minutes
8. Visit your Vercel URL to test

**Step 2: Update Backend CORS**
1. Go back to Render → Your backend service → **Environment**
2. Edit `ALLOWED_ORIGINS`:
   ```
   ALLOWED_ORIGINS=https://your-frontend.vercel.app
   ```
3. Click **Save Changes** (triggers automatic redeploy)
4. Wait ~2 minutes for redeploy
5. Test your Vercel frontend again

### Production Environment Variables

**Backend (.env for local, Render dashboard for production):**
```env
DATABASE_URL=<internal-database-url>
PYTHON_VERSION=3.11.9
DEBUG=false
ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

**Frontend (.env.production in repo):**
```env
REACT_APP_API_URL=https://your-backend.onrender.com/api
```

---

## 🔄 Development Workflow

### Making Changes

```bash
# 1. Create a new branch (optional but recommended)
git checkout -b feature/my-new-feature

# 2. Make your changes to the code

# 3. Test locally
cd backend && python3 app.py    # Terminal 1
cd frontend && npm start         # Terminal 2

# 4. Commit changes
git add .
git commit -m "Add: description of changes"

# 5. Push to GitHub
git push origin main

# 6. Automatic deployment!
# Both Render and Vercel will automatically detect the push and redeploy
```

### Updating Production Database

```bash
# Use EXTERNAL database URL (allows remote connection)
export DATABASE_URL="<external-database-url>"

# Run your update script
python3 init_database_postgres.py  # Re-initializes entire DB
# OR
python3 your_custom_update_script.py  # Custom updates
```

---

## 📚 Code Organization

### Frontend Structure

```
frontend/
├── src/
│   ├── components/         # React components
│   │   ├── ArtworkInfoBar.js          # Country artwork sidebar
│   │   ├── OnLoadOverlay.js           # Initial mode selection
│   │   ├── WelcomeOverlay.mui.js      # Settings modal
│   │   ├── WorldMap.js                # Main map component
│   │   ├── QuizImageDisplay.mui.js    # Image display with map
│   │   └── ...
│   ├── hooks/              # Custom React hooks
│   │   └── useQuiz.js                 # Quiz game logic
│   ├── services/           # API communication
│   │   └── api.js                     # Backend API calls
│   ├── styles/             # CSS styling
│   │   ├── App.css
│   │   └── components.css
│   ├── theme/              # MUI theme configuration
│   │   └── muiTheme.js
│   ├── utils/              # Utility functions
│   │   ├── apiConfig.js               # API URL configuration
│   │   └── displayHelpers.js          # Display formatting
│   ├── App.js              # Root component
│   └── index.js            # Application entry point
├── public/                 # Static assets
└── package.json            # Dependencies
```

### Backend Structure

```
backend/
├── app.py                  # Flask application & routes
├── config.py               # Configuration constants
├── db_utils.py             # Database utilities
├── error_handler.py        # Error handling
├── init_database_postgres.py  # Database initialization
├── data/                   # Data files
│   ├── m49-list.json              # UN country data
│   ├── albert_kahn_metadata.csv   # Image metadata
│   ├── artwork_final.csv          # Children artwork metadata
│   ├── public_review_images.csv   # Public domain metadata
│   ├── met_metadata.csv           # Met museum metadata
│   └── GEODATASOURCE-COUNTRY-BORDERS.CSV
├── images/                 # Image files (by ISO3 code)
│   ├── USA/
│   ├── DEU/
│   └── ...
└── requirements.txt        # Python dependencies
```

---

## 🔗 API Documentation

### Base URL

- **Local**: `http://localhost:5000/api`
- **Production**: `https://art-map-backend.onrender.com/api`

### Endpoints

**Health Check**
```
GET /health
Returns: { "status": "healthy" }
```

**Get All Countries**
```
GET /countries
Returns: {
  "countries": [
    {
      "iso3": "USA",
      "name": "United States of America",
      "common_name": "United States",
      "continent": "Americas",
      "subregion": "Northern America",
      ...
    },
    ...
  ]
}
```

**Get Random Country (Quiz)**
```
GET /game/random-country
GET /game/random-country?region=Africa

Returns: {
  "country": {
    "iso": "KEN",
    "name": "Kenya",
    "continent": "Africa",
    "subregion": "Eastern Africa"
  }
}
```

**Get Country Images**
```
GET /images/:iso3

Returns: {
  "images": {
    "Albert Kahn": [...],
    "Children in Art": [...],
    "Public Domain Review": [...],
    "Met Museum": [...]
  }
}
```

**Check Quiz Answer**
```
POST /game/check-answer
Body: {
  "selectedCountryIso": "FRA",
  "targetCountryIso": "ITA"
}

Returns: {
  "correct": false,
  "selectedCountry": "France",
  "targetCountry": "Italy"
}
```

**Get Neighboring Countries**
```
GET /neighbors/:iso3

Returns: {
  "neighbors": [
    {
      "iso3": "CAN",
      "name": "Canada",
      "common_name": "Canada"
    },
    ...
  ]
}
```

---

## 🐛 Common Issues & Solutions

### "Cannot connect to backend"

**Symptoms:** Frontend shows "Connecting to backend..." indefinitely

**Solutions:**
1. Check backend is running: `curl http://localhost:5000/api/health`
2. Verify DATABASE_URL in backend/.env
3. Check PostgreSQL is running: `brew services list` (macOS)
4. Restart backend: `python3 app.py`

### "Database connection failed"

**Symptoms:** Backend crashes with psycopg2 errors

**Solutions:**
1. Verify PostgreSQL is installed and running
2. Check database exists: `psql -l | grep artmap`
3. Create if missing: `createdb artmap_dev`
4. Verify DATABASE_URL format: `postgresql://localhost/artmap_dev`

### "Images not loading"

**Symptoms:** Countries show but no images appear

**Solutions:**
1. Check backend logs for errors
2. Verify image files exist in backend/images/
3. Check CORS configuration in backend
4. Verify REACT_APP_API_URL in frontend/.env

### "Render deployment fails"

**Common Errors:**

**Python version mismatch:**
- Set `PYTHON_VERSION=3.11.9` in Render environment

**Missing dependencies:**
- Ensure `requirements.txt` is complete
- Check build logs for specific missing packages

**Database connection fails:**
- Use **Internal Database URL** (not External) in production
- Verify DATABASE_URL environment variable is set

### "Vercel build fails"

**Common Errors:**

**Peer dependency issues:**
- Ensure frontend/.npmrc contains `legacy-peer-deps=true`
- Run `npm install --legacy-peer-deps` locally first

**Environment variable not set:**
- Add `REACT_APP_API_URL` in Vercel dashboard
- Redeploy after adding

---

## 💡 Interview Preparation Topics

### React Concepts Demonstrated

1. **Functional Components**: All components use modern function syntax
2. **Hooks**: useState, useEffect, useRef, custom hooks (useQuiz)
3. **Props & State**: Component communication patterns
4. **Conditional Rendering**: && operator, ternary operators
5. **Event Handling**: onClick callbacks, form submissions
6. **Component Composition**: Building complex UIs from simple components
7. **Side Effects**: Data fetching, subscriptions, cleanup
8. **Performance**: useCallback for memoization (where needed)

### Flask/Backend Concepts

1. **REST API Design**: Resource-based URLs, HTTP methods
2. **Database Patterns**: Connection pooling, parameterized queries
3. **Error Handling**: Custom error classes, standardized responses
4. **CORS**: Cross-origin security, allowed origins
5. **Environment Configuration**: .env files, production vs development
6. **Static File Serving**: Images served from Flask
7. **SQL Queries**: Joins, filtering, random selection

### Database Concepts

1. **Relational Design**: Foreign keys, normalized tables
2. **Query Optimization**: Indexes, efficient joins
3. **Data Integrity**: Constraints, referential integrity
4. **PostgreSQL Features**: Arrays, JSON types, advanced queries

### Deployment Concepts

1. **CI/CD**: Automatic deployment on git push
2. **Environment Variables**: Separating config from code
3. **WSGI Servers**: Gunicorn for production Python
4. **Static Hosting**: Vercel for React apps
5. **Database Hosting**: Managed PostgreSQL on Render
6. **HTTPS/SSL**: Secure connections in production

---

## 📊 Project Statistics

- **Total Countries**: 248 (UN M49 standard)
- **Total Images**: 213+ across 4 collections
- **Border Relationships**: 642 adjacency records
- **API Endpoints**: 8 endpoints
- **React Components**: 10+ components
- **Lines of Code**: ~5,000+ (frontend + backend)

---

## 🎨 Image Collections Details

### Albert Kahn Archive (1908-1931)
- **Count**: 95 images
- **Type**: Early color photography (Autochrome process)
- **Coverage**: France, Vietnam, India, Morocco, and more
- **Historical Significance**: Some of the first color photographs ever taken

### Children in Art
- **Count**: 67 images
- **Type**: Historical paintings featuring children
- **Organization**: By artist nationality
- **Period**: Various, mostly 18th-20th century

### Public Domain Review
- **Count**: 17 images
- **Type**: Curated historical images and illustrations
- **Source**: Public Domain Review project
- **Coverage**: Diverse subjects and time periods

### Metropolitan Museum
- **Count**: 34 images
- **Type**: Museum artworks and artifacts
- **Source**: Met Museum Open Access collection
- **Coverage**: Various cultures and time periods

---

## 📄 License

Educational/Portfolio project.

### Image Attributions
- **Albert Kahn Archive**: Public domain
- **Children in Art**: Public domain works by nationality
- **Public Domain Review**: Public domain, curated selections
- **Metropolitan Museum**: Open Access collection

All images are in the public domain or used under open access policies. See individual image metadata for specific attribution requirements.

---

## 🤝 Contributing

This is a portfolio/educational project, but suggestions and feedback are welcome!

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Areas for Improvement

- [ ] Add more image collections
- [ ] Implement user accounts and score tracking
- [ ] Add difficulty levels
- [ ] Mobile app version
- [ ] Offline support
- [ ] More comprehensive country information
- [ ] Achievement system
- [ ] Leaderboards

---

## 📧 Contact

**Created by**: Marjolein Oostrom

**GitHub**: [@Marjolein9](https://github.com/Marjolein9)

**Project Repository**: https://github.com/Marjolein9/art_map

---

## 🙏 Acknowledgments

- UN Statistics Division for M49 country classification
- Albert Kahn Museum for historical photography
- Metropolitan Museum of Art for open access collection
- Public Domain Review for curated historical images
- React, Flask, and all open-source libraries used

---

**Last Updated**: December 2024
