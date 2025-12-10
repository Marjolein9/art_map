# Quiz Mode - Final Behavior

## Changes Made

Fixed quiz mode to show info bar for BOTH correct and incorrect answers, and ensure new country assignments wait for user interaction.

## Updated Behavior

### Quiz Mode Flow

#### 1. New Country Assigned
```
✅ NEW: Info bar is CLOSED
❌ OLD: Info bar was open automatically
```
- New country loads
- Map shows the country name to find
- Info bar does NOT appear yet
- User must click a country to see artwork

#### 2. User Clicks INCORRECT Country
```
1. User clicks wrong country (e.g., clicks Spain when answer is France)
2. ❌ Map shows incorrect feedback (red shake animation)
3. 🔴 Info bar opens showing Spain's artwork
4. "Try Again" button visible (red button)
5. User clicks "Try Again"
6. Info bar closes
7. User can try again
```

#### 3. User Clicks CORRECT Country
```
1. User clicks correct country (e.g., clicks France when answer is France)
2. ✅ Map shows correct feedback (green pulse animation)
3. 🟢 Info bar opens showing France's artwork
4. "Next →" button visible (green button)
5. User reviews artwork
6. User clicks "Next →"
7. Info bar closes
8. New country loads (info bar stays closed)
```

### Explore Mode (Unchanged)
```
1. User clicks any country
2. Info bar opens with country artwork
3. "X" close button visible
4. Can close by:
   - Clicking X button
   - Clicking backdrop (outside info bar)
   - Clicking another country
```

## Key Changes

### 1. Info Bar Opens for ALL Clicks in Quiz Mode
**Before:**
```javascript
// Only opened on correct answer
if (countryIso === targetCountry?.iso) {
  setInfoBarOpen(true);
}
```

**After:**
```javascript
// Opens for any country clicked
handleCountryClick(countryIso);
setInfoBarOpen(true);  // Always opens
```

### 2. Info Bar Starts Closed
**Before:**
```javascript
const [infoBarOpen, setInfoBarOpen] = useState(true);  // ❌ Started open
```

**After:**
```javascript
const [infoBarOpen, setInfoBarOpen] = useState(false);  // ✅ Starts closed
```

### 3. New Country Doesn't Auto-Open Info Bar
Because `infoBarOpen` starts as `false` and only becomes `true` when user clicks a country, new assignments don't show info bar automatically.

## Button Behavior

### "Next →" Button (Green)
- **Appears:** Quiz mode + Correct answer
- **Text:** "Next →"
- **Color:** Green (#4CAF50)
- **Action:**
  1. Closes info bar
  2. Fetches new country
  3. Info bar stays closed for new country

### "Try Again" Button (Red)
- **Appears:** Quiz mode + Incorrect answer
- **Text:** "Try Again"
- **Color:** Red (#F44336)
- **Action:**
  1. Closes info bar
  2. User can click another country
  3. Same country assignment remains

### "X" Button (Theme Color)
- **Appears:** Explore mode
- **Symbol:** ✕
- **Color:** Theme-based
- **Action:**
  1. Closes info bar
  2. User can click another country

## Files Modified

### [App.js](frontend/src/App.js)

**Line 16:** Changed initial state
```javascript
const [infoBarOpen, setInfoBarOpen] = useState(false);  // Changed from true
```

**Lines 60-63:** Always open info bar in quiz mode
```javascript
else {
  handleCountryClick(countryIso);
  // Always open info bar in quiz mode to show result (correct or incorrect)
  setInfoBarOpen(true);
}
```

## Complete User Flow Examples

### Example 1: Wrong Answer Then Correct
```
Start: "Find: Brazil"
└─> Click Argentina
    ├─> ❌ Incorrect feedback
    ├─> Info bar opens (Argentina artwork)
    ├─> "Try Again" button (red)
    └─> Click "Try Again"
        ├─> Info bar closes
        └─> Still: "Find: Brazil"
            └─> Click Brazil
                ├─> ✅ Correct feedback
                ├─> Info bar opens (Brazil artwork)
                ├─> "Next →" button (green)
                └─> Click "Next →"
                    ├─> Info bar closes
                    └─> New: "Find: Japan" (no info bar yet)
```

### Example 2: Correct on First Try
```
Start: "Find: France"
└─> Click France
    ├─> ✅ Correct feedback
    ├─> Info bar opens (France artwork)
    ├─> "Next →" button (green)
    └─> Click "Next →"
        ├─> Info bar closes
        └─> New: "Find: Egypt" (no info bar yet)
```

### Example 3: Multiple Wrong Attempts
```
Start: "Find: Germany"
└─> Click Austria
    ├─> ❌ Incorrect feedback
    ├─> Info bar opens (Austria artwork)
    └─> Click "Try Again"
        ├─> Info bar closes
        └─> Still: "Find: Germany"
            └─> Click Switzerland
                ├─> ❌ Incorrect feedback
                ├─> Info bar opens (Switzerland artwork)
                └─> Click "Try Again"
                    ├─> Info bar closes
                    └─> Still: "Find: Germany"
                        └─> Click Germany
                            ├─> ✅ Correct feedback
                            └─> "Next →" button appears
```

## Benefits

1. **Feedback on All Answers** - See artwork for both right and wrong guesses
2. **Educational** - Learn about countries even when wrong
3. **Controlled Progression** - Must acknowledge result before continuing
4. **Clear States** - Green = correct, Red = try again
5. **No Auto-Open** - New country doesn't distract with info bar

## Technical Details

### State Management
```javascript
// Info bar closed by default
const [infoBarOpen, setInfoBarOpen] = useState(false);

// Opens when any country clicked in quiz mode
handleCountryClick(countryIso);
setInfoBarOpen(true);

// Closes and fetches new country (Next button)
const handleNextCountry = () => {
  setInfoBarOpen(false);
  fetchNewCountry();
};

// Closes but keeps same country (Try Again button)
const handleCloseInfoBar = () => {
  setInfoBarOpen(false);
};
```

### Button Logic
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

## Testing Checklist

- [x] New country doesn't auto-show info bar
- [x] Wrong answer shows info bar with "Try Again"
- [x] Correct answer shows info bar with "Next"
- [x] "Try Again" closes and allows retry
- [x] "Next" closes and loads new country
- [x] New country info bar stays closed
- [x] Explore mode still works with X button
- [x] Backdrop click disabled in quiz mode
- [x] Backdrop click enabled in explore mode

## Summary

Quiz mode now provides feedback for every answer while maintaining controlled progression:
- ✅ Info bar shows for both correct and incorrect answers
- ✅ Appropriate button based on result (Next vs Try Again)
- ✅ New country doesn't auto-show info bar
- ✅ User must actively progress through quiz
