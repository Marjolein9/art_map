# Welcome Overlay - Quick Reference

## Files Created/Modified

### New Files:
1. **`frontend/src/components/WelcomeOverlay.js`** - Main component
2. **`frontend/src/components/WelcomeOverlay.css`** - Styling
3. **`WELCOME_OVERLAY_GUIDE.md`** - Complete documentation

### Modified Files:
1. **`frontend/src/App.js`** - Added import, state, and rendering logic

## Component Props

```javascript
<WelcomeOverlay
  onStartQuiz={function}      // Called when user clicks "Start Quiz"
  onExplore={function}         // Called when user clicks "Start Exploring"
  childMortalityData={object}  // Optional: Pass actual mortality data
  colors={object}              // Color scheme object (required)
/>
```

## Key Features Implemented

✅ **Multi-section overlay** - 5 educational sections
✅ **Quiz/Explore modes** - Button options to start either mode
✅ **Info categories** - Explains all 5 data types available
✅ **Hint logic** - Explains how hints work in quiz mode
✅ **Show me/Skip** - Navigation buttons to jump between sections
✅ **Child mortality candles** - Visual representation with actual Candles component
✅ **Close button** - Exit to explore mode
✅ **Responsive design** - Works on mobile, tablet, desktop
✅ **Smooth animations** - Professional transitions and effects
✅ **Accessibility** - ARIA labels, semantic HTML, keyboard support

## Behavior

### On Initial Load:
- Overlay displays with welcome message (Section 1)
- User can navigate through 5 sections
- Shows option to Start Quiz or Explore at the end
- Can close at any time (defaults to explore mode)

### When User Clicks Buttons:

| Button | Action |
|--------|--------|
| **Start Quiz** | Hide overlay → Set mode to 'quiz' → Fetch first country |
| **Start Exploring** | Hide overlay → Set mode to 'explore' → Show map |
| **Close (✕)** | Hide overlay → Go to 'explore' mode |
| **Previous** | Go to previous section |
| **Next** | Go to next section |
| **Skip** | Jump to child mortality section |

## Styling Classes

Main CSS classes for customization:
- `.welcome-overlay` - Main overlay container
- `.welcome-modal` - Modal dialog
- `.welcome-content` - Content area
- `.welcome-controls` - Bottom control buttons
- `.mode-btn` - Mode selection buttons
- `.nav-btn` - Navigation buttons

## Color Variables Used

```css
--overlay-bg           /* Background color of overlay */
--text-color          /* Main text color */
--accent-color        /* Primary accent (green) */
--border-color        /* Border styling */
```

## Responsive Breakpoints

```css
Desktop:    100% width (no max-width limit)
Tablet:     @media (max-width: 640px)
Mobile:     @media (max-width: 480px)
```

## Integration Notes

- Uses existing `Candles.js` component for mortality visualization
- Integrates with `useQuiz` hook for fetching country
- Uses `fetchNewCountry()` from quiz hook
- Respects existing color scheme from App.js
- No backend changes required
- No new dependencies needed

## Testing Checklist

- [ ] Overlay appears on page load
- [ ] Can navigate through all 5 sections
- [ ] Dot navigation works correctly
- [ ] Previous/Next buttons work
- [ ] Skip button jumps to section 5
- [ ] Close button exits to explore
- [ ] Start Quiz button starts quiz mode
- [ ] Start Exploring button enters explore mode
- [ ] Animations are smooth
- [ ] Responsive on mobile/tablet/desktop
- [ ] Candles render properly in section 5

## Future Enhancements

To improve the welcome overlay:

1. **Remember User Preference**
   ```javascript
   // Add to state: localStorage check
   const [showWelcome, setShowWelcome] = useState(
     !localStorage.getItem('welcomeShown')
   );
   
   // Save preference when closed
   localStorage.setItem('welcomeShown', 'true');
   ```

2. **Fetch Real Mortality Data**
   - Pass actual child mortality stats from backend
   - Display real data in candles visualization

3. **Add Video Tutorials**
   - Embed videos for each section
   - Show how to play quiz/explore

4. **Keyboard Navigation**
   - Arrow keys to navigate
   - Enter to select
   - Escape to close

5. **Multi-language Support**
   - Translate all text
   - RTL support for languages

## Support Files

- `WELCOME_OVERLAY_GUIDE.md` - Detailed documentation
- Component code has extensive comments for developers
