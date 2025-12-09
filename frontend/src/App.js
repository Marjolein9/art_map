import { useState } from 'react';
import './styles/App.css';
import './styles/components.css';  // Import centralized component styles
import WorldMap from './components/WorldMap';
import ArtworkInfoBar from './components/ArtworkInfoBar';
import { COLOR_SCHEMES } from './styles/colorSchemes';
import { useQuiz } from './hooks/useQuiz';

function App() {
  const { targetCountry, loading, gameStatus, handleCountryClick, fetchNewCountry } = useQuiz();
  const [tooltipsEnabled, setTooltipsEnabled] = useState(true);
  const [selectedColorScheme, setSelectedColorScheme] = useState('vintage');
  const [mode, setMode] = useState('quiz'); // 'quiz' or 'explore'
  const [exploreCountry, setExploreCountry] = useState(null);

  // Get current color scheme
  const COLORS = COLOR_SCHEMES[selectedColorScheme];

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
    } else {
      handleCountryClick(countryIso);
    }
  };

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
                {/* Map container - Left side */}
                <div
                  className="map-container"
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
                </div>

                {/* Artwork Info Bar - Right Side */}
                <div className="artwork-sidebar">
                  <ArtworkInfoBar
                    countryISO={mode === 'quiz' ? targetCountry?.iso : exploreCountry}
                    colors={COLORS}
                    mode={mode}
                  />
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
