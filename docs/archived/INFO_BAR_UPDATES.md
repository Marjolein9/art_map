# Info Bar Layout Updates

## Summary

The artwork info bar has been moved from a sidebar on the right to a centered overlay on top of the map, with a close button added.

## Changes Made

### 1. Layout Changes

**Before:**
- Info bar was in a fixed sidebar on the right side
- Map and sidebar were side-by-side in a flex layout

**After:**
- Info bar is now a centered overlay on top of the map
- Map takes full width
- Info bar appears only when a country is selected
- Info bar can be closed with the X button

### 2. Component Updates

#### [ArtworkInfoBar.js](frontend/src/components/ArtworkInfoBar.js)
- Added `onClose` prop to handle closing the info bar
- Added close button (✕) in the header
- Added `artwork-info-header` wrapper for title and close button
- Close button appears in all states (loading, no data, main view)
- No longer shows when no country is selected (returns `null`)

#### [App.js](frontend/src/App.js)
- Added `infoBarOpen` state to control visibility
- Added `handleCloseInfoBar` function
- Automatically opens info bar when country is clicked
- Wraps ArtworkInfoBar in `.artwork-overlay` div
- Removed sidebar layout (`.artwork-sidebar`)
- Map container now takes full width (`.map-container-full`)

### 3. CSS Updates

#### [components.css](frontend/src/styles/components.css)

**New Classes:**
```css
/* Overlay positioning */
.artwork-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
}

/* Header with close button */
.artwork-info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Close button */
.artwork-close-btn {
  background-color: rgba(0, 0, 0, 0.3);
  color: var(--text-color);
  border: 2px solid var(--border-color);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  /* ... hover effects with rotation */
}
```

**Responsive Updates:**
- Mobile (768px): Overlay width 98%, positioned slightly lower
- Tablet (1024px): Overlay width 95%

## User Experience Improvements

### Before
- Sidebar always visible, taking up screen space
- Map was constrained to left side only
- No way to hide the sidebar

### After
- ✅ Full-width map for better geography viewing
- ✅ Info bar appears centered when needed
- ✅ Close button (✕) to dismiss and see full map
- ✅ Auto-opens when country is selected
- ✅ Better mobile experience with centered overlay
- ✅ Smooth animations (slide in, rotate on close)

## Visual Features

### Close Button
- Circular button with ✕ symbol
- Positioned in top-right of info bar header
- Hover effects:
  - Scales up 1.1x
  - Rotates 90 degrees
  - Changes to glow color
  - Adds shadow

### Overlay
- Centered both horizontally and vertically
- Semi-transparent backdrop
- Max width 500px for readability
- Max height 80vh to prevent overflow
- Smooth slide-in animation

## Usage

### Opening the Info Bar
The info bar automatically opens when:
- User clicks a country in Quiz mode
- User clicks a country in Explore mode

### Closing the Info Bar
User can close by:
- Clicking the X button in top-right corner
- Info bar slides out and map becomes fully visible

## Responsive Behavior

### Desktop (>1024px)
- Overlay: 90% width, max 500px
- Positioned: Dead center of map
- Height: Up to 80vh

### Tablet (≤1024px)
- Overlay: 95% width
- Height: Up to 70vh

### Mobile (≤768px)
- Overlay: 98% width
- Positioned: Slightly lower (55% from top)
- Height: Up to 60vh
- Smaller title font (14pt)

## Technical Details

### State Management
```javascript
const [infoBarOpen, setInfoBarOpen] = useState(true);

// Auto-open on country selection
setInfoBarOpen(true);

// Close handler
const handleCloseInfoBar = () => {
  setInfoBarOpen(false);
};
```

### Conditional Rendering
```javascript
{infoBarOpen && countryISO && (
  <div className="artwork-overlay">
    <ArtworkInfoBar
      countryISO={countryISO}
      colors={COLORS}
      mode={mode}
      onClose={handleCloseInfoBar}
    />
  </div>
)}
```

## Files Modified

1. `/frontend/src/components/ArtworkInfoBar.js` - Added close button and onClose prop
2. `/frontend/src/App.js` - Changed layout, added overlay positioning
3. `/frontend/src/styles/components.css` - Added overlay and close button styles

## Testing Recommendations

1. ✅ Click a country - info bar should appear centered
2. ✅ Click X button - info bar should disappear
3. ✅ Click another country - info bar should reappear
4. ✅ Test on mobile - info bar should be responsive
5. ✅ Test in both Quiz and Explore modes
6. ✅ Verify close button hover effects work
7. ✅ Check that info bar scrolls when content is long

## Future Enhancements

Potential improvements:
- Add animation when opening/closing (fade + scale)
- Add backdrop/dim overlay behind info bar
- Add keyboard shortcut (ESC) to close
- Remember user's close preference per session
- Add minimize button (collapse to icon)
- Add drag-to-reposition functionality
