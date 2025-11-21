import { useState, useEffect } from 'react';
import './App.css';
import WorldMap from './components/WorldMap';
import { COLOR_SCHEMES } from './styles/colorSchemes';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [targetCountry, setTargetCountry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [gameStatus, setGameStatus] = useState('playing'); // 'playing', 'correct', 'incorrect'
  const [tooltipsEnabled, setTooltipsEnabled] = useState(true);
  const [selectedColorScheme, setSelectedColorScheme] = useState('vintage'); // Default to vintage theme
  const [showTitle, setShowTitle] = useState(true);

  // Get current color scheme
  const COLORS = COLOR_SCHEMES[selectedColorScheme];

  // Handle scroll to hide/show title
  useEffect(() => {
    const handleScroll = () => {
      setShowTitle(window.scrollY < 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch a random country on mount and when new game is started
  const fetchRandomCountry = async () => {
    try {
      if (initialLoad) {
        setLoading(true);
      }
      setGameStatus('playing');

      const response = await fetch(`${API_URL}/game/random-country`);
      const data = await response.json();

      console.log('🎲 Fetched new country:', data.country);
      setTargetCountry(data.country);
      setLoading(false);
      setInitialLoad(false);
    } catch (err) {
      console.error('Error fetching random country:', err);
      setLoading(false);
      setInitialLoad(false);
    }
  };

  useEffect(() => {
    fetchRandomCountry();
  }, []);

  useEffect(() => {
    console.log('🗺️ Target country changed in App:', {
      country: targetCountry?.name,
      continent: targetCountry?.continent,
      subregion: targetCountry?.subregion,
      iso: targetCountry?.iso
    });
  }, [targetCountry]);

  // Handle country click
  const handleCountryClick = async (countryIso) => {
    if (gameStatus !== 'playing' || !targetCountry) return;

    console.log('🎯 Checking answer:', {
      clickedCountry: countryIso,
      targetCountry: targetCountry.iso,
      targetName: targetCountry.name
    });

    try {
      const response = await fetch(`${API_URL}/game/check-answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedCountryIso: countryIso,
          targetCountryIso: targetCountry.iso
        })
      });

      const data = await response.json();
      console.log('📊 Answer result:', data);

      if (data.correct) {
        setGameStatus('correct');
        setTimeout(() => {
          fetchRandomCountry(); // Auto start new round after 2 seconds
        }, 2000);
      } else {
        setGameStatus('incorrect');
        setTimeout(() => {
          setGameStatus('playing');
        }, 1500);
      }
    } catch (err) {
      console.error('Error checking answer:', err);
    }
  };

  // Handle tooltip toggle button
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
          {showTitle && (
            <h1 style={{
              textAlign: 'center',
              color: COLORS.text,
              marginBottom: '30px',
              fontSize: '2.5em',
              textShadow: `0 0 10px ${COLORS.glow}, 0 0 20px ${COLORS.glow}, 2px 2px 4px rgba(0, 0, 0, 0.5)`,
              transition: 'opacity 0.3s ease'
            }}>
              The World: Getting Better?<a
                href="https://ourworldindata.org/much-better-awful-can-be-better"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: COLORS.text,
                  textDecoration: 'none',
                  textShadow: `0 0 10px ${COLORS.glow}, 0 0 20px ${COLORS.glow}, 2px 2px 4px rgba(0, 0, 0, 0.5)`
                }}
              >*</a>
            </h1>
          )}

          {loading ? (
            <p style={{ textAlign: 'center', color: COLORS.text, fontSize: '1.2em' }}>Loading game...</p>
          ) : (
            <>
              <div style={{
                backgroundColor: COLORS.cardBg,
                borderRadius: '8px',
                boxShadow: `0 0 20px ${COLORS.glow}, 0 4px 6px rgba(0, 0, 0, 0.3)`,
                padding: '20px',
                border: `2px solid ${COLORS.border}`,
                backdropFilter: 'blur(10px)',
                marginBottom: '20px'
              }}>
                <WorldMap
                  onCountryClick={handleCountryClick}
                  targetCountry={targetCountry?.iso}
                  targetCountryName={targetCountry?.name}
                  region={targetCountry?.subregion || targetCountry?.continent}
                  gameStatus={gameStatus}
                  tooltipsEnabled={tooltipsEnabled}
                  colors={COLORS}
                  onNewGame={fetchRandomCountry}
                  onStartOver={fetchRandomCountry}
                  onToggleTooltips={handleToggleTooltips}
                  selectedColorScheme={selectedColorScheme}
                  onColorSchemeChange={handleColorSchemeChange}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
