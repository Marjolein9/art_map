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
  const [selectedColorScheme, setSelectedColorScheme] = useState('vintage');
  const [mode, setMode] = useState('quiz'); // 'quiz' or 'explore'
  const [exploreCountry, setExploreCountry] = useState(null);
  const [infoBarOpen, setInfoBarOpen] = useState(false);
  const [countryLookup, setCountryLookup] = useState({});

  // Get current color scheme
  const COLORS = COLOR_SCHEMES[selectedColorScheme];

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

  // Handle color scheme change
  const handleColorSchemeChange = (scheme) => {
    setSelectedColorScheme(scheme);
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
      handleCountryClick(countryIso);
      // Always open info bar in quiz mode to show result (correct or incorrect)
      setInfoBarOpen(true);
    }
  };

  // Handle close info bar
  const handleCloseInfoBar = () => {
    setInfoBarOpen(false);
  };

  // Handle next country in quiz mode
  const handleNextCountry = () => {
    setInfoBarOpen(false);
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
                    selectedColorScheme={selectedColorScheme}
                    onColorSchemeChange={handleColorSchemeChange}
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
                          gameStatus={gameStatus}
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
