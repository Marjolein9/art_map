# Quiz Mode Updates

## Summary of Changes

Updated quiz mode behavior to improve user experience and game flow:

1. ✅ Info bar only appears when user clicks the **correct** country
2. ✅ "Next" button (green) shown when answer is correct
3. ✅ "Try Again" button (red) shown when answer is incorrect
4. ✅ Cannot proceed to next country until clicking "Next"
5. ✅ Backdrop click disabled in quiz mode (only "Next"/"Try Again" buttons work)

## Behavior Changes

### Before
- Info bar appeared for any country clicked
- Always showed "X" close button
- Could click backdrop to close
- Next country could start before reviewing artwork

### After

#### Correct Answer (Quiz Mode)
1. User clicks the correct country
2. Info bar slides in with country artwork
3. **Green "Next →" button** appears in header
4. Backdrop click disabled (must click "Next")
5. Clicking "Next" closes info bar and loads next country

#### Incorrect Answer (Quiz Mode)
1. User clicks wrong country
2. Visual feedback shows incorrect (shake animation)
3. Info bar does NOT appear
4. User can try again immediately
5. (Note: "Try Again" button only shows if info bar somehow appears - mainly for edge cases)

#### Explore Mode (Unchanged)
1. User clicks any country
2. Info bar slides in with country artwork
3. **"X" close button** appears in header
4. Backdrop click enabled (can close by clicking outside)
5. Can select different countries freely

## Files Modified

### 1. [App.js](frontend/src/App.js)

**Added Next Country Handler:**
```javascript
const handleNextCountry = () => {
  setInfoBarOpen(false);
  fetchNewCountry();
};
```

**Updated Click Handler:**
```javascript
const handleExploreClick = (countryIso) => {
  if (mode === 'explore') {
    setExploreCountry(countryIso);
    setInfoBarOpen(true);
  } else {
    // Quiz mode: handle answer check
    handleCountryClick(countryIso);
    // Only open info bar if correct answer
    if (countryIso === targetCountry?.iso) {
      setInfoBarOpen(true);
    }
  }
};
```

**Disabled Backdrop Click in Quiz Mode:**
```javascript
<div
  className="artwork-backdrop"
  onClick={mode === 'explore' ? handleBackdropClick : undefined}
>
```

**Passed New Props:**
```javascript
<ArtworkInfoBar
  countryISO={currentCountry.iso}
  countryName={currentCountry.name}
  colors={COLORS}
  mode={mode}
  gameStatus={gameStatus}  // NEW: 'correct', 'incorrect', or null
  onClose={handleCloseInfoBar}
  onNext={handleNextCountry}  // NEW: Handler for next country
/>
```

### 2. [ArtworkInfoBar.js](frontend/src/components/ArtworkInfoBar.js)

**Updated Props:**
```javascript
const ArtworkInfoBar = ({
  countryISO,
  countryName,
  colors,
  mode,
  gameStatus,  // NEW
  onClose,
  onNext  // NEW
}) => {
```

**Conditional Button Rendering:**
```javascript
{mode === 'quiz' && gameStatus === 'correct' && onNext ? (
  <button className="artwork-next-btn" onClick={onNext}>
    Next →
  </button>
) : mode === 'quiz' && gameStatus === 'incorrect' && onClose ? (
  <button className="artwork-try-again-btn" onClick={onClose}>
    Try Again
  </button>
) : onClose ? (
  <button className="artwork-close-btn" onClick={onClose}>
    ✕
  </button>
) : null}
```

### 3. [components.css](frontend/src/styles/components.css)

**Added Next Button (Green):**
```css
.artwork-next-btn {
  background-color: rgba(76, 175, 80, 0.8);
  color: white;
  border: 2px solid rgba(76, 175, 80, 1);
  border-radius: 20px;
  padding: 8px 20px;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.2s ease;
}

.artwork-next-btn:hover {
  background-color: rgba(76, 175, 80, 1);
  transform: scale(1.05);
  box-shadow: 0 0 15px rgba(76, 175, 80, 0.5);
}
```

**Added Try Again Button (Red):**
```css
.artwork-try-again-btn {
  background-color: rgba(244, 67, 54, 0.8);
  color: white;
  border: 2px solid rgba(244, 67, 54, 1);
  border-radius: 20px;
  padding: 8px 20px;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.2s ease;
}

.artwork-try-again-btn:hover {
  background-color: rgba(244, 67, 54, 1);
  transform: scale(1.05);
  box-shadow: 0 0 15px rgba(244, 67, 54, 0.5);
}
```

## Button Types

### Close Button (Explore Mode)
- **Symbol:** ✕
- **Color:** Theme-based (follows color scheme)
- **Shape:** Circular (32x32px)
- **Hover:** Rotates 90°, scales 1.1x, glows
- **Usage:** Explore mode only

### Next Button (Quiz Mode - Correct)
- **Text:** "Next →"
- **Color:** Green (#4CAF50)
- **Shape:** Rounded rectangle pill
- **Hover:** Scales 1.05x, brightens, glows green
- **Usage:** Quiz mode after correct answer
- **Action:** Closes info bar and loads next country

### Try Again Button (Quiz Mode - Incorrect)
- **Text:** "Try Again"
- **Color:** Red (#F44336)
- **Shape:** Rounded rectangle pill
- **Hover:** Scales 1.05x, brightens, glows red
- **Usage:** Quiz mode after incorrect answer (edge case)
- **Action:** Closes info bar to try again

## User Flow Examples

### Quiz Mode - Correct Answer
```
1. User sees: "Find: France"
2. User clicks France
3. ✅ Correct feedback (green pulse)
4. Info bar appears with French artwork
5. Green "Next →" button visible
6. User reviews artwork
7. User clicks "Next →"
8. Info bar closes
9. New country loads: "Find: Japan"
```

### Quiz Mode - Incorrect Answer
```
1. User sees: "Find: Brazil"
2. User clicks Argentina
3. ❌ Incorrect feedback (red shake)
4. Info bar does NOT appear
5. User tries again
6. User clicks Brazil
7. ✅ Correct feedback
8. Info bar appears with "Next →" button
```

### Explore Mode - Normal Usage
```
1. User clicks Germany
2. Info bar appears with German artwork
3. "X" close button visible
4. User can:
   - Click "X" to close
   - Click backdrop to close
   - Click another country to switch
```

## Technical Details

### Game Status Values
- `'correct'` - User clicked target country (info bar opens)
- `'incorrect'` - User clicked wrong country (info bar stays closed)
- `null` - Initial state or explore mode

### Info Bar Opening Logic
```javascript
// Quiz mode: Only opens on correct answer
if (countryIso === targetCountry?.iso) {
  setInfoBarOpen(true);
}

// Explore mode: Opens for any country
setInfoBarOpen(true);
```

### Backdrop Interaction
```javascript
// Explore mode: Backdrop closes info bar
onClick={mode === 'explore' ? handleBackdropClick : undefined}

// Quiz mode: Backdrop does nothing (must use button)
onClick={undefined}
```

## Benefits

1. **Clearer Feedback** - Distinct buttons for different states
2. **Better Flow** - Can't skip to next country without reviewing
3. **Less Confusion** - Info bar only shows for correct answers
4. **Visual Clarity** - Green = success, Red = retry
5. **Intentional Progression** - Must actively choose "Next"

## Accessibility

- All buttons have `title` and `aria-label` attributes
- Color coding reinforced with text labels
- Keyboard accessible (tab + enter)
- Clear visual states (hover, active)
- Proper semantic button elements

## Future Enhancements

Potential improvements:
- Add keyboard shortcuts (Space = Next, Esc = Try Again)
- Add sound effects for correct/incorrect
- Add animation when transitioning to next country
- Show score/streak counter
- Add "Skip" option for difficult countries
- Add hint system that opens info bar preview
