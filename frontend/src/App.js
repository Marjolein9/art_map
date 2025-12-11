import { useState, useEffect } from 'react';
import './styles/App.css';
import './styles/components.css';  // Import centralized component styles
import WorldMap from './components/WorldMap';
import ArtworkInfoBar from './components/ArtworkInfoBar';
import { COLOR_SCHEMES } from './styles/colorSchemes';
import { useQuiz } from './hooks/useQuiz';
import { fetchCountries } from './services/api';

function App() {
  const { targetCountry, loading, gameStatus, handleCountryClick, fetchNewCountry } = useQuiz();
  const [tooltipsEnabled, setTooltipsEnabled] = useState(true);
  const [mode, setMode] = useState('quiz'); // 'quiz' or 'explore'
  const [exploreCountry, setExploreCountry] = useState(null);
  const [infoBarOpen, setInfoBarOpen] = useState(false); // Start with info bar closed in quiz mode
  const [countryLookup, setCountryLookup] = useState({});
  const [clickedCountry, setClickedCountry] = useState(null); // Track clicked country for incorrect answers
  const [answerSubmitted, setAnswerSubmitted] = useState(false); // Track if an answer was submitted

  // Use vintage color scheme (1900s)
  const COLORS = COLOR_SCHEMES.vintage;

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

  // Handle tooltip toggle
  const handleToggleTooltips = () => {
    setTooltipsEnabled(prev => !prev);
  };

  // Handle mode toggle
  const handleModeToggle = () => {
    const newMode = mode === 'quiz' ? 'explore' : 'quiz';
    setMode(newMode);
    if (newMode === 'quiz') {
      setExploreCountry(null);
    }
  };

  // Handle explore mode country click
  const handleExploreClick = (countryIso) => {
    console.log('🔍 Country clicked:', { countryIso, mode });
    if (mode === 'explore') {
      console.log('🗺️ Setting explore country to:', countryIso);
      setExploreCountry(countryIso);
      setInfoBarOpen(true); // Open info bar when country is selected
    } else {
      // In quiz mode, handle the answer check
      setClickedCountry(countryIso); // Store the clicked country
      setAnswerSubmitted(true); // Mark that an answer was submitted
      handleCountryClick(countryIso);
      // Always open info bar in quiz mode to show result (correct or incorrect)
      setInfoBarOpen(true);
    }
  };

  // Handle close info bar (Try Again)
  const handleCloseInfoBar = () => {
    setInfoBarOpen(false);
    setClickedCountry(null); // Clear clicked country when closing
    setAnswerSubmitted(false); // Reset answer submitted state
    // Note: gameStatus stays 'incorrect', hints persist
  };

  // Handle next country in quiz mode
  const handleNextCountry = () => {
    setInfoBarOpen(false); // Close info bar for next question
    setClickedCountry(null); // Clear clicked country when moving to next
    setAnswerSubmitted(false); // Reset answer submitted state
    fetchNewCountry();
  };

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    // Only close if clicking the backdrop itself, not the info bar content
    if (e.target === e.currentTarget) {
      handleCloseInfoBar();
    }
  };

  // Get current country name
  const getCurrentCountryData = () => {
    if (mode === 'quiz') {
      // If user clicked a country (correct or incorrect), show that country's info
      if (clickedCountry) {
        const isCorrect = clickedCountry === targetCountry?.iso;
        return {
          iso: isCorrect ? targetCountry?.iso : clickedCountry,
          name: isCorrect ? targetCountry?.name : countryLookup[clickedCountry]
        };
      }
      // Otherwise show target country (initial state or after closing)
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

  const currentCountry = getCurrentCountryData();

  return (
    <div className="App">
      {/* App background with dynamic color theme */}
      <div
        className="app-background"
        style={{ '--bg-gradient': COLORS.backgroundGradient }}
      >
        <div className="app-container">
          {loading ? (
            <p className="loading-message" style={{ '--text-color': COLORS.text }}>
              Loading game...
            </p>
          ) : (
            <>
              <div className="app-content">
                {/* Map container - Full width */}
                <div
                  className="map-container map-container-full"
                  style={{
                    '--card-bg': COLORS.cardBg,
                    '--glow-color': COLORS.glow,
                    '--border-color': COLORS.border
                  }}
                >
                  <WorldMap
                    onCountryClick={handleExploreClick}
                    targetCountry={mode === 'quiz' ? targetCountry?.iso : null}
                    targetCountryName={mode === 'quiz' ? targetCountry?.name : null}
                    region={mode === 'quiz' ? (targetCountry?.subregion || targetCountry?.continent) : null}
                    gameStatus={gameStatus}
                    tooltipsEnabled={tooltipsEnabled}
                    colors={COLORS}
                    onNewGame={fetchNewCountry}
                    onStartOver={fetchNewCountry}
                    onToggleTooltips={handleToggleTooltips}
                    mode={mode}
                    onModeToggle={handleModeToggle}
                  />

                  {/* Artwork Info Bar - Overlay centered over map */}
                  {infoBarOpen && currentCountry.iso && (
                    <div className="artwork-backdrop" onClick={mode === 'explore' ? handleBackdropClick : undefined}>
                      <div className="artwork-overlay">
                        <ArtworkInfoBar
                          countryISO={currentCountry.iso}
                          countryName={currentCountry.name}
                          colors={COLORS}
                          mode={mode}
                          answerSubmitted={answerSubmitted}
                          isCorrectAnswer={clickedCountry === targetCountry?.iso}
                          onClose={handleCloseInfoBar}
                          onNext={handleNextCountry}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
