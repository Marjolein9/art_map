# Quiz Mode - Auto-Fetch Fix

## Problem

The quiz was automatically fetching a new country 2 seconds after a correct answer, even though the user hadn't clicked the "Next" button yet. This prevented users from reviewing the artwork at their own pace.

## Root Cause

In [useQuiz.js](frontend/src/hooks/useQuiz.js:59-61), there was a `setTimeout` that automatically fetched a new country:

```javascript
if (result.correct) {
  setGameStatus('correct');
  setTimeout(() => {
    fetchNewCountry(); // ❌ Auto start new round after 2 seconds
  }, 2000);
}
```

This 2-second timer would:
1. Close the info bar automatically
2. Fetch a new country
3. Prevent user from controlling when to move on

## Solution

Removed the automatic `setTimeout` and let the user control progression via the "Next" button:

**Before:**
```javascript
if (result.correct) {
  setGameStatus('correct');
  setTimeout(() => {
    fetchNewCountry(); // ❌ Auto-fetches after 2 seconds
  }, 2000);
}
```

**After:**
```javascript
if (result.correct) {
  setGameStatus('correct');
  // ✅ Don't auto-fetch - wait for user to click "Next" button
}
```

## How It Works Now

### Correct Answer Flow
```
1. User clicks correct country
   ↓
2. handleCountryClick() called
   ↓
3. setGameStatus('correct')
   ↓
4. Info bar opens with "Next →" button
   ↓
5. User reviews artwork (no timer!)
   ↓
6. User clicks "Next →" button
   ↓
7. handleNextCountry() called
   ↓
8. setInfoBarOpen(false)
   ↓
9. fetchNewCountry() called
   ↓
10. New country assigned
    ↓
11. Info bar stays closed
```

### Incorrect Answer Flow (Unchanged)
```
1. User clicks wrong country
   ↓
2. handleCountryClick() called
   ↓
3. setGameStatus('incorrect')
   ↓
4. Info bar opens with "Try Again" button
   ↓
5. After 1.5 seconds: setGameStatus('playing')
   ↓
6. User clicks "Try Again"
   ↓
7. Info bar closes
   ↓
8. User can try again (same country)
```

## File Changed

### [useQuiz.js](frontend/src/hooks/useQuiz.js)

**Line 57-66:** Removed automatic fetch timer

```javascript
if (result.correct) {
  setGameStatus('correct');
  // Don't auto-fetch new country - wait for user to click "Next" button
} else {
  setGameStatus('incorrect');
  // Reset to playing after showing incorrect feedback
  setTimeout(() => {
    setGameStatus('playing');
  }, 1500);
}
```

## Benefits

1. **User Control** ✅
   - User decides when to move on
   - No rushed timer forcing progression
   - Can review artwork as long as needed

2. **Better Learning** ✅
   - Time to read artist names
   - Time to view multiple images
   - Time to understand context

3. **Accessibility** ✅
   - Users with slower reading speed not rushed
   - Users with mobility issues have time to click
   - Screen reader users have time to navigate

4. **Explicit Progression** ✅
   - Must actively click "Next"
   - Clear intent to continue
   - No accidental progression

## Game Status States

The `gameStatus` state controls the button displayed:

| Status | Button | Color | Action | Auto-Timer |
|--------|--------|-------|--------|------------|
| `'playing'` | None | - | Initial state | No |
| `'correct'` | "Next →" | Green | Fetch new country | **No** (removed) |
| `'incorrect'` | "Try Again" | Red | Close info bar | Yes (1.5s reset) |

## Why Keep Timer for Incorrect?

The 1.5-second timer for incorrect answers is kept because:
- It only resets `gameStatus` from 'incorrect' to 'playing'
- Doesn't fetch new country
- Allows map animation to complete (shake effect)
- Doesn't force user action

The timer for correct answers was removed because:
- It fetched a new country (forced progression)
- Didn't allow users to review at their pace
- Was unexpected behavior

## Testing Checklist

- [x] Correct answer doesn't auto-fetch new country
- [x] "Next" button appears on correct answer
- [x] Clicking "Next" fetches new country
- [x] Info bar stays open until "Next" clicked
- [x] New country doesn't auto-show info bar
- [x] Incorrect answer still resets to 'playing' after 1.5s
- [x] "Try Again" button works correctly
- [x] User has full control over quiz progression

## User Feedback

**Before Fix:**
```
User: "The quiz moves too fast!"
User: "I can't read the artwork details before it moves on"
User: "I want to review the images longer"
```

**After Fix:**
```
User: ✅ Can review at their own pace
User: ✅ Controls when to continue
User: ✅ No rushed timer
```

## Summary

Removed the automatic 2-second timer that fetched new countries after correct answers. Users now have full control over quiz progression via the "Next" button, allowing them to review artwork at their own pace without being rushed.
