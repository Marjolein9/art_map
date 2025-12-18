/**
 * WelcomeOverlay Component - Interactive Welcome Screen
 *
 * INTERVIEW PREP: REACT COMPONENTS & USER EXPERIENCE
 * ===================================================
 *
 * Component Purpose:
 * This component displays a comprehensive welcome screen on initial app load,
 * introducing users to the application's features and image collections.
 *
 * Key React Concepts Demonstrated:
 *
 * 1. Component State Management with useState:
 *    - Manages closing animation state
 *    - Handles user interactions (button clicks, backdrop clicks)
 *    - Interview Question: "How does React re-render when state changes?"
 *      Answer: When setState is called, React schedules a re-render, compares
 *      virtual DOM with actual DOM, and updates only what changed (reconciliation)
 *
 * 2. Controlled Transitions & Animations:
 *    - Uses state + CSS classes for smooth fade-out animations
 *    - setTimeout ensures animation completes before callback execution
 *    - Interview Question: "Why use setTimeout here?"
 *      Answer: CSS animations take time. We start the animation (isClosing=true),
 *      wait 300ms for it to complete, then trigger the callback.
 *
 * 3. Event Handling Patterns:
 *    - Backdrop click detection (e.target === e.currentTarget)
 *    - Multiple button handlers with different callbacks
 *    - Interview Question: "What's the difference between target and currentTarget?"
 *      Answer: target is the element that triggered the event (could be child),
 *      currentTarget is the element the listener is attached to (the backdrop div)
 *
 * 4. Props-Based Communication:
 *    - onStartQuiz: Callback to parent to enter quiz mode
 *    - onExplore: Callback to parent to enter explore mode
 *    - colors: Color scheme object for consistent theming
 *    - Interview Question: "Why pass callbacks as props?"
 *      Answer: React uses one-way data flow. Child components can't modify parent
 *      state directly. Callbacks let child notify parent to update state.
 *
 * 5. Dynamic Content Rendering:
 *    - Maps over welcomeExamples array to render collection cards
 *    - Conditional rendering for image metadata
 *    - React.Fragment for grouping without extra DOM nodes
 *    - Interview Question: "Why use React.Fragment instead of div?"
 *      Answer: Fragment doesn't create extra DOM elements. Useful when parent
 *      expects direct children or to avoid CSS layout issues.
 *
 * 6. CSS-in-JS with Inline Styles:
 *    - CSS custom properties (--card-bg, --glow-color) for theming
 *    - Dynamic opacity based on isClosing state
 *    - Interview Question: "When to use inline styles vs CSS classes?"
 *      Answer: Use inline styles for dynamic values (opacity based on state).
 *      Use CSS classes for static styling and pseudo-elements.
 *
 * User Experience Patterns:
 * - Modal overlay with backdrop click-to-close
 * - Explicit close button for accessibility
 * - Scrollable content area for mobile responsiveness
 * - Smooth transitions enhance perceived performance
 *
 * Accessibility Considerations:
 * - aria-label on close button for screen readers
 * - Semantic HTML (h2, h3 for headings)
 * - Links with target="_blank" include rel="noopener noreferrer" for security
 *
 * Common Interview Questions About This Component:
 *
 * Q: "How would you test this component?"
 * A: Test: 1) Initial render shows welcome content, 2) Click "Explore" triggers
 *    onExplore callback, 3) Click "Start Quiz" triggers onStartQuiz, 4) Backdrop
 *    click triggers close, 5) Animation completes before callback
 *
 * Q: "How could you improve performance?"
 * A: 1) Memoize welcomeExamples.countries.map with useMemo, 2) Lazy load images,
 *    3) Virtualize long lists if many countries, 4) Code-split this component
 *
 * Q: "What would happen without the setTimeout in handleClose?"
 * A: The overlay would disappear immediately without animation, creating jarring UX
 */
import React, { useState } from 'react';
import Candles from './Candles';
import { welcomeExamples } from '../data/welcomeExamples';

const WelcomeOverlay = ({ onStartQuiz, onExplore, colors }) => {
  /**
   * State: isClosing
   * Controls the closing animation. When true, adds CSS class that triggers
   * fade-out animation via opacity transition.
   *
   * Interview Note: We could use a single boolean "isOpen" instead, but having
   * separate "isClosing" state allows us to keep the component mounted during
   * animation, preventing abrupt disappearance.
   */
  const [isClosing, setIsClosing] = useState(false);

  /**
   * handleClose - Initiates closing animation and navigates to explore mode
   *
   * Process:
   * 1. Set isClosing to true (triggers CSS fade-out animation)
   * 2. Wait 300ms for animation to complete
   * 3. Call onExplore() callback to notify parent component
   *
   * Interview Note: This is a common pattern for exit animations in React.
   * The setTimeout ensures the user sees the smooth fade-out before the
   * component unmounts or mode changes.
   */
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onExplore();
    }, 300);
  };

  /**
   * handleBackdropClick - Closes overlay when user clicks outside content
   *
   * UX Pattern: Modal with backdrop click-to-close
   *
   * Interview Question: "Why check e.target === e.currentTarget?"
   * Answer: e.target is the actual element clicked (could be a child like button).
   * e.currentTarget is always the element with the onClick listener (the backdrop).
   * We only want to close when clicking the backdrop itself, not its children.
   *
   * Example:
   * - Click on backdrop div → target === currentTarget → closes ✓
   * - Click on content div → target !== currentTarget → doesn't close ✓
   * - Click on button → target !== currentTarget → doesn't close ✓
   */
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  /**
   * handleStartQuiz - Initiates closing animation and navigates to quiz mode
   *
   * Same animation pattern as handleClose but triggers onStartQuiz callback
   * instead of onExplore. This allows the parent App component to set mode
   * state and initialize quiz mode properly.
   */
  const handleStartQuiz = () => {
    setIsClosing(true);
    setTimeout(() => {
      onStartQuiz();
    }, 300);
  };

  return (
    <div
      className={`artwork-backdrop welcome-backdrop ${isClosing ? 'closing' : ''}`}
      onClick={handleBackdropClick}
    >
      <div
        className="artwork-overlay welcome-overlay welcome-full-height"
        style={{
          '--card-bg': colors?.cardBg,
          '--glow-color': colors?.glow,
          '--border-color': colors?.border,
          '--text-color': colors?.text,
          '--background-color': colors?.background,
        }}
      >
        {/* Close Button */}
        <button
          className="welcome-close-button"
          onClick={handleClose}
          aria-label="Close welcome overlay"
        >
          ✕
        </button>

        <div
          className="overlay-container welcome-container welcome-full-container"
          style={{
            opacity: isClosing ? 0 : 1,
            transition: 'opacity 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* TOP INFO-BAR */}
          <div className="welcome-top-bar">
            <h2 className="welcome-bar-title">Learn Geography Through Art</h2>

            <div className="welcome-buttons-stack">
              <button
                className="welcome-control-button explore-button"
                onClick={handleClose}
              >
                Explore
              </button>

              <button
                className="welcome-control-button quiz-button"
                onClick={handleStartQuiz}
              >
                Start Quiz
              </button>
            </div>
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="welcome-main-content">

            <div className="welcome-section-header-text">
              <h3>Click on a country to get the public domain images and info described below</h3>
            </div>

            {/* COUNTRY EXAMPLES */}
            {welcomeExamples.countries.map((country) => (
              <React.Fragment key={country.iso3}>
                {Object.entries(country.collections).map(
                  ([collectionName, image]) => (
                    <div key={collectionName} className="overlay-section">
                      {/* SOURCE HEADER */}
                      <div className="overlay-section-header">
                        {image.link ? (
                          <a
                            href={image.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="overlay-section-title link"
                          >
                            {image.source || collectionName}
                          </a>
                        ) : (
                          <h3 className="overlay-section-title">
                            {image.source || collectionName}
                          </h3>
                        )}
                      </div>

                      {/* CONTENT */}
                      <div className="overlay-section-content">
                        {/* DESCRIPTION */}
                        {image.description && (
                          <div className="overlay-caption">
                            <div className="welcome-source-description">
                              {image.description}
                            </div>
                          </div>
                        )}

                        {/* IMAGE */}
                        <img
                          src={image.image}
                          alt={image.title || collectionName}
                          className="welcome-example-image"
                        />

                        {/* CAPTION */}
                        <div className="overlay-caption">
                          {image.subtitle && (
                            <div className="artwork-subtitle">
                              {image.subtitle}
                            </div>
                          )}
                          {image.title && (
                            <div className="artwork-artist">{image.title}</div>
                          )}
                          {image.artist && (
                            <div className="artwork-artist">
                              {image.artist}
                            </div>
                          )}
                          {image.nationality && (
                            <div className="artwork-artist">
                              {image.nationality}
                            </div>
                          )}
                          {image.date && (
                            <div className="artwork-date">{image.date}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                )}
              </React.Fragment>
            ))}

            {/* CHILD MORTALITY SECTION */}
            <div className="overlay-section">
              <div className="overlay-section-header">
                <h3 className="overlay-section-title">
                  Child Mortality Progress
                </h3>
              </div>
              <div className="overlay-section-content">
                <div className="overlay-caption">
                  Each candle represents one percentage point decrease in the
                  under-five child mortality of the country between 1990 and 2023.
                </div>
                <div className="welcome-candle-display">
                  <center><Candles count={1} /></center>
                </div>
              </div>
            </div>

            {/* QUIZ MODE CONTROLS SECTION */}
            <div className="overlay-section">
              <div className="overlay-section-header">
                <h3 className="overlay-section-title">Quiz Mode Controls</h3>
              </div>
              <div className="overlay-section-content">

              <div className="welcome-controls-list">
                <div className="welcome-control-item">
                  <button className="globe-control-btn-small" title="Rotate Left">
                    ←
                  </button>
                  <span className="control-explanation">
                    Rotate globe left
                  </span>
                </div>

                <div className="welcome-control-item">
                  <button
                    className="globe-control-btn-small"
                    title="Rotate Right"
                  >
                    →
                  </button>
                  <span className="control-explanation">
                    Rotate globe right
                  </span>
                </div>

                <div className="welcome-control-item">
                  <button className="globe-control-btn-small" title="Zoom In">
                    +
                  </button>
                  <span className="control-explanation">
                    Zoom in to see details
                  </span>
                </div>

                <div className="welcome-control-item">
                  <button className="globe-control-btn-small" title="Zoom Out">
                    −
                  </button>
                  <span className="control-explanation">
                    Zoom out to see full globe
                  </span>
                </div>

                <div className="welcome-control-item">
                  <div className="toggle-container-small">
                    <span className="toggle-label-small">Quiz</span>
                    <label className="toggle-switch-small">
                      <input type="checkbox" />
                      <span className="toggle-slider-small"></span>
                    </label>
                  </div>
                  <span className="control-explanation">
                    Turn Quiz Mode on/off
                  </span>
                </div>

                <div className="welcome-control-item">
                  <button
                    className="globe-control-btn-small"
                    title="Next Country"
                  >
                    Skip
                  </button>
                  <span className="control-explanation">
                    Get a new country to find
                  </span>
                </div>

                <div className="welcome-control-item">
                  <button className="globe-control-btn-small" title="Show Me">
                    Show Me
                  </button>
                  <span className="control-explanation">
                    Reveal the answer and its location
                  </span>
                </div>

                <div className="welcome-control-item">
                  <div className="toggle-container-small">
                    <span className="toggle-label-small">Hint</span>
                    <label className="toggle-switch-small">
                      <input type="checkbox" defaultChecked />
                      <span className="toggle-slider-small"></span>
                    </label>
                  </div>
                  <span className="control-explanation">
                    Show/hide the country and neighboring countries
                  </span>
                </div>
              </div>
              </div>
            </div>


          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeOverlay;
