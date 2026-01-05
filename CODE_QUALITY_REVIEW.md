# Code Quality Review: Art Map Application

## Executive Summary

This document identifies non-best practices and amateur-looking code patterns found in the Art Map application. Issues are organized by severity and category with specific solutions for each.

**Total Issues Found:** 50+
**Critical Issues:** 2
**High Priority:** 8
**Medium Priority:** 25+
**Low Priority:** 15+

---

## Critical Issues (Fix Immediately)

### 1. Bare Except Clauses (Python Anti-Pattern)

**Severity:** CRITICAL
**Impact:** Silently swallows errors, making debugging nearly impossible

**Locations:**
- `backend/fetch_met_data.py:135-136`
- `backend/scrape_complete.py:202`
- `backend/utils/country_transformations.py:141, 150`

**Current Code:**
```python
# fetch_met_data.py:135
try:
    object_id = int(obj)
except:
    pass  # Silently ignores ALL errors
```

**Problem:** Catches ALL exceptions including SystemExit, KeyboardInterrupt, and masks bugs

**Solution:**
```python
try:
    object_id = int(obj)
except (ValueError, TypeError) as e:
    logging.warning(f"Invalid object ID format: {obj}, error: {e}")
    continue
```

**Files to Fix:**
- `backend/fetch_met_data.py:135`
- `backend/scrape_complete.py:202`
- `backend/utils/country_transformations.py:141`

---

### 2. SQL Injection Pattern (Currently Safe, But Dangerous)

**Severity:** CRITICAL
**Impact:** Could lead to SQL injection if pattern is copied or modified

**Locations:**
- `backend/cleanup_orphaned_images.py:46`
- `backend/init_database_postgres.py:543`

**Current Code:**
```python
# cleanup_orphaned_images.py:46
cursor.execute(f'SELECT filepath FROM {table} WHERE filepath IS NOT NULL')
```

**Problem:** Uses f-string interpolation instead of parameterized queries

**Why It's Currently Safe:** Table names come from hardcoded list, not user input

**Why It's Still Bad:** Sets dangerous precedent and could be copied incorrectly

**Solution:**
```python
from psycopg2 import sql

cursor.execute(
    sql.SQL('SELECT filepath FROM {} WHERE filepath IS NOT NULL').format(
        sql.Identifier(table)
    )
)
```

**Files to Fix:**
- `backend/cleanup_orphaned_images.py:46`
- `backend/init_database_postgres.py:543`

---

## High Priority Issues

### 3. Console Logging in Production Code

**Severity:** HIGH
**Impact:** Clutters production logs, reveals implementation details, unprofessional

**Count:** 15+ console statements across multiple files

**Frontend Locations:**
- `frontend/src/components/ImageGallery.mui.js:68, 421, 432, 441`
- `frontend/src/components/WorldMap.js:265, 328, 331, 338, 342`
- `frontend/src/hooks/useAsyncError.js:145, 168`
- `frontend/src/hooks/useQuiz.js:122, 151`
- `frontend/src/App.js:158, 183, 193`
- `frontend/src/services/api.js:160-161`
- `frontend/src/utils/countryCodeMapping.js:31, 71`
- `frontend/src/utils/topoJsonLoader.js:153`
- `frontend/src/components/ErrorBoundary.js:125-127`

**Backend Locations:**
- `backend/app.py:136-138, 226-227, 297, 696-697`

**Current Code Examples:**
```javascript
// ImageGallery.mui.js:68
console.log(`📏 Carousel max height set to ${tallest}px for ${collection}`);

// WorldMap.js:328
console.log(`🎯 Highlighting entire ${targetSubregion} subregion...`);

// App.js:158
console.log('[API] Trying to fetch countries...');
```

**Solution 1: Remove Debug Logs**
```javascript
// Simply delete debug statements
```

**Solution 2: Gate Behind Environment Variable**
```javascript
// utils/logger.js
export const isDev = process.env.NODE_ENV === 'development';

export const debug = (...args) => {
  if (isDev) console.log(...args);
};

export const warn = (...args) => {
  if (isDev) console.warn(...args);
};

// Then in components:
import { debug } from '../utils/logger';
debug(`📏 Carousel max height set to ${tallest}px`);
```

**Solution 3: Use Proper Logging Library**
```javascript
// Install: npm install loglevel
import log from 'loglevel';

if (process.env.NODE_ENV === 'production') {
  log.setLevel('error'); // Only errors in production
} else {
  log.setLevel('debug'); // All levels in development
}

// Replace console.log with:
log.debug(`📏 Carousel max height set to ${tallest}px`);
```

**Recommended:** Solution 2 for quick fix, Solution 3 for professional app

---

### 4. Excessive Prop Drilling in App.js

**Severity:** HIGH
**Impact:** Makes component tree fragile, hard to refactor, couples components tightly

**Location:** `frontend/src/App.js`

**Problem:** 15+ state variables passed as props through multiple component levels

**Current Pattern:**
```javascript
// App.js passes these down multiple levels:
<WorldMap
  hintsEnabled={hintsEnabled}
  setHintsEnabled={setHintsEnabled}
  selectedQuizRegion={selectedQuizRegion}
  setSelectedQuizRegion={setSelectedQuizRegion}
  showNudity={showNudity}
  setShowNudity={setShowNudity}
  quizCountriesOnly={quizCountriesOnly}
  setQuizCountriesOnly={setQuizCountriesOnly}
  // ... 11+ more props
/>
```

**Solution: React Context API**

Create separate contexts for different concerns:

```javascript
// contexts/GameSettingsContext.js
import { createContext, useContext, useState } from 'react';

const GameSettingsContext = createContext();

export const GameSettingsProvider = ({ children }) => {
  const [hintsEnabled, setHintsEnabled] = useState(true);
  const [selectedQuizRegion, setSelectedQuizRegion] = useState(null);
  const [quizCountriesOnly, setQuizCountriesOnly] = useState(true);

  const value = {
    hintsEnabled,
    setHintsEnabled,
    selectedQuizRegion,
    setSelectedQuizRegion,
    quizCountriesOnly,
    setQuizCountriesOnly,
  };

  return (
    <GameSettingsContext.Provider value={value}>
      {children}
    </GameSettingsContext.Provider>
  );
};

export const useGameSettings = () => {
  const context = useContext(GameSettingsContext);
  if (!context) {
    throw new Error('useGameSettings must be used within GameSettingsProvider');
  }
  return context;
};
```

```javascript
// In any child component:
import { useGameSettings } from '../contexts/GameSettingsContext';

function WorldMap() {
  const { hintsEnabled, setHintsEnabled } = useGameSettings();
  // Use directly, no prop drilling needed
}
```

**Files to Create:**
- `frontend/src/contexts/GameSettingsContext.js` (new)
- `frontend/src/contexts/ContentSettingsContext.js` (new)

---

### 5. Duplicate Code Across Multiple Files

**Severity:** HIGH
**Impact:** Violates DRY principle, bug fixes must be applied in 3 places

**Problem:** Same helper functions duplicated in 3 files

**Locations:**
- `frontend/src/components/ImageGallery.mui.js:77-108`
- `frontend/src/components/QuizImageDisplay.mui.js:76-123`
- `frontend/src/components/WelcomeOverlay.mui.js:58-60`

**Duplicated Code:**
```javascript
// Appears in 3 different files!
const getSourceInfo = (source) => {
  switch(source?.toLowerCase()) {
    case 'smithsonian':
      return { name: 'Smithsonian', url: 'https://www.si.edu/explore/art' };
    case 'wiki commons':
      return { name: 'Wikimedia Commons', url: 'https://commons.wikimedia.org/wiki/Main_Page' };
    // ... 10+ more cases
  }
};
```

**Solution: Extract to Shared Utility**

```javascript
// frontend/src/utils/sourceHelpers.js (NEW FILE)

/**
 * Maps source abbreviations to full display names and URLs
 */
export const getSourceInfo = (source) => {
  const sourceMap = {
    'smithsonian': {
      name: 'Smithsonian',
      url: 'https://www.si.edu/explore/art'
    },
    'wiki commons': {
      name: 'Wikimedia Commons',
      url: 'https://commons.wikimedia.org/wiki/Main_Page'
    },
    'chicago': {
      name: 'Art Institute of Chicago',
      url: 'https://www.artic.edu/'
    },
    // ... rest of mappings
  };

  const normalizedSource = source?.toLowerCase() || '';
  return sourceMap[normalizedSource] || { name: source, url: null };
};
```

Then import and use in all 3 files:

```javascript
import { getSourceInfo } from '../utils/sourceHelpers';

// Remove local getSourceInfo function
const sourceInfo = getSourceInfo(image.source);
```

---

### 6. Missing Input Validation on API Endpoints

**Severity:** HIGH
**Impact:** Could allow invalid data to reach database queries

**Locations:**
- `backend/app.py:169` (region parameter)
- `backend/app.py:234` (iso3 path parameter)
- `backend/app.py:475` (POST body in check_answer)

**Current Code:**
```python
# app.py:169 - No validation
@app.route('/api/countries', methods=['GET'])
def get_countries():
    region = request.args.get('region')  # Could be anything!
    # ... directly used in query

# app.py:475 - No validation
@app.route('/api/game/check-answer', methods=['POST'])
def check_answer():
    data = request.get_json()  # Could be None!
    selected_iso = data.get('selectedCountryIso')  # AttributeError if data is None
```

**Solution: Add Input Validation**

```python
# backend/validators.py (NEW FILE)
import re
from flask import jsonify

ISO3_PATTERN = re.compile(r'^[A-Z]{3}$')

VALID_REGIONS = {
    'Africa', 'Americas', 'Asia', 'Europe', 'Oceania', 'Antarctica'
}

class ValidationError(Exception):
    def __init__(self, message, status_code=400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

def validate_iso3(iso3: str) -> str:
    if not iso3:
        raise ValidationError('ISO3 code is required')

    iso3_upper = iso3.upper()

    if not ISO3_PATTERN.match(iso3_upper):
        raise ValidationError(f'Invalid ISO3 format: {iso3}')

    return iso3_upper

def validate_region(region: str) -> str:
    if not region:
        return None

    if region not in VALID_REGIONS:
        raise ValidationError(f'Invalid region: {region}')

    return region
```

Then use in endpoints:

```python
from validators import validate_iso3, validate_region, ValidationError

@app.errorhandler(ValidationError)
def handle_validation_error(error):
    return jsonify({'error': error.message}), error.status_code

@app.route('/api/images/<iso3>', methods=['GET'])
def get_images(iso3):
    iso3 = validate_iso3(iso3)  # Validate first
    # ... rest of code
```

---

## Medium Priority Issues

### 7. Magic Numbers and Timeouts

**Severity:** MEDIUM
**Impact:** Hard to understand, maintain, and debug timing issues

**Frontend Locations:**
- `frontend/src/App.js:424, 441` - 100ms timeout
- `frontend/src/App.js:194` - 10000ms (10 second) retry
- `frontend/src/components/WorldMap.js:373` - 5000ms timeout
- `frontend/src/components/WorldMap.js:530` - 3000ms timeout
- `frontend/src/components/ImageGallery.mui.js:39, 54, 58, 66` - 150px, 600px heights
- `frontend/src/components/ImageGallery.mui.js:431` - 2000px image dimension

**Solution: Extract to Constants**

```javascript
// frontend/src/config/constants.js (NEW FILE)
export const TIMING = {
  STATE_UPDATE_DELAY: 100,  // ms - Give React time to batch state updates
  BACKEND_RETRY_DELAY: 10000,  // ms - 10 seconds between backend reconnection attempts
  COUNTRY_CLICK_DELAY: 3000,  // ms - Delay before triggering country click in explore mode
  HINTS_TIMEOUT: 5000,  // ms - Timeout for hints fetch operation
};

export const IMAGE = {
  MIN_HEIGHT: 150,  // px - Minimum carousel height
  MAX_HEIGHT: 600,  // px - Maximum carousel height
  LARGE_IMAGE_THRESHOLD: 2000,  // px - Warn if image is larger than this
};
```

Usage:
```javascript
import { TIMING, IMAGE } from './config/constants';

setTimeout(() => fetchNewCountry(), TIMING.STATE_UPDATE_DELAY);
```

---

### 8. Nested Ternary Operators (Readability)

**Severity:** MEDIUM
**Impact:** Hard to read, maintain, and debug

**Location:** `frontend/src/components/ArtworkInfoBar.js:363-377`

**Current Code:**
```javascript
{mode === 'quiz' && answerSubmitted
  ? isCorrectAnswer
    ? wikipediaUrl ? (
        <>Correct: <a href={wikipediaUrl}...>{countryName || countryISO}</a></>
      ) : `Correct: ${countryName || countryISO}`
    : wikipediaUrl ? (
        <>Incorrect: <a href={wikipediaUrl}...>{countryName || countryISO}</a></>
      ) : `Incorrect: ${countryName || countryISO}`
  : wikipediaUrl ? (
      <a href={wikipediaUrl}...>{countryName || countryISO}</a>
    ) : (countryName || countryISO)}
```

**Problem:** 4 levels of nesting - extremely hard to parse mentally

**Solution: Extract to Helper Component**

```javascript
const CountryTitle = ({ mode, answerSubmitted, isCorrectAnswer, countryName, countryISO, wikipediaUrl }) => {
  const countryDisplay = wikipediaUrl ? (
    <a href={wikipediaUrl} target="_blank" rel="noopener noreferrer">
      {countryName || countryISO}
    </a>
  ) : (
    countryName || countryISO
  );

  if (mode !== 'quiz' || !answerSubmitted) {
    return countryDisplay;
  }

  const prefix = isCorrectAnswer ? 'Correct: ' : 'Incorrect: ';
  return <>{prefix}{countryDisplay}</>;
};

// Then in render:
<Typography variant="h5">
  <CountryTitle {...props} />
</Typography>
```

---

### 9. Direct DOM Manipulation (Anti-Pattern)

**Severity:** MEDIUM
**Impact:** Breaks React's declarative paradigm, brittle code

**Location:** `frontend/src/components/QuizImageDisplay.mui.js:409-412`

**Current Code:**
```javascript
<img
  onError={(e) => {
    e.target.style.display = 'none';      // Direct DOM manipulation!
    e.target.nextSibling.style.display = 'flex';  // Relies on DOM structure!
  }}
/>
```

**Solution: Use React State**

```javascript
const [imageError, setImageError] = useState(false);

// In render:
{!imageError ? (
  <img
    src={imageUrl}
    onError={() => setImageError(true)}
  />
) : (
  <Box>Image unavailable</Box>
)}
```

---

### 10. Outdated Cancellation Pattern

**Severity:** MEDIUM
**Impact:** Error-prone, outdated pattern

**Location:** `frontend/src/App.js:143-214`

**Current Code:**
```javascript
useEffect(() => {
  let cancelled = false;  // Manual cancellation flag

  const loadCountries = async () => {
    if (cancelled) return;
    // ...
  };

  return () => { cancelled = true; };
}, []);
```

**Solution: Use AbortController (Modern Pattern)**

```javascript
useEffect(() => {
  const controller = new AbortController();

  const loadCountries = async () => {
    try {
      const countries = await fetchCountries({ signal: controller.signal });
      // ...
    } catch (error) {
      if (error.name === 'AbortError') return;
      // Handle error
    }
  };

  loadCountries();

  return () => controller.abort();
}, []);
```

---

### 11. Missing Type Safety

**Severity:** MEDIUM
**Impact:** Runtime errors from invalid props

**Problem:** No component has PropTypes or TypeScript validation

**Solution: Add PropTypes**

```javascript
// Install: npm install --save prop-types

import PropTypes from 'prop-types';

WorldMap.propTypes = {
  mode: PropTypes.oneOf(['quiz', 'explore']).isRequired,
  targetCountry: PropTypes.string,
  onCountryClick: PropTypes.func.isRequired,
  hintsEnabled: PropTypes.bool,
  // ... etc
};
```

---

### 12. Global State Anti-Pattern (Python)

**Severity:** MEDIUM
**Impact:** Not thread-safe, hard to test

**Location:** `backend/generate_country_maps.py:32-45`

**Current Code:**
```python
_topojson_50m_cache = None  # Global cache variable

def load_topojson_50m():
    global _topojson_50m_cache
    if _topojson_50m_cache is not None:
        return _topojson_50m_cache
```

**Solution: Use functools.lru_cache**

```python
from functools import lru_cache

@lru_cache(maxsize=1)
def load_topojson_50m():
    """Thread-safe caching with lru_cache"""
    file_path = os.path.join(os.path.dirname(__file__), 'data', 'countries-50m.json')
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)
```

---

### 13. Inconsistent Error Handling (Backend)

**Severity:** MEDIUM
**Impact:** Hard to debug production issues

**Locations:**
- `backend/app.py:134-142` - Import inside exception handler
- `backend/app.py:224-230` - Generic exception catching

**Current Code:**
```python
except Exception as e:
    import traceback  # Importing inside exception handler (anti-pattern)
    print(f"Error in get_countries: {str(e)}")
    print(traceback.format_exc())
```

**Solution: Use Proper Logging**

```python
import logging
import traceback

logging.basicConfig(
    level=logging.INFO if not DEBUG else logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# In error handlers:
except Exception as e:
    logger.error(f"Error in get_countries: {str(e)}", exc_info=True)
```

---

## Low Priority Issues

### 14. Git Ignore Missing .numbers Files

**Severity:** LOW
**Impact:** Repository clutter

**Problem:** Git status shows untracked macOS Numbers files

**Solution: Update .gitignore**

```bash
# .gitignore

# macOS Numbers/Pages/Keynote files
*.numbers
*.pages
*.key
```

---

### 15. Unused package.json in Python Backend

**Severity:** LOW
**Impact:** Confusing project structure

**Location:** `backend/package.json`

**Problem:** Backend is entirely Python (Flask), but has a Node.js package.json

**Solution: Delete It**

```bash
rm backend/package.json
```

---

### 16. Inconsistent File Naming Convention

**Severity:** LOW
**Impact:** Confusing project structure

**Problem:** Mix of `.js` and `.mui.js` suffixes

**Files:**
- `ImageGallery.mui.js` - Uses MUI
- `WorldMap.js` - Also uses MUI, but no `.mui.js` suffix

**Solution:** Remove `.mui` suffix from all files for consistency

---

### 17. Hard-Coded Configuration Duplicates

**Severity:** LOW
**Impact:** Maintenance burden

**Locations:**
- `backend/config.py:110, 114, 119, 123`
- `backend/fetch_met_data.py:23-25` (duplicates)

**Solution: Single Source of Truth**

```python
# backend/fetch_met_data.py
from config import API_REQUEST_DELAY, MAX_IMAGE_DIMENSION, JPEG_QUALITY

# Remove local definitions
```

---

### 18. Missing Documentation for Complex Logic

**Severity:** LOW
**Impact:** Harder for new developers to understand

**Solution: Add JSDoc/Docstrings**

```javascript
/**
 * Custom hook for handling async operations with retry logic
 *
 * @param {Function} asyncFn - The async function to execute
 * @param {Object} options - Configuration options
 * @returns {Object} Object containing execute, loading, error, data
 */
export const useAsyncError = (asyncFn, options = {}) => {
  // Implementation
};
```

---

## Summary & Recommendations

### Quick Wins (1-2 hours)
1. Remove/gate console.log statements
2. Add `*.numbers` to .gitignore
3. Delete unused `backend/package.json`
4. Fix bare except clauses
5. Extract magic numbers to constants

### Medium Effort (4-8 hours)
6. Extract duplicate source mapping functions
7. Add input validation to API endpoints
8. Replace nested ternaries with helper functions
9. Fix direct DOM manipulation with React state
10. Add PropTypes to all components

### Larger Refactors (1-2 days)
11. Implement Context API to fix prop drilling
12. Upgrade to AbortController for fetch cancellation
13. Replace print() with proper logging framework
14. Add comprehensive JSDoc/docstrings

### Long-term Improvements
15. Migrate to TypeScript for type safety
16. Implement proper state management (Zustand/Redux)
17. Add end-to-end testing
18. Set up CI/CD for code quality checks

---

## Priority Matrix

| Issue | Severity | Effort | Priority |
|-------|----------|--------|----------|
| Bare except clauses | Critical | Low | **P0** |
| SQL injection pattern | Critical | Low | **P0** |
| Console logs | High | Low | **P1** |
| Input validation | High | Medium | **P1** |
| Duplicate code | High | Low | **P1** |
| Prop drilling | High | High | **P2** |
| Magic numbers | Medium | Low | **P2** |
| Nested ternaries | Medium | Low | **P2** |
| DOM manipulation | Medium | Low | **P2** |

---

## Implementation Order

### Week 1: Critical & High Priority
1. Fix bare except clauses (1 hour)
2. Fix SQL injection patterns (1 hour)
3. Remove/gate console logs (2 hours)
4. Extract duplicate functions (2 hours)
5. Add input validation (3 hours)
6. Extract magic numbers (2 hours)

### Week 2: Medium Priority
7. Fix nested ternaries (1 hour)
8. Fix DOM manipulation (1 hour)
9. Add PropTypes (4 hours)
10. Implement Context API (6 hours)
11. Upgrade to AbortController (2 hours)

### Week 3: Polish & Documentation
12. Fix global state caching (1 hour)
13. Improve error handling/logging (4 hours)
14. Add documentation (4 hours)
15. Fix .gitignore and naming (1 hour)

---

**End of Report**
