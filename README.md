# Art Map - Geography Quiz with Historical Artwork

An interactive geography quiz game that displays historical artwork and photographs from countries around the world, challenging users to identify countries on a 3D globe.

## 🌍 Live Demo

- **Frontend**: https://art-map-two.vercel.app/
- **Backend API**: https://art-map-backend.onrender.com/api

## 📋 Overview

Full-stack web application combining:
- **Backend**: Python Flask REST API with PostgreSQL database
- **Frontend**: React application with 3D globe and 2D map visualizations
- **Data**: 213+ historical images from 4 collections across 248 countries

---

## 🚀 Local Development Setup

### Prerequisites

- **Node.js** (v16+) and npm
- **Python** 3.11+
- **PostgreSQL**
- **Git**

### 1. Clone Repository

```bash
git clone https://github.com/Marjolein9/art_map.git
cd art_map
```

### 2. Backend Setup

#### Install PostgreSQL

```bash
# macOS
brew install postgresql
brew services start postgresql

# Create local database
createdb artmap_dev
```

#### Set up Python Environment

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate    # Windows

# Install dependencies
pip install -r requirements.txt
```

#### Environment Variables

The `backend/.env` file should exist with:

```env
DATABASE_URL=postgresql://localhost/artmap_dev
DEBUG=true
ALLOWED_ORIGINS=http://localhost:3000
PORT=5000
```

#### Initialize Database

```bash
# Make sure venv is activated
python3 init_database_postgres.py
```

Output should show:
- ✅ 248 countries loaded
- ✅ 95 Albert Kahn images
- ✅ 67 Children Artwork images
- ✅ 17 Public Domain images
- ✅ 34 Met Museum images
- ✅ 642 border relationships
- ✅ Child mortality data

#### Run Backend

```bash
python3 app.py
```

Backend available at: http://localhost:5000

Test: http://localhost:5000/api/health

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies (use --legacy-peer-deps for React 19)
npm install --legacy-peer-deps

# Start development server
npm start
```

Frontend available at: http://localhost:3000

---

## 📦 Deployment

### Backend Deployment (Render)

#### 1. Create PostgreSQL Database

1. Go to https://dashboard.render.com
2. **New** → **PostgreSQL**
3. Configure:
   - **Name**: `art-map-db`
   - **Database**: `artmap`
   - **Plan**: Free
4. **Create Database**
5. Copy **External Database URL** (for initialization)
6. Copy **Internal Database URL** (for backend)

#### 2. Initialize Production Database

```bash
cd backend
source venv/bin/activate

# Set EXTERNAL Database URL
export DATABASE_URL="postgresql://user:pass@dpg-xxxxx.oregon-postgres.render.com:5432/artmap"

# Initialize
python3 init_database_postgres.py
```

Wait for completion (~2-5 minutes).

#### 3. Deploy Backend Service

1. Push code to GitHub:
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. Render dashboard → **New** → **Web Service**

3. Connect GitHub repository

4. Configure:
   - **Name**: `art-map-backend`
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --timeout 120`
   - **Plan**: Free

5. **Environment Variables**:
   - `DATABASE_URL` - Auto-filled (Internal URL)
   - `PYTHON_VERSION` - `3.11.9`
   - `DEBUG` - `false`
   - `ALLOWED_ORIGINS` - Add after frontend deployment

6. **Create Web Service**

7. Wait ~5 minutes, test: `https://art-map-backend.onrender.com/api/health`

### Frontend Deployment (Vercel)

#### 1. Deploy to Vercel

1. Go to https://vercel.com
2. **Add New** → **Project**
3. Import GitHub repository
4. Configure:
   - **Root Directory**: `frontend`
   - **Framework**: Create React App (auto-detected)

5. **Environment Variable**:
   - **Key**: `REACT_APP_API_URL`
   - **Value**: `https://art-map-backend.onrender.com/api`
   - **Environments**: Production ✓

6. **Deploy**

7. Wait ~3 minutes

#### 2. Update Backend CORS

Go to Render → `art-map-backend` → **Environment**

Update `ALLOWED_ORIGINS`:
```
ALLOWED_ORIGINS=https://art-map-two.vercel.app
```

**Save** (triggers redeploy)

---

## 🔄 Making Updates

### Development Workflow

```bash
# 1. Make changes locally

# 2. Test
cd backend && python3 app.py           # Terminal 1
cd frontend && npm start                # Terminal 2

# 3. Commit & push
git add .
git commit -m "Description"
git push origin main

# 4. Automatic deployment
# Both Render and Vercel auto-deploy on push!
```

### Update Production Database

```bash
cd backend
source venv/bin/activate

# Use EXTERNAL URL
export DATABASE_URL="postgresql://user:pass@dpg-xxxxx.oregon-postgres.render.com:5432/artmap"

# Run update
python3 init_database_postgres.py  # Or custom script
```

---

## 🌐 Environment Variables

### Backend (Local)

`backend/.env`:
```env
DATABASE_URL=postgresql://localhost/artmap_dev
DEBUG=true
ALLOWED_ORIGINS=http://localhost:3000
PORT=5000
```

### Backend (Production)

Render Dashboard → Environment:
- `DATABASE_URL` - Internal URL (auto-set)
- `PYTHON_VERSION` - `3.11.9`
- `DEBUG` - `false`
- `ALLOWED_ORIGINS` - Your Vercel URL

### Frontend (Local)

`frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### Frontend (Production)

`frontend/.env.production` (in repo):
```env
REACT_APP_API_URL=https://art-map-backend.onrender.com/api
```

Or set in Vercel Dashboard → Settings → Environment Variables

---

## 🐛 Troubleshooting

### Backend Won't Start

**Error**: `DATABASE_URL not set`

```bash
# Verify backend/.env exists
cd backend
cat .env

# Create if missing
echo "DATABASE_URL=postgresql://localhost/artmap_dev" > .env
```

**Error**: `Connection failed`

```bash
# Start PostgreSQL
brew services start postgresql

# Create database if missing
createdb artmap_dev
```

### Frontend Images Not Loading

**Issue**: Mixed Content errors, localhost URLs in production

**Fix**: Verify `REACT_APP_API_URL`:
- Local: `http://localhost:5000/api`
- Production: `https://art-map-backend.onrender.com/api`

### Render Deployment Fails

**Error**: Python 3.13 compatibility

**Fix**: Set `PYTHON_VERSION=3.11.9` in Render environment

**Error**: `No module named 'psycopg2'`

**Fix**: Verify `requirements.txt` has `psycopg2-binary==2.9.10`

### Vercel Deployment Fails

**Error**: `ERESOLVE` peer dependency

**Fix**: Ensure `frontend/.npmrc` exists:
```
legacy-peer-deps=true
```

---

## 📊 Database Schema

- **countries** (248) - UN M49 country data
- **albert_kahn_images** (95) - Historical photographs
- **children_artwork_images** (67) - Paintings with children
- **public_domain_images** (17) - Public Domain Review
- **met_images** (34) - Metropolitan Museum
- **country_borders** (642) - Adjacency data
- **child_mortality** (~45k) - Historical mortality rates

---

## 🔗 API Endpoints

Base: `https://art-map-backend.onrender.com/api`

- `GET /health` - Health check
- `GET /countries` - All countries
- `GET /random-country` - Random country with artwork
- `GET /images/:code` - Country images
- `POST /game/check-answer` - Verify quiz answer
- `GET /neighbors/:code` - Bordering countries
- `GET /child-mortality/:code` - Mortality data

---

## 🎨 Image Collections

1. **Albert Kahn Archive** (1908-1931) - Early color photography
2. **Children in Art** - Historical paintings by country
3. **Public Domain Review** - Curated historical images
4. **Metropolitan Museum** - Met collection artworks

---

## 🏗️ Tech Stack

**Frontend:**
- React 19.2.0
- D3.js, react-globe.gl, react-simple-maps
- Deployed on Vercel

**Backend:**
- Flask 3.1.0, Gunicorn
- PostgreSQL, Pillow
- Deployed on Render

---

## 📄 License

Educational/Portfolio project.

Images: Public domain & museum collections (see metadata for attribution)

---

## 📧 Contact

Created by Marjolein Oostrom

GitHub: [@Marjolein9](https://github.com/Marjolein9)
