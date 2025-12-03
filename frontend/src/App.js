import { useState } from 'react';
import './App.css';
import WorldMap from './components/WorldMap';
import ArtworkInfoBar from './components/ArtworkInfoBar';
import { COLOR_SCHEMES } from './styles/colorSchemes';
import { useQuiz } from './hooks/useQuiz';

function App() {
  const { targetCountry, loading, gameStatus, handleCountryClick, fetchNewCountry } = useQuiz();
  const [tooltipsEnabled, setTooltipsEnabled] = useState(true);
  const [selectedColorScheme, setSelectedColorScheme] = useState('vintage');

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

  return (
    <div className="App">
      <div style={{
        minHeight: '100vh',
        background: COLORS.backgroundGradient,
        padding: '20px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: COLORS.text, fontSize: '1.2em' }}>Loading game...</p>
          ) : (
            <>
              <div style={{
                display: 'flex',
                gap: '20px',
                alignItems: 'flex-start'
              }}>
                <div style={{
                  flex: '1',
                  backgroundColor: COLORS.cardBg,
                  borderRadius: '8px',
                  boxShadow: `0 0 20px ${COLORS.glow}, 0 4px 6px rgba(0, 0, 0, 0.3)`,
                  padding: '20px',
                  border: `2px solid ${COLORS.border}`,
                  backdropFilter: 'blur(10px)'
                }}>
                  <WorldMap
                    onCountryClick={handleCountryClick}
                    targetCountry={targetCountry?.iso}
                    targetCountryName={targetCountry?.name}
                    region={targetCountry?.subregion || targetCountry?.continent}
                    gameStatus={gameStatus}
                    tooltipsEnabled={tooltipsEnabled}
                    colors={COLORS}
                    onNewGame={fetchNewCountry}
                    onStartOver={fetchNewCountry}
                    onToggleTooltips={handleToggleTooltips}
                    selectedColorScheme={selectedColorScheme}
                    onColorSchemeChange={handleColorSchemeChange}
                  />
                </div>

                {/* Artwork Info Bar - Right Side */}
                <div style={{
                  width: '400px',
                  minWidth: '400px'
                }}>
                  <ArtworkInfoBar
                    countryISO={targetCountry?.iso}
                    colors={COLORS}
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
