# Frontend - React Application

This is the frontend for the Art Map Quiz application. It's a React single-page application with a 3D globe interface.

## What is React?

React is a JavaScript library for building user interfaces. Key concepts:

- **Components**: Reusable pieces of UI (like LEGO blocks)
- **State**: Data that can change (like score, current country)
- **Props**: Data passed from parent to child components
- **Hooks**: Functions that let you use state and other React features

## Architecture Overview

```
User Interaction → React Components → Custom Hooks → API Service → Backend
      ↓                  ↓                 ↓             ↓
  Click country    WorldMap.js        useQuiz.js    api.js
```

## File Structure

```
frontend/src/
├── App.js                  # Main component (entry point)
├── components/             # React UI components
│   ├── WorldMap.js        # 3D globe component
│   └── ArtworkInfoBar.js  # Artwork display sidebar
├── hooks/                  # Custom React hooks
│   └── useQuiz.js         # Quiz game logic
├── services/               # API communication
│   └── api.js             # Backend API calls
├── config/                 # Configuration files
│   ├── constants.js       # API URL, colors
│   └── regions.js         # Globe rotation coordinates
├── styles/                 # Styling
│   └── colorSchemes.js    # Color themes
└── utils/                  # Utility functions
    └── countryCodeMapping.js  # Country name ↔ ISO code
```

## Key Concepts Explained

### 1. Components

Components are JavaScript functions that return HTML-like code (JSX):

```javascript
function ArtworkInfoBar({ countryISO, colors }) {
  // Component logic here
  return (
    <div style={{backgroundColor: colors.cardBg}}>
      <h3>Artwork Info</h3>
    </div>
  );
}
```

**Think of it like:**
- Python function that returns HTML
- Can accept parameters (called "props")
- Reusable across the app

### 2. State (useState)

State is data that can change and causes re-render:

```javascript
const [count, setCount] = useState(0);  // Initial value: 0

// To update:
setCount(5);  // count is now 5, component re-renders
```

**How it works:**
1. `useState(0)` creates state variable with initial value 0
2. Returns array: `[currentValue, functionToUpdate]`
3. When you call `setCount(5)`, React re-renders component with new value

**Like Python:**
```python
# Not exactly the same, but conceptually similar:
count = 0  # Initial value
count = 5  # Update (but React needs setState to trigger re-render)
```

### 3. Effects (useEffect)

Run code when something changes:

```javascript
useEffect(() => {
  // This code runs when countryISO changes
  fetchArtworks(countryISO);
}, [countryISO]);  // Dependency array
```

**Parameters:**
- First: Function to run
- Second: Array of dependencies (when to run)

**Common patterns:**
```javascript
useEffect(() => {
  // Run once when component loads
}, []);

useEffect(() => {
  // Run when 'count' changes
}, [count]);

useEffect(() => {
  // Run after every render
});  // No dependency array
```

### 4. Custom Hooks

Reusable logic extracted into a function:

```javascript
// Instead of this in every component:
const [loading, setLoading] = useState(false);
const [data, setData] = useState(null);
useEffect(() => { /* fetch logic */ }, []);

// Create custom hook:
function useQuiz() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  // ... all the logic
  return { loading, data };
}

// Use it:
const { loading, data } = useQuiz();
```

**Like Python:**
Think of hooks as reusable functions that you can call

### 5. Props

Data passed from parent to child:

```javascript
// Parent component
<ArtworkInfoBar countryISO="USA" colors={COLORS} />

// Child component receives props
function ArtworkInfoBar({ countryISO, colors }) {
  // Use countryISO and colors here
}
```

**Like Python function arguments:**
```python
def artwork_info_bar(country_iso, colors):
    # Use country_iso and colors here
```

## Main Components

### App.js - Main Component

**What it does:**
- Root component of the application
- Manages global state (color scheme, tooltips)
- Uses `useQuiz` hook for game logic
- Renders WorldMap and ArtworkInfoBar

**Key state:**
```javascript
const { targetCountry, loading, gameStatus, handleCountryClick } = useQuiz();
const [selectedColorScheme, setSelectedColorScheme] = useState('vintage');
const [tooltipsEnabled, setTooltipsEnabled] = useState(true);
```

**Flow:**
1. On mount: `useQuiz` fetches random country
2. Displays globe and artwork
3. User clicks country
4. `handleCountryClick` checks answer
5. Updates game status (correct/incorrect)
6. Auto-starts new round if correct

### WorldMap.js - 3D Globe

**What it does:**
- Displays interactive 3D globe using react-globe.gl
- Rotates to specific regions
- Handles country clicks
- Shows quiz overlay

**Key features:**
- Globe rotation based on target region
- Country highlighting on hover
- Color changes based on game status
- Tooltip display

**Props received:**
```javascript
{
  onCountryClick: function,      // Called when country clicked
  targetCountry: string,         // ISO3 code of target
  targetCountryName: string,     // Name to display
  region: string,               // Region to rotate to
  gameStatus: string,           // 'playing', 'correct', 'incorrect'
  tooltipsEnabled: boolean,     // Show tooltips or not
  colors: object               // Color scheme
}
```

### ArtworkInfoBar.js - Artwork Display

**What it does:**
- Displays artwork for the target country
- Fetches artwork data from API
- Shows loading state
- Scrollable list of artworks

**How it works:**
```javascript
useEffect(() => {
  if (!countryISO) return;
  
  fetchArtworks(countryISO)  // API call
    .then(data => {
      const withImages = data.filter(art => art.image_path);
      setArtworks(withImages);
    });
}, [countryISO]);  // Re-fetch when country changes
```

## Custom Hooks

### useQuiz.js - Game Logic

**What it does:**
- Manages quiz game state
- Fetches random countries
- Checks answers
- Handles game flow

**State managed:**
```javascript
{
  targetCountry: object,    // Current quiz country
  loading: boolean,         // Loading state
  gameStatus: string,       // 'playing', 'correct', 'incorrect'
}
```

**Functions provided:**
```javascript
{
  handleCountryClick: function,  // Check answer
  fetchNewCountry: function,     // Start new round
}
```

**Flow:**
1. Initialize: Fetch random country
2. User clicks country
3. Call `handleCountryClick(iso)`
4. Check answer with API
5. If correct: wait 2s, fetch new country
6. If incorrect: wait 1.5s, reset to 'playing'

## Services Layer

### api.js - API Communication

**What it does:**
- Centralized API calls
- Abstracts away fetch() details
- Clean interface for components

**Functions:**
```javascript
fetchRandomCountry()           // GET /api/game/random-country
fetchArtworks(iso3)            // GET /api/artworks?iso3=...
checkAnswer(selected, target)  // POST /api/game/check-answer
```

**Why separate?**
- Don't repeat fetch code
- Easy to change API URL
- Can add error handling in one place

**Example:**
```javascript
// Instead of this in components:
fetch('http://localhost:5000/api/artworks?iso3=USA')
  .then(res => res.json())
  .then(data => ...)

// Use this:
import { fetchArtworks } from './services/api';
fetchArtworks('USA').then(artworks => ...)
```

## Configuration

### constants.js

Centralized constants:
```javascript
export const API_URL = 'http://localhost:5000/api';
export const MAP_COLORS = { ... };
```

### regions.js

Globe rotation coordinates:
```javascript
export const REGION_VIEWS = {
  'North America': { lat: 50, lng: -100, altitude: 1.5 },
  'Europe': { lat: 52, lng: 15, altitude: 1.3 },
  // ...
};
```

**Why?**
When quiz shows Japan, globe rotates to East Asia coordinates.

## React Patterns Used

### Conditional Rendering

Show different UI based on state:

```javascript
if (loading) {
  return <div>Loading...</div>;
}

if (!countryISO) {
  return <div>Waiting for quiz...</div>;
}

return <div>Show artwork...</div>;
```

### Array Mapping

Render list of items:

```javascript
{artworks.map(artwork => (
  <div key={artwork.id}>
    <img src={artwork.image_path} />
    <p>{artwork.artist_name}</p>
  </div>
))}
```

**Like Python:**
```python
for artwork in artworks:
    print(f"<div>{artwork.artist_name}</div>")
```

### Event Handlers

Respond to user actions:

```javascript
<button onClick={() => fetchNewCountry()}>
  New Game
</button>

<div onMouseEnter={() => setHover(true)}>
  Hover me
</div>
```

## Styling

### Inline Styles

```javascript
<div style={{
  backgroundColor: colors.cardBg,
  padding: '20px',
  borderRadius: '8px'
}}>
  Content
</div>
```

**Note:** JavaScript object, not CSS
- Properties are camelCase: `backgroundColor` not `background-color`
- Values are strings: `'20px'` not `20px`

### Color Schemes

Multiple themes in `colorSchemes.js`:
- vintage (beige/brown)
- space (dark blue)
- ocean (blue)
- forest (green)
- etc.

User can switch themes via dropdown.

## Data Flow Example

Let's trace what happens when user clicks a country:

1. **User clicks South Africa on globe**
   ```
   User Click → WorldMap.js → onCountryClick('ZAF')
   ```

2. **WorldMap calls parent's handler**
   ```
   WorldMap.js → App.js → handleCountryClick('ZAF')
   ```

3. **handleCountryClick from useQuiz**
   ```
   useQuiz.js → checkAnswer('ZAF', targetCountry.iso)
   ```

4. **API call to backend**
   ```
   api.js → POST /api/game/check-answer
   ```

5. **Backend responds**
   ```
   { correct: true }
   ```

6. **Update game status**
   ```
   setGameStatus('correct')
   ```

7. **React re-renders**
   ```
   WorldMap shows green color
   Overlay shows "Correct!"
   ```

8. **After 2 seconds**
   ```
   fetchNewCountry() → new quiz starts
   ```

## Running the Frontend

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm start
```

Runs on http://localhost:3000

### Build for Production

```bash
npm run build
```

Creates optimized build in `build/` folder

## Common Issues

### Backend not running

**Error:** Network error, fetch failed

**Solution:**
- Start backend: `cd backend && python3 app.py`
- Check backend is on http://localhost:5000

### Module not found

**Error:** `Cannot find module 'react-globe.gl'`

**Solution:**
```bash
npm install
```

### CORS error

**Error:** "blocked by CORS policy"

**Solution:**
- Check backend has `CORS(app)`
- Restart backend server

## Development Tips

### React DevTools

Install [React Developer Tools](https://react.dev/learn/react-developer-tools) browser extension to:
- Inspect component tree
- View props and state
- Debug performance

### Console Logging

Add logging to understand flow:

```javascript
useEffect(() => {
  console.log('Country changed to:', countryISO);
  fetchArtworks(countryISO);
}, [countryISO]);
```

### Hot Reload

Changes auto-reload in browser during development.

### Component Breakdown

When component gets complex:
1. Identify reusable parts
2. Extract to new component
3. Pass data via props

## Learning Path

1. **Start with App.js**
   - See how components fit together
   - Understand props flow

2. **Read useQuiz.js**
   - See how hooks manage state
   - Understand async operations

3. **Study api.js**
   - Learn fetch API
   - See how promises work

4. **Explore WorldMap.js**
   - See complex component
   - Understand useEffect usage

5. **Try modifying**
   - Add new color scheme
   - Change quiz timeout
   - Add new API endpoint

## Resources

- [React Documentation](https://react.dev/)
- [React Hooks Guide](https://react.dev/reference/react)
- [JavaScript Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

## Next Steps

1. Read through App.js with the comments
2. Understand how useQuiz hook works
3. See how components communicate
4. Try adding a new feature
