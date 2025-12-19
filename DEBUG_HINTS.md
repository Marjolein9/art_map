# Debug Hints Color Persistence

## Console Log Guide

I've added console logs to help debug why the red color isn't persisting. Here's what to look for:

### 1. **Game State Log** (logs every time state changes)
```
📊 GAME STATE: gameStatus=incorrect, clickedCountry=FRA, targetCountry=GBR
```
- **gameStatus**: 'incorrect', 'correct', or 'playing'
- **clickedCountry**: The country the user clicked (should stay the same until next country)
- **targetCountry**: The correct country to find

### 2. **Path Color Decision Log** (logs for every clicked country)
```
🎨 PATH COLOR: iso=FRA, gameStatus=incorrect, clickedCountry=FRA, targetCountry=GBR, isHint=false, isShowMe=false
```
- Shows why a color was chosen for a specific country
- If this is the wrong country clicked, you should see red next

### 3. **Red Color Applied Log**
```
🔴 SHOWING RED for FRA (clicked but wrong, target is GBR)
```
- Confirms red is being applied for this country

### 4. **New Target Log** (logs when a new country is assigned)
```
🔄 NEW TARGET: GBR → IND
  Clearing: clickedCountry, hints, showMe
```
- Shows old target → new target
- Confirms clickedCountry is being reset to null

---

## Expected Behavior

When you click a wrong country:

1. **Immediately after click:**
   ```
   📊 GAME STATE: gameStatus=incorrect, clickedCountry=FRA, targetCountry=GBR
   🎨 PATH COLOR: iso=FRA, gameStatus=incorrect, ...
   🔴 SHOWING RED for FRA (clicked but wrong, target is GBR)
   ```

2. **When you click Next or a new country is assigned:**
   ```
   🔄 NEW TARGET: GBR → IND
   Clearing: clickedCountry, hints, showMe
   📊 GAME STATE: gameStatus=playing, clickedCountry=null, targetCountry=IND
   ```
   - Red should disappear because `clickedCountry=null`

---

## What to Check

If red is NOT staying:
1. Is `clickedCountry` being reset prematurely? (Should only reset on new target)
2. Is `gameStatus` changing when it shouldn't? (Should stay 'incorrect' until new target)
3. Is the path color logic being called with wrong values?

Look in the console and share the logs to help diagnose the issue!
