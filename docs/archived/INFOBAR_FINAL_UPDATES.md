# Info Bar - Final Updates

## Changes Made

### 1. Backdrop Click to Close
Added a semi-transparent backdrop that closes the info bar when clicked outside.

**Implementation:**
- Added `.artwork-backdrop` wrapper around the info bar
- Backdrop covers the entire map area
- Click handler checks if click is on backdrop (not propagated from info bar)
- Smooth fade-in animation for backdrop

**Visual:**
- Semi-transparent black overlay (rgba(0, 0, 0, 0.3))
- Subtle blur effect (2px backdrop-filter)
- Dims the map slightly to focus attention on info bar

### 2. Full Country Name in Title
Changed from 3-letter alpha code to full country name.

**Before:**
```
USA
```

**After:**
```
United States of America
```

**Implementation:**
- Fetches all countries on app load
- Creates lookup map: `{ "USA": "United States of America", ... }`
- Passes both `countryISO` and `countryName` to ArtworkInfoBar
- Falls back to ISO code if name not available

## Files Modified

### 1. [App.js](frontend/src/App.js)

**Added:**
```javascript
import { fetchCountries } from './services/api';

// State for country name lookup
const [countryLookup, setCountryLookup] = useState({});

// Fetch all countries for name lookup
useEffect(() => {
  fetchCountries().then(countries => {
    const lookup = {};
    countries.forEach(country => {
      lookup[country.iso3] = country.name;
    });
    setCountryLookup(lookup);
  });
}, []);

// Get current country data (both ISO and name)
const getCurrentCountryData = () => {
  if (mode === 'quiz') {
    return {
      iso: targetCountry?.iso,
      name: targetCountry?.name
    };
  } else {
    return {
      iso: exploreCountry,
      name: countryLookup[exploreCountry]
    };
  }
};

// Backdrop click handler
const handleBackdropClick = (e) => {
  if (e.target === e.currentTarget) {
    handleCloseInfoBar();
  }
};
```

**Updated JSX:**
```javascript
{infoBarOpen && currentCountry.iso && (
  <div className="artwork-backdrop" onClick={handleBackdropClick}>
    <div className="artwork-overlay">
      <ArtworkInfoBar
        countryISO={currentCountry.iso}
        countryName={currentCountry.name}  {/* NEW */}
        colors={COLORS}
        mode={mode}
        onClose={handleCloseInfoBar}
      />
    </div>
  </div>
)}
```

### 2. [ArtworkInfoBar.js](frontend/src/components/ArtworkInfoBar.js)

**Updated:**
```javascript
// Added countryName prop
const ArtworkInfoBar = ({ countryISO, countryName, colors, mode, onClose }) => {

// Display full name instead of ISO code
<h3 className="artwork-info-title">
  {countryName || countryISO}
</h3>
```

### 3. [components.css](frontend/src/styles/components.css)

**Added Backdrop:**
```css
.artwork-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  background-color: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

**Updated Overlay:**
```css
.artwork-overlay {
  z-index: 1000;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  pointer-events: auto;
  /* Removed absolute positioning - now handled by backdrop */
}
```

## User Experience

### Opening Info Bar
1. User clicks a country
2. Backdrop fades in with blur effect
3. Info bar slides in from center
4. Map is dimmed behind the overlay

### Closing Info Bar
Three ways to close:

1. **Click X button** - Closes immediately
2. **Click backdrop** - Closes when clicking outside info bar
3. **Click another country** - Replaces content with new country

### Visual Feedback
- ✅ Semi-transparent dark backdrop
- ✅ Subtle blur effect on map
- ✅ Smooth fade-in animation (0.2s)
- ✅ Info bar stands out clearly
- ✅ Backdrop click only closes (not clicks inside info bar)

## Technical Details

### Event Propagation
```javascript
const handleBackdropClick = (e) => {
  // e.target = element that received the click
  // e.currentTarget = element with the event listener
  // Only close if clicking backdrop itself (not child elements)
  if (e.target === e.currentTarget) {
    handleCloseInfoBar();
  }
};
```

### Country Name Lookup
```javascript
// Quiz mode: Name comes from targetCountry object
if (mode === 'quiz') {
  return { iso: targetCountry?.iso, name: targetCountry?.name };
}

// Explore mode: Name looked up from countries API
else {
  return { iso: exploreCountry, name: countryLookup[exploreCountry] };
}
```

### Fallback Handling
```javascript
// If name not available, show ISO code
{countryName || countryISO}
```

## Accessibility

- Backdrop can be clicked to close (alternative to X button)
- Close button has `title` and `aria-label` attributes
- Info bar content remains scrollable
- Click events don't propagate incorrectly

## Responsive Behavior

### Mobile (≤768px)
- Backdrop still works
- Info bar: 98% width
- Still centered

### Tablet (≤1024px)
- Backdrop still works
- Info bar: 95% width

### Desktop (>1024px)
- Backdrop with blur
- Info bar: 90% width, max 500px

## Examples

### Quiz Mode
```
Title: "United States of America"
(from targetCountry.name)
```

### Explore Mode
```
Title: "France"
(from countryLookup["FRA"])
```

### Fallback
```
Title: "USA"
(if name not available, shows ISO code)
```

## Benefits

1. **Better UX** - Multiple ways to close (X button or backdrop)
2. **Clear Focus** - Dimmed backdrop draws attention to info bar
3. **Intuitive** - Clicking outside to close is common UI pattern
4. **Informative** - Full country names are clearer than codes
5. **Professional** - Smooth animations and polished feel

## Testing Checklist

- [x] Click backdrop closes info bar
- [x] Click inside info bar doesn't close it
- [x] X button still works
- [x] Full country names display correctly
- [x] Quiz mode shows correct name
- [x] Explore mode looks up name correctly
- [x] Fallback to ISO code if name unavailable
- [x] Backdrop fade-in animation works
- [x] Mobile responsive (backdrop still works)
- [x] Click propagation handled correctly

## Future Enhancements

Potential improvements:
- Add ESC key to close
- Add swipe down to close on mobile
- Remember user preference for auto-open
- Add slide-in animation (not just fade)
- Add sound effect on open/close (optional)
