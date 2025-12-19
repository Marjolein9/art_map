# Art Map Code Comments - Quick Reference Guide
## Interview Preparation Index

This file is your quick reference guide to find specific interview topics and code explanations throughout the codebase.

---

## Quick Navigation by Topic

### BACKEND TOPICS

#### REST API & Flask
- **File**: `backend/app.py` (lines 1-100)
- **Topics**: REST fundamentals, HTTP methods, request/response patterns
- **Questions**: "Why Flask over Django?" | "What's CORS?" | "Why stateless?"

#### Database & SQL
- **File**: `backend/db_utils.py` (all lines)
- **Topics**: Connection management, parameterized queries, SQL injection prevention
- **Questions**: "Why use helper functions?" | "PostgreSQL setup?" | "How to prevent leaks?"

#### Configuration Management
- **File**: `backend/config.py` (all lines)
- **Topics**: Environment variables, configuration centralization, dev vs production
- **Questions**: "Why centralize config?" | "How to set DEBUG mode?" | "ALLOWED_ORIGINS?"

#### Data Pipelines (ETL)
- **File**: `backend/fetch_met_data.py` (lines 1-150)
- **Topics**: API rate limiting, image processing, error handling
- **Questions**: "Why throttle API calls?" | "How to optimize images?" | "Timeout handling?"

#### Data Transformation
- **File**: `backend/add_common_names.py` (lines 1-100)
- **Topics**: String processing, fallback strategies, set operations
- **Questions**: "Why fallbacks?" | "Set vs List?" | "How to standardize data?"

---

### FRONTEND TOPICS

#### React Fundamentals
- **File**: `frontend/src/App.js` (lines 1-150)
- **Topics**: useState, useEffect, useRef, component state
- **Questions**: "What are hooks?" | "useState vs useRef?" | "Memory leaks?" | "Race conditions?"

#### Advanced Hooks
- **File**: `frontend/src/App.js` (lines 150-250)
- **Topics**: Custom hooks, effect dependencies, cleanup functions
- **Questions**: "Why cleanup?" | "Dependency arrays?" | "useEffect timing?"

#### Event Handling
- **File**: `frontend/src/App.js` (lines 250-350)
- **Topics**: Event delegation, handler patterns, state updates
- **Questions**: "e.target vs e.currentTarget?" | "Event bubbling?" | "Handler patterns?"

#### 3D Maps & Libraries
- **File**: `frontend/src/components/WorldMap.js` (lines 1-100)
- **Topics**: Third-party library integration, geospatial data
- **Questions**: "How to integrate Globe.js?" | "Handle window resize?" | "3D performance?"

#### Modal & Animation Patterns
- **File**: `frontend/src/components/WelcomeOverlay.js` (lines 1-100)
- **Topics**: Controlled transitions, CSS animations, backdrop click handling
- **Questions**: "Why setTimeout for animations?" | "Backdrop click?" | "React Fragment?"

#### Conditional Rendering
- **File**: `frontend/src/components/ExternalLinks.js` (all lines)
- **Topics**: Early returns, optional chaining, nullish coalescing
- **Questions**: "Why .trim()?" | "?. vs ??" | "Return null or empty div?"

#### Data Visualization
- **File**: `frontend/src/components/ChildMortalitySection.js` (all lines)
- **Topics**: Visual metaphors, data transformation, formatting numbers
- **Questions**: "Why candles not charts?" | "toFixed() usage?" | "Conditional rendering?"

#### API & HTTP
- **File**: `frontend/src/services/api.js` (all lines)
- **Topics**: async/await, Fetch API, error handling
- **Questions**: "Async/await for Python devs?" | "Why async?" | "Promise basics?"

---

### STYLING TOPICS

#### CSS Architecture
- **File**: `frontend/src/styles/components.css` (lines 1-150)
- **Topics**: CSS variables, BEM naming, theming
- **Questions**: "Why CSS variables?" | "Dark mode implementation?" | "BEM benefits?"

#### Flexbox & Layout
- **File**: `frontend/src/styles/components.css` (lines 150-400)
- **Topics**: Responsive design, justify-content, align-items
- **Questions**: "Flexbox vs Float?" | "Mobile-first approach?" | "Flex-wrap?"

#### Visual Effects
- **File**: `frontend/src/styles/components.css` (lines 400-600)
- **Topics**: Shadows, blur effects, animations
- **Questions**: "Backdrop filter cost?" | "Box shadow layers?" | "ease-in-out?"

#### Performance & Accessibility
- **File**: `frontend/src/styles/components.css` (lines 600-800)
- **Topics**: Z-index stacking, custom scrollbars, WCAG compliance
- **Questions**: "Z-index conflicts?" | "Scrollbar styling?" | "Contrast ratios?"

---

## Common Interview Questions Index

### Question: "Tell us about your tech stack"
**Answer Template**: 
- Backend: Python Flask (lightweight, unopinionated), PostgreSQL (structured data)
- Frontend: React (hooks, components), Globe.js (3D visualization)
- Deployment: Vercel (frontend), Render (backend)

**Where to find code**:
- Backend architecture: `backend/app.py` (first 50 lines)
- Frontend structure: `frontend/src/App.js` (first 50 lines)

---

### Question: "Walk us through your data pipeline"
**Answer Template**:
1. Extract: Fetch from Met Museum API, parse JSON
2. Transform: Resize images, convert formats, optimize
3. Load: Store in PostgreSQL and filesystem

**Where to find code**: `backend/fetch_met_data.py`

---

### Question: "How do you handle state in React?"
**Answer Template**:
1. useState for values that change
2. useEffect for side effects
3. useRef for persisted values without re-renders
4. Custom hooks for reusable logic

**Where to find code**: `frontend/src/App.js` (lines 30-100)

---

### Question: "What performance optimizations did you make?"
**Answer Template**:
- Backend: Connection pooling, image compression, rate limiting
- Frontend: Memoization (useMemo), CSS optimization, lazy loading images
- Database: Indexing, parameterized queries

**Where to find code**:
- Backend: `backend/app.py` (image serving section)
- Frontend: `frontend/src/components/WorldMap.js` (useMemo usage)
- CSS: `frontend/src/styles/components.css` (lines 1-50)

---

### Question: "How do you handle errors?"
**Answer Template**:
- Backend: try/except, retry logic, graceful degradation
- Frontend: fetch error handling, loading states, user feedback
- Database: Connection error recovery, timeout handling

**Where to find code**:
- Backend: `backend/fetch_met_data.py` (lines 80-120)
- Frontend: `frontend/src/App.js` (lines 120-170)

---

### Question: "Explain your database schema"
**Answer Template**:
- Countries (id, iso3, m49, name, common_name, is_country)
- Images (id, filepath, collection_type, country_id)
- Child Mortality (country_code, year, rate)
- External Links (iso3, gapminder_url, tasteatlas_url)

**Where to find code**: `backend/app.py` (SQL queries throughout)

---

### Question: "How do you secure your application?"
**Answer Template**:
- SQL injection: Use parameterized queries
- CORS: Whitelist allowed origins
- XSS: Sanitize external links with rel="noopener noreferrer"
- Environment: Use environment variables for secrets

**Where to find code**:
- Parameterized queries: `backend/app.py` (any SQL SELECT)
- CORS: `backend/app.py` (top of file)
- Link security: `frontend/src/components/ExternalLinks.js`

---

### Question: "How would you scale this application?"
**Answer Template**:
- Caching: Redis for API responses, CDN for images
- Database: Read replicas, connection pooling, query optimization
- Frontend: Code splitting, lazy loading, service workers
- Infrastructure: Auto-scaling, load balancing, monitoring

**Where to find discussion**: 
- Each file has "Interview Q: 'How would you improve?'" sections

---

## Learning Paths

### Path 1: Backend Engineer Interview
1. Read: `backend/config.py` (understand configuration)
2. Read: `backend/db_utils.py` (database fundamentals)
3. Read: `backend/app.py` (API design)
4. Read: `backend/fetch_met_data.py` (data pipeline)
5. Practice: Explain each module's purpose and design decisions

### Path 2: Frontend Engineer Interview
1. Read: `frontend/src/App.js` (React fundamentals)
2. Read: `frontend/src/components/WorldMap.js` (advanced patterns)
3. Read: `frontend/src/services/api.js` (HTTP patterns)
4. Read: `frontend/src/styles/components.css` (CSS architecture)
5. Practice: Explain component hierarchy and data flow

### Path 3: Full-Stack Engineer Interview
1. Follow Backend path (3 files)
2. Follow Frontend path (3 files)
3. Understand how they communicate: API contracts, data formats
4. Practice: Explain end-to-end data flow

### Path 4: Data/Infrastructure Engineer Interview
1. Read: `backend/fetch_met_data.py` (data processing)
2. Read: `backend/add_common_names.py` (data transformation)
3. Read: `backend/init_database_postgres.py` (if available)
4. Understand: Data quality, validation, ETL patterns
5. Practice: Explain data pipeline and optimization strategies

---

## Code Example Quick Links

### Example 1: Parameterized Query (SQL Injection Prevention)
```python
# Location: backend/app.py, line ~200
cursor.execute('SELECT iso3, name FROM countries WHERE iso3 = %s', (iso3,))
```
**Interview Point**: "Never concatenate SQL strings. Always use parameters."

### Example 2: useEffect with Cleanup
```javascript
// Location: frontend/src/App.js, lines 90-130
useEffect(() => {
  let cancelled = false;
  // ... async work ...
  return () => { cancelled = true; }; // cleanup
}, []);
```
**Interview Point**: "Cleanup prevents memory leaks and race conditions."

### Example 3: CSS Variables for Theming
```css
/* Location: frontend/src/styles/components.css, lines 10-30 */
:root {
  --text-primary: rgba(229, 229, 229, 0.7);
  --card-bg: var(--bg-brown-dark);
}
```
**Interview Point**: "Variables enable dynamic theming and maintainability."

### Example 4: Optional Chaining
```javascript
// Location: frontend/src/components/ExternalLinks.js, line 50
{externalLinks?.gapminder_url?.trim() && (
  <a href={...}>Link</a>
)}
```
**Interview Point**: "Optional chaining safely accesses nested properties."

---

## Interview Tips

### 1. **Structure Your Answers**
- Start with overview (what does this module do?)
- Explain key design decisions
- Discuss trade-offs and alternatives
- Show code example if relevant

### 2. **Use the Comments as Notes**
- Each file has "Interview Q:" questions
- These are likely topics you'll be asked
- Practice explaining without looking at answers first

### 3. **Connect Frontend and Backend**
- Example: Explain how image data flows from API to component
- Example: Explain how user clicks on map trigger data fetch
- Full-stack thinking impresses interviewers

### 4. **Discuss Performance**
- Caching, indexing, lazy loading
- Show you think about user experience
- Mention optimization trade-offs

### 5. **Show Security Awareness**
- SQL injection, CORS, XSS
- Environment variables, authentication
- Shows maturity and professionalism

---

## Additional Resources

### Within This Codebase
- Main app entry: `frontend/src/App.js`
- API documentation: `backend/app.py` (each route has docstring)
- Database setup: `backend/init_database_postgres.py`
- Data flow diagram: Check component imports and data props

### To Explore Further
1. Try modifying a component and see effects
2. Add a new feature to practice patterns
3. Write tests for tricky functions
4. Refactor code to improve readability
5. Document additional edge cases

---

## Success Checklist for Interview

- [ ] Can explain every file's purpose
- [ ] Can trace data from user interaction to database and back
- [ ] Can discuss at least 2 design decisions and their trade-offs
- [ ] Can explain what you'd do differently if building again
- [ ] Can discuss performance optimization strategies
- [ ] Can explain security considerations
- [ ] Can show code examples for key concepts
- [ ] Can discuss testing strategies
- [ ] Can explain your architecture choices
- [ ] Can discuss how you'd scale the application

---

**Last Updated:** December 18, 2025  
**Total Files Documented:** 13  
**Interview Topics Covered:** 80+  
**Good luck with your interviews!** 🚀
