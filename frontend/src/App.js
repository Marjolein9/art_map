import { useState, useEffect } from 'react';
import './App.css';
import WorldMap from './components/WorldMap';
import GameControls from './components/GameControls';

const API_URL = 'http://localhost:5000/api';

// Space theme color palette
const COLORS = {
  ocean: '#0a1128',
  land: '#1c2541',
  cardBg: 'rgba(28, 37, 65, 0.8)',
  hover: '#5bc0be',
  selected: '#6fffe9',
  correct: '#06D6A0',
  incorrect: '#ff006e',
  border: '#5bc0be',
  text: '#ffffff',
  textSecondary: '#b8c5d6',
  glow: 'rgba(91, 192, 190, 0.6)'
};

function App() {
  const [targetCountry, setTargetCountry] = useState(null);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [gameStatus, setGameStatus] = useState('playing'); // 'playing', 'correct', 'incorrect'
  const [showHint, setShowHint] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [highlightedCountries, setHighlightedCountries] = useState([]);
  const [correctlyAnsweredCountries, setCorrectlyAnsweredCountries] = useState([]);

  // Fetch a random country on mount and when new game is started
  const fetchRandomCountry = async () => {
    try {
      if (initialLoad) {
        setLoading(true);
      }
      setGameStatus('playing');
      setShowHint(false);
      setHintUsed(false);
      setHighlightedCountries([]);

      const response = await fetch(`${API_URL}/game/random-country`);
      const data = await response.json();

      // If this country has already been answered correctly, fetch another one
      if (correctlyAnsweredCountries.includes(data.country.iso)) {
        console.log('⏭️ Country already answered, fetching another...');
        fetchRandomCountry();
        return;
      }

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

    setAttempts(prev => prev + 1);

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
        setScore(prev => prev + (hintUsed ? 5 : 10)); // Less points if hint was used
        setGameStatus('correct');
        // Add country to correctly answered list
        setCorrectlyAnsweredCountries(prev => [...prev, targetCountry.iso]);
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

  // Handle hint button
  const handleShowHint = async () => {
    if (!targetCountry || hintUsed) return;

    try {
      const response = await fetch(`${API_URL}/game/country-neighbors/${targetCountry.iso}`);
      const data = await response.json();

      let toHighlight = [data.iso, ...data.neighbors];

      // If country has no neighbors, pick 5 random countries instead
      if (data.neighbors.length === 0) {
        const allCountriesResponse = await fetch(`${API_URL}/game/countries`);
        const allCountriesData = await allCountriesResponse.json();

        // Filter out the target country and already answered countries
        const availableCountries = allCountriesData.countries
          .filter(c => c.iso !== targetCountry.iso && !correctlyAnsweredCountries.includes(c.iso))
          .map(c => c.iso);

        // Shuffle and pick 5 random countries
        const shuffled = availableCountries.sort(() => 0.5 - Math.random());
        const randomCountries = shuffled.slice(0, 5);

        toHighlight = [data.iso, ...randomCountries];
      }

      setHighlightedCountries(toHighlight);
      setShowHint(true);
      setHintUsed(true);
    } catch (err) {
      console.error('Error fetching hint:', err);
    }
  };

  // Handle start over button
  const handleStartOver = () => {
    setCorrectlyAnsweredCountries([]);
    setScore(0);
    setAttempts(0);
    fetchRandomCountry();
  };

  return (
    <div className="App">
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #0a1128 0%, #1c2541 25%, #3a506b 50%, #5bc0be 100%)',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <h1 style={{
            textAlign: 'center',
            color: '#ffffff',
            marginBottom: '30px',
            fontSize: '2.5em',
            textShadow: '0 0 10px rgba(91, 192, 190, 0.8), 0 0 20px rgba(91, 192, 190, 0.6), 2px 2px 4px rgba(0, 0, 0, 0.5)'
          }}>
            🌍 World Map Geography Game
          </h1>

          {loading ? (
            <p style={{ textAlign: 'center', color: '#ffffff', fontSize: '1.2em' }}>Loading game...</p>
          ) : (
            <>
              <GameControls
                targetCountry={targetCountry}
                score={score}
                attempts={attempts}
                onNewGame={fetchRandomCountry}
                onStartOver={handleStartOver}
                onShowHint={handleShowHint}
                hintUsed={hintUsed}
                gameStatus={gameStatus}
                correctlyAnsweredCount={correctlyAnsweredCountries.length}
              />

              <div style={{
                backgroundColor: COLORS.cardBg,
                borderRadius: '8px',
                boxShadow: `0 0 20px ${COLORS.glow}, 0 4px 6px rgba(0, 0, 0, 0.3)`,
                padding: '20px',
                border: `2px solid ${COLORS.border}`,
                backdropFilter: 'blur(10px)'
              }}>
                <WorldMap
                  onCountryClick={handleCountryClick}
                  highlightedCountries={highlightedCountries}
                  targetCountry={targetCountry?.iso}
                  showHint={showHint}
                  continent={targetCountry?.continent}
                  correctlyAnsweredCountries={correctlyAnsweredCountries}
                  gameStatus={gameStatus}
                />
              </div>

              <div style={{
                marginTop: '20px',
                padding: '15px',
                backgroundColor: COLORS.cardBg,
                borderRadius: '8px',
                boxShadow: `0 0 15px ${COLORS.glow}, 0 2px 4px rgba(0, 0, 0, 0.3)`,
                textAlign: 'center',
                border: `2px solid ${COLORS.border}`,
                backdropFilter: 'blur(10px)'
              }}>
                <h3 style={{ margin: '0 0 10px 0', color: COLORS.text, textShadow: `0 0 10px ${COLORS.glow}` }}>How to Play</h3>
                <p style={{ margin: 0, color: COLORS.textSecondary }}>
                  The globe automatically rotates to the continent when a new country is selected.
                  Hover over countries to see their names. Click on the correct country.
                  <br />
                  Use the rotate and zoom buttons to navigate the globe manually.
                  <br />
                  Use hints to see the country and its neighbors highlighted.
                  <br />
                  <strong>Scoring:</strong> Correct answer = 10 points | With hint = 5 points
                  <br />
                  <strong>Green countries</strong> have already been found!
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
