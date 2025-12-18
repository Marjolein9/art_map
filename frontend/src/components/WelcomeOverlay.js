import React, { useState } from 'react';
import Candles from './Candles';
import { welcomeExamples } from '../data/welcomeExamples';

/**
 * WelcomeOverlay Component - Top Info-Bar Layout
 * 
 * Displays on initial app load with:
 * - Top info-bar with title and inline buttons
 * - Full window height scrollable content below
 * - All 4 countries with blurbs (no icons)
 * - Actual working control buttons from globe overlay
 * - Single candle for mortality
 */

const WelcomeOverlay = ({ onStartQuiz, onExplore, colors }) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onExplore();
    }, 300);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

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
      <div className="artwork-overlay welcome-overlay welcome-full-height" style={{
        '--card-bg': colors?.cardBg,
        '--glow-color': colors?.glow,
        '--border-color': colors?.border,
        '--text-color': colors?.text,
        '--background-color': colors?.background,
      }}>
        {/* Close Button */}
        <button 
          className="welcome-close-button"
          onClick={handleClose}
          aria-label="Close welcome overlay"
        >
          ✕
        </button>

        <div className="artwork-info-container welcome-container welcome-full-container" style={{
          opacity: isClosing ? 0 : 1,
          transition: 'opacity 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}>
          {/* TOP INFO-BAR */}
          <div className="welcome-top-bar">
            <h2 className="welcome-bar-title">Learn Geography Through Art</h2>
            
            {/* BUTTONS - STACKED VERTICALLY, FULL WIDTH */}
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

          {/* MAIN CONTENT AREA - Scrollable */}
          <div className="welcome-main-content">
            
            {/* COUNTRIES SECTION */}
            <div className="welcome-section">
              <div className="welcome-section-title">Explore Countries</div>
              <p className="welcome-section-blurb">
                Click any country on the map to explore its art collection, museums, and historical photographs. 
                Learn about the progress made in reducing child mortality over the past 30+ years.
              </p>
            </div>

            {/* Show all 4 countries */}
            {welcomeExamples.countries.map((country) => (
              <div 
                key={country.iso3} 
                className="welcome-country-card"
              >
                {/* Country Content */}
                <div className="welcome-card-content">
                  {Object.entries(country.collections).map(([collectionName, image]) => (
                    <div key={collectionName} className="welcome-collection-item">
                      {/* Collection Source Header - Replaces Country Name */}
                      <div className="welcome-collection-header">
                        <h3 className="welcome-collection-source">
                          {image.source || collectionName}
                        </h3>
                        <span className="welcome-country-label">{country.name}</span>
                      </div>

                      {/* Image */}
                      <img
                        src={image.image}
                        alt={image.title || collectionName}
                        className="welcome-example-image"
                      />

                      {/* Caption */}
                      <div className="info-box welcome-caption">
                        {image.subtitle && (
                          <div className="artwork-subtitle">{image.subtitle}</div>
                        )}
                        {image.title && (
                          <div className="artwork-title">{image.title}</div>
                        )}
                        {image.artist && (
                          <div className="artwork-artist">{image.artist}</div>
                        )}
                        {image.nationality && (
                          <div className="artwork-artist">{image.nationality}</div>
                        )}
                        {image.date && (
                          <div className="artwork-date">{image.date}</div>
                        )}
                        {image.description && (
                          <div className="welcome-description">{image.description}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* CHILD MORTALITY SECTION */}
            <div className="welcome-section">
              <div className="welcome-section-title">Child Mortality Progress</div>
              <p className="welcome-section-blurb">
                One candle represents the remarkable progress made in reducing child mortality rates 
                from 1990 to 2023 through global health initiatives, improved access to medicine, and education.
              </p>
              <div className="welcome-candle-display">
                <Candles count={1} />
              </div>
            </div>

            {/* QUIZ MODE CONTROLS SECTION */}
            <div className="welcome-section">
              <div className="welcome-section-title">Quiz Mode Controls</div>
              <p className="welcome-section-blurb">
                In Quiz Mode, use these controls to navigate and test your geography knowledge:
              </p>

              {/* Control Buttons with Explanations - One Per Line */}
              <div className="welcome-controls-list">
                <div className="welcome-control-item">
                  <button className="globe-control-btn-small" title="Rotate Left">←</button>
                  <span className="control-explanation">Rotate globe left</span>
                </div>

                <div className="welcome-control-item">
                  <button className="globe-control-btn-small" title="Rotate Right">→</button>
                  <span className="control-explanation">Rotate globe right</span>
                </div>

                <div className="welcome-control-item">
                  <button className="globe-control-btn-small" title="Zoom In">+</button>
                  <span className="control-explanation">Zoom in to see details</span>
                </div>

                <div className="welcome-control-item">
                  <button className="globe-control-btn-small" title="Zoom Out">−</button>
                  <span className="control-explanation">Zoom out to see full globe</span>
                </div>

                <div className="welcome-control-item">
                  <div className="toggle-container-small">
                    <span className="toggle-label-small">Quiz</span>
                    <label className="toggle-switch-small">
                      <input type="checkbox" />
                      <span className="toggle-slider-small"></span>
                    </label>
                  </div>
                  <span className="control-explanation">Turn Quiz Mode on/off</span>
                </div>

                <div className="welcome-control-item">
                  <button className="globe-control-btn-small" title="Next Country">Skip</button>
                  <span className="control-explanation">Get a new country to find</span>
                </div>

                <div className="welcome-control-item">
                  <button className="globe-control-btn-small" title="Show Me">Show Me</button>
                  <span className="control-explanation">Reveal the answer and its location</span>
                </div>

                <div className="welcome-control-item">
                  <div className="toggle-container-small">
                    <span className="toggle-label-small">Hint</span>
                    <label className="toggle-switch-small">
                      <input type="checkbox" defaultChecked />
                      <span className="toggle-slider-small"></span>
                    </label>
                  </div>
                  <span className="control-explanation">Show/hide helpful hints</span>
                </div>
              </div>
            </div>

            {/* HOW IT WORKS SECTION */}
            <div className="welcome-section">
              <div className="welcome-section-title">How It Works</div>
              <p className="welcome-section-blurb">
                Explore Mode: Click any country to learn about its art and statistics.
                <br/>
                Quiz Mode: Try to identify countries based on hints about their culture and heritage. Use the controls above to navigate the globe and find your answer!
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default WelcomeOverlay;
