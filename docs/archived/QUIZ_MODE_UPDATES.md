# Art Map Deployment Plan

## Application Overview

**Architecture:**
- **Frontend**: React 19.2.0 (Create React App)
  - Dependencies: D3.js, react-globe.gl, react-simple-maps, Three.js
  - Build output: Static HTML/JS/CSS bundle
  - Current API endpoint: `http://localhost:5000/api` (hardcoded in `src/services/api.js`)

- **Backend**: Python Flask 3.0.0 REST API
  - Dependencies: Flask, flask-cors
  - Database: SQLite (database.db - 7 tables)
  - Static assets: 266 images (51MB) in `backend/images/`
  - Dynamic image processing: thumbnails and responsive resizing

**Current State:**
- Development server (Flask debug mode)
- Hardcoded localhost URLs
- No environment variable configuration
- SQLite database (file-based)

## Asset Inventory

- **Images**: 51MB, 266 files across 4 collections (Albert Kahn, Children Artwork, Public Domain, Met Museum)
- **Database**: SQLite with 248 countries, ~213 total images across collections
- **GeoJSON data**: Map topology files in `frontend/public/geo/`

---

## User Requirements (Confirmed)

✅ **Free tier hosting** (Vercel/Netlify + Render/Railway)
✅ **Personal/portfolio project** preparing for potential traffic
✅ **Low cost, no AWS**
✅ **Migrate to PostgreSQL**
✅ **Platform subdomain** (no custom domain)

---

## Recommended Deployment Stack

**Frontend:** Vercel (Free tier)
- 6,000 build minutes/month (vs Netlify's 300)
- Best for React, global CDN
- Zero-config deployment
- Free SSL + subdomain: `art-map-yourname.vercel.app`

**Backend:** Render (Free tier)
- Integrated PostgreSQL on same platform
- 750 hours/month (runs 24/7)
- 512MB storage (51MB images fit easily)
- Free SSL, automatic HTTPS
- **Trade-off:** Cold starts after 15 min inactivity (15-30 sec delay)

**Database:** Render PostgreSQL (Free tier)
- 1GB storage (sufficient for your data)
- Same platform as backend (low latency)
- Must log in monthly to keep active

**Images:** Co-located with backend
- 51MB fits within 512MB storage limit
- Use existing Flask image optimization endpoints
- No separate CDN needed for portfolio project

**Total Cost:** $0/month

---

## Implementation Plan

### Phase 1: Code Preparation (Local - 2 hours)

**1.1 Update Backend Dependencies**
- Edit [backend/requirements.txt](backend/requirements.txt)
- Add: `gunicorn==21.2.0`, `psycopg2-binary==2.9.9`, `Pillow==10.1.0`, `requests==2.31.0`, `python-dotenv==1.0.0`

**1.2 Update Database Connection for PostgreSQL**
- Edit [backend/db_utils.py](backend/db_utils.py)
- Replace `sqlite3` with `psycopg2`
- Use `RealDictCursor` for dict-like results
- Handle Render's `postgres://` URL format (convert to `postgresql://`)

**1.3 Create PostgreSQL Initialization Script**
- Create new file: [backend/init_database_postgres.py](backend/init_database_postgres.py)
- Copy from `init_database.py` and update:
  - Replace `?` placeholders with `%s` for psycopg2
  - Change `INTEGER PRIMARY KEY AUTOINCREMENT` to `SERIAL PRIMARY KEY`
  - Use `psycopg2.connect()` instead of `sqlite3.connect()`

**1.4 Add Environment Variable Support**
- Edit [backend/config.py](backend/config.py)
- Add `DATABASE_URL` environment variable (PostgreSQL connection string)
- Add `ALLOWED_ORIGINS` for CORS (comma-separated list)
- Add `DEBUG` boolean environment variable
- Keep backward compatibility for local SQLite development

**1.5 Update Frontend API Configuration**
- Edit [frontend/src/services/api.js](frontend/src/services/api.js)
- Change: `const API_URL = 'http://localhost:5000/api'`
- To: `const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api'`

**1.6 Create Environment Files**
- Create [frontend/.env.production](frontend/.env.production): `REACT_APP_API_URL=https://art-map-backend.onrender.com/api`
- Create [backend/.env.example](backend/.env.example) with all required variables
- Add to [.gitignore](.gitignore): `.env`, `.env.local`, `.env.production`

**1.7 Create GitHub Actions Keep-Alive** (Prevents cold starts)
- Create directory: `.github/workflows/`
- Create file: [.github/workflows/keep-alive.yml](.github/workflows/keep-alive.yml)
- Add workflow to ping backend every 14 minutes
- **Result:** No cold starts, 24/7 uptime, completely free

**1.8 Test Locally with PostgreSQL** (Optional but recommended)
- Install PostgreSQL: `brew install postgresql`
- Create database: `createdb artmap_dev`
- Set `DATABASE_URL=postgresql://localhost/artmap_dev`
- Run `python3 init_database_postgres.py`
- Test Flask app: `python3 app.py`

---

### Phase 2: Backend Deployment to Render (1 hour)

**2.1 Create Render Account**
- Sign up at https://render.com with GitHub (free, no credit card)

**2.2 Create PostgreSQL Database**
- Dashboard → New → PostgreSQL
- Name: `art-map-db`, Database: `artmap`, Region: Oregon
- Copy **Internal Database URL** (starts with `postgres://`)

**2.3 Initialize Database**
- On local machine: `export DATABASE_URL="<internal-url>"`
- Run: `python3 backend/init_database_postgres.py`
- Verify: Check Render dashboard for populated tables

**2.4 Push Code to GitHub**
```bash
git add .
git commit -m "Add deployment configuration for Render and Vercel"
git push origin main
```

**2.5 Create Web Service**
- Dashboard → New → Web Service
- Connect repo, Name: `art-map-backend`, Region: Oregon
- Root Directory: `backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --timeout 120`

**2.6 Set Environment Variables**
- `DATABASE_URL`: Auto-connected from database
- `DEBUG`: `false`
- `ALLOWED_ORIGINS`: `https://art-map-<yourname>.vercel.app` (update after frontend deploy)

**2.7 Deploy & Verify**
- Wait for deployment (~5 min)
- Visit: `https://art-map-backend.onrender.com/api/health`
- Should return: `{"status": "healthy", "database": "connected"}`

---

### Phase 3: Frontend Deployment to Vercel (30 min)

**3.1 Create Vercel Account**
- Sign up at https://vercel.com with GitHub (free, no credit card)

**3.2 Import Project**
- Dashboard → Add New → Project
- Import `art_map` repository
- Root Directory: `frontend`
- Framework: Create React App (auto-detected)

**3.3 Set Environment Variable**
- Key: `REACT_APP_API_URL`
- Value: `https://art-map-backend.onrender.com/api`
- Environments: Production ✓

**3.4 Deploy**
- Click "Deploy", wait ~3 minutes
- Note your URL: `https://art-map-<random>.vercel.app`
- Customize in Settings → Domains if desired

**3.5 Update Backend CORS**
- Go back to Render → art-map-backend → Environment
- Update `ALLOWED_ORIGINS`: `https://art-map-<yourname>.vercel.app`
- Save (triggers redeploy)

---

### Phase 4: Testing & Verification (30 min)

**4.1 Cold Start Test**
- Wait 20 minutes (ensure backend sleeps)
- Visit frontend URL
- Expect 15-30 sec initial load
- Subsequent requests should be fast

**4.2 Functional Testing**
- ✓ Click "Start Quiz"
- ✓ Images load from all 4 collections
- ✓ 3D globe rotates to country
- ✓ Country selection works
- ✓ Answer checking (correct/incorrect)
- ✓ Hints work (neighbors, islands)
- ✓ Child mortality data displays

**4.3 Browser Console Check**
- No CORS errors
- No 404s for images
- API calls return 200 status

**4.4 Performance Check**
- Images load within 3 seconds
- Thumbnail optimization works
- No memory errors in console

---

## Critical Files to Modify

### Must Change (5 files)
1. **[backend/requirements.txt](backend/requirements.txt)** - Add gunicorn, psycopg2-binary, Pillow, requests, python-dotenv
2. **[backend/db_utils.py](backend/db_utils.py)** - Replace sqlite3 with psycopg2 connection
3. **[backend/init_database_postgres.py](backend/init_database_postgres.py)** - NEW FILE: PostgreSQL schema + data migration
4. **[frontend/src/services/api.js](frontend/src/services/api.js)** - Use environment variable for API URL
5. **[backend/config.py](backend/config.py)** - Add DATABASE_URL, ALLOWED_ORIGINS, DEBUG env vars

### Optional (Recommended)
6. **[backend/app.py](backend/app.py)** - Update CORS to use ALLOWED_ORIGINS from config
7. **[frontend/.env.production](frontend/.env.production)** - NEW FILE: Set REACT_APP_API_URL
8. **[backend/.env.example](backend/.env.example)** - NEW FILE: Document required env vars
9. **[.github/workflows/keep-alive.yml](.github/workflows/keep-alive.yml)** - NEW FILE: Prevent cold starts (ping every 14 min)

---

## Known Issues & Solutions

### Issue 1: Cold Starts (15-30 seconds)
**Cause:** Render free tier sleeps after 15 min inactivity

**Solutions to Avoid Cold Starts:**

**Option A: UptimeRobot Keep-Alive (FREE)**
- Sign up at https://uptimerobot.com (free tier)
- Create HTTP monitor: Ping `https://art-map-backend.onrender.com/api/health` every 5 minutes
- Free tier: 50 monitors, 5-minute intervals
- **Limitation:** Only prevents sleep during waking hours
- **Setup:** 5 minutes, web-based configuration

**Option B: GitHub Actions Keep-Alive (FREE - RECOMMENDED)**
- Create `.github/workflows/keep-alive.yml`:
```yaml
name: Keep Backend Alive
on:
  schedule:
    - cron: '*/14 * * * *'  # Every 14 minutes
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - run: curl https://art-map-backend.onrender.com/api/health
```
- **Pros:** Completely free, 24/7 uptime, no cold starts, automatic with git push
- **Free tier:** 2000 minutes/month (enough for continuous pinging)
- **Setup:** Add file to repo, push to GitHub

**Option C: Render Starter Plan ($7/month)**
- No cold starts at all, guaranteed resources
- **Best for:** When project becomes professional/public

**Recommended:** **Option B (GitHub Actions)** - Free, 24/7, no cold starts, automated

### Issue 2: SQLite → PostgreSQL Query Differences
**Changes needed:**
- Placeholders: `?` → `%s`
- Auto-increment: `INTEGER PRIMARY KEY AUTOINCREMENT` → `SERIAL PRIMARY KEY`
- Row factory: `sqlite3.Row` → `psycopg2.extras.RealDictCursor`
**All queries in app.py are already compatible!** Only init script needs updating.

### Issue 3: Render PostgreSQL URL Format
**Problem:** Render uses `postgres://` but psycopg2 needs `postgresql://`
**Solution:** In db_utils.py:
```python
if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)
```

### Issue 4: Database Connection Limit (10 connections)
**Solution:** Use context managers to auto-close connections:
```python
with get_db_connection() as conn:
    cursor = conn.cursor()
    # queries here
# Connection auto-closed
```

---

## Continuous Deployment with Git Push

**Both Render and Vercel automatically deploy on git push!**

### How It Works

**After initial setup:**
1. Make code changes locally
2. Test locally
3. `git add .`
4. `git commit -m "description"`
5. `git push origin main`
6. **Automatic:** Vercel rebuilds frontend (~2 min)
7. **Automatic:** Render rebuilds backend (~3 min)
8. Live site updates automatically

**No manual deployment steps needed after initial configuration!**

### Deployment Triggers

**Vercel (Frontend):**
- Triggers on: Every push to `main` branch
- Build time: 2-3 minutes
- Preview deployments: Automatic for every branch/PR
- Rollback: One-click in dashboard

**Render (Backend):**
- Triggers on: Every push to `main` branch
- Build time: 3-5 minutes
- Auto-deploy: Enabled by default
- Rollback: Available in dashboard

### Development Workflow

**Local development:**
```bash
# Make changes
git checkout -b feature/new-artwork-collection
# ... edit files ...
npm test  # or python -m pytest

# Commit and push
git add .
git commit -m "Add new artwork collection"
git push origin feature/new-artwork-collection
```

**Vercel preview:**
- Creates preview deployment automatically
- Test at: `https://art-map-git-feature-new-artwork-yourname.vercel.app`

**Merge to production:**
```bash
git checkout main
git merge feature/new-artwork-collection
git push origin main
```

**Production deploys automatically!**

### Branch Strategy

**Recommended:**
- `main` branch → Production (auto-deploys)
- Feature branches → Preview deployments (Vercel only)
- Test features in preview before merging to main

**Configuration:**
- Vercel: Settings → Git → Production Branch: `main`
- Render: Settings → Build & Deploy → Auto-Deploy: Yes

---

## Post-Deployment Maintenance

**Monthly:** Log into Render to prevent database expiration (90-day inactivity limit)

**Monitoring:**
- Render Dashboard: CPU, memory, response times
- Vercel Analytics: Page views, build times

**Backup Strategy:**
- Database: `pg_dump $DATABASE_URL > backup.sql` (weekly recommended)
- Code: Already in GitHub
- Images: Already in git repo

---

## Estimated Timeline

- **Code Preparation:** 2 hours
- **Backend Deployment:** 1 hour
- **Frontend Deployment:** 30 minutes
- **Testing & Verification:** 30 minutes
- **Total:** ~4 hours for first-time deployment

---

## Success Criteria

✅ Frontend loads at Vercel URL
✅ Backend API responds at Render URL
✅ Database contains all 248 countries and images
✅ Quiz functionality works end-to-end
✅ Images display correctly from all collections
✅ No CORS errors in browser console
✅ Cold start completes within 30 seconds
✅ Total cost: $0/month
