/**
 * WelcomeOverlay Component - Interactive Welcome Screen (MUI Hybrid)
 *
 * Uses Material-UI components with CSS-based styling for a hybrid approach.
 * MUI components provide structure while existing CSS classes handle all styling.
 */
import React, { useState } from 'react';
import { Dialog, Box, Button, Typography, IconButton, Link } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
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
    <Dialog
      open={true}
      onClose={(_event, reason) => {
        if (reason === 'backdropClick') {
          handleClose();
        }
      }}
      fullScreen
      className={`artwork-backdrop welcome-backdrop ${isClosing ? 'closing' : ''}`}
      slotProps={{
        paper: {
          className: "artwork-overlay welcome-overlay welcome-full-height",
          style: {
            '--card-bg': colors?.cardBg,
            '--glow-color': colors?.glow,
            '--border-color': colors?.border,
            '--text-color': colors?.text,
            '--background-color': colors?.background,
          }
        }
      }}
    >
      {/* Close Button */}
      <IconButton
        className="welcome-close-button"
        onClick={handleClose}
        aria-label="Close welcome overlay"
      >
        <CloseIcon />
      </IconButton>

      <Box
        className="overlay-container welcome-container welcome-full-container"
        style={{
          opacity: isClosing ? 0 : 1,
          transition: 'opacity 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
          {/* TOP INFO-BAR */}
          <Box className="welcome-top-bar">
            <Typography variant="h2" className="welcome-bar-title">Learn Geography Through Art</Typography>

            <Box className="welcome-buttons-stack">
              <Button
                className="welcome-control-button explore-button"
                onClick={handleClose}
              >
                Explore
              </Button>

              <Button
                className="welcome-control-button quiz-button"
                onClick={handleStartQuiz}
              >
                Start Quiz
              </Button>
            </Box>
          </Box>

          {/* MAIN CONTENT AREA */}
          <Box className="welcome-main-content">

            <Box className="welcome-section-header-text">
              <Typography variant="h3">Click on a country to get the public domain images and info described below</Typography>
            </Box>

            {/* COUNTRY EXAMPLES */}
            {welcomeExamples.countries.map((country) => (
              <React.Fragment key={country.iso3}>
                {Object.entries(country.collections).map(
                  ([collectionName, image]) => (
                    <Box key={collectionName} className="overlay-section">
                      {/* SOURCE HEADER */}
                      <Box className="overlay-section-header">
                        {image.link ? (
                          <Link
                            href={image.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="overlay-section-title link"
                          >
                            {image.source || collectionName}
                          </Link>
                        ) : (
                          <Typography variant="h3" className="overlay-section-title">
                            {image.source || collectionName}
                          </Typography>
                        )}
                      </Box>

                      {/* CONTENT */}
                      <Box className="overlay-section-content">
                        {/* DESCRIPTION */}
                        {image.description && (
                          <Box className="overlay-caption">
                            <Box className="welcome-source-description">
                              {image.description}
                            </Box>
                          </Box>
                        )}

                        {/* IMAGE */}
                        <Box
                          component="img"
                          src={image.image}
                          alt={image.title || collectionName}
                          className="welcome-example-image"
                        />

                        {/* CAPTION */}
                        <Box className="overlay-caption">
                          {image.subtitle && (
                            <Box className="artwork-subtitle">
                              {image.subtitle}
                            </Box>
                          )}
                          {image.title && (
                            image.link ? (
                              <Link
                                href={image.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="artwork-artist link"
                              >
                                {image.title}
                              </Link>
                            ) : (
                              <Box className="artwork-artist">{image.title}</Box>
                            )
                          )}
                          {image.artist && (
                            <Box className="artwork-artist">
                              {image.artist}
                            </Box>
                          )}
                          {image.nationality && (
                            <Box className="artwork-artist">
                              {image.nationality}
                            </Box>
                          )}
                          {image.date && (
                            <Box className="artwork-date">{image.date}</Box>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  )
                )}
              </React.Fragment>
            ))}

            {/* CHILD MORTALITY SECTION */}
            <Box className="overlay-section">
              <Box className="overlay-section-header">
                <Typography variant="h3" className="overlay-section-title">
                  Child Mortality Progress
                </Typography>
              </Box>
              <Box className="overlay-section-content">
                <Box className="overlay-caption">
                  Each candle represents one percentage point decrease in the
                  under-five child mortality of the country between 1989 and 2023.
                </Box>
                <Box className="welcome-candle-display">
                  <center><Candles count={1} /></center>
                </Box>
              </Box>
            </Box>

            {/* QUIZ MODE CONTROLS SECTION */}
            <Box className="overlay-section">
              <Box className="overlay-section-header">
                <Typography variant="h3" className="overlay-section-title">Quiz Mode Controls</Typography>
              </Box>
              <Box className="overlay-section-content">

              <Box className="welcome-controls-list">
                <Box className="welcome-control-item">
                  <Button className="globe-control-btn-small" title="Rotate Left">
                    ←
                  </Button>
                  <Typography component="span" className="control-explanation">
                    Rotate globe left
                  </Typography>
                </Box>

                <Box className="welcome-control-item">
                  <Button
                    className="globe-control-btn-small"
                    title="Rotate Right"
                  >
                    →
                  </Button>
                  <Typography component="span" className="control-explanation">
                    Rotate globe right
                  </Typography>
                </Box>

                <Box className="welcome-control-item">
                  <Button className="globe-control-btn-small" title="Zoom In">
                    +
                  </Button>
                  <Typography component="span" className="control-explanation">
                    Zoom in to see details
                  </Typography>
                </Box>

                <Box className="welcome-control-item">
                  <Button className="globe-control-btn-small" title="Zoom Out">
                    −
                  </Button>
                  <Typography component="span" className="control-explanation">
                    Zoom out to see full globe
                  </Typography>
                </Box>

                <Box className="welcome-control-item">
                  <Box className="toggle-container-small">
                    <Typography component="span" className="toggle-label-small">Quiz</Typography>
                    <label className="toggle-switch-small">
                      <input type="checkbox" />
                      <span className="toggle-slider-small"></span>
                    </label>
                  </Box>
                  <Typography component="span" className="control-explanation">
                    Turn Quiz Mode on/off
                  </Typography>
                </Box>

                <Box className="welcome-control-item">
                  <Button
                    className="globe-control-btn-small"
                    title="Next Country"
                  >
                    Skip
                  </Button>
                  <Typography component="span" className="control-explanation">
                    Get a new country to find
                  </Typography>
                </Box>

                <Box className="welcome-control-item">
                  <Button className="globe-control-btn-small" title="Show Me">
                    Show Me
                  </Button>
                  <Typography component="span" className="control-explanation">
                    Reveal the answer and its location
                  </Typography>
                </Box>

                <Box className="welcome-control-item">
                  <Box className="toggle-container-small">
                    <Typography component="span" className="toggle-label-small">Hint</Typography>
                    <label className="toggle-switch-small">
                      <input type="checkbox" defaultChecked />
                      <span className="toggle-slider-small"></span>
                    </label>
                  </Box>
                  <Typography component="span" className="control-explanation">
                    Show/hide the country and neighboring countries
                  </Typography>
                </Box>
              </Box>
              </Box>
            </Box>


          </Box>
        </Box>
      </Dialog>
  );
};

export default WelcomeOverlay;
