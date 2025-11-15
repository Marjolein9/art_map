import { useState, useEffect } from 'react';
import './App.css';
import WorldMap from './components/WorldMap';
import GameControls from './components/GameControls';

const API_URL = 'http://localhost:5000/api';

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

      // Highlight the target country and its neighbors
      const toHighlight = [data.iso, ...data.neighbors];
      setHighlightedCountries(toHighlight);
      setShowHint(true);
      setHintUsed(true);
    } catch (err) {
      console.error('Error fetching hint:', err);
    }
  };

  return (
    <div className="App">
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        padding: '20px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '30px' }}>
            World Map Geography Game
          </h1>

          {loading ? (
            <p style={{ textAlign: 'center' }}>Loading game...</p>
          ) : (
            <>
              <GameControls
                targetCountry={targetCountry}
                score={score}
                attempts={attempts}
                onNewGame={fetchRandomCountry}
                onShowHint={handleShowHint}
                hintUsed={hintUsed}
                gameStatus={gameStatus}
              />

              <div style={{
                backgroundColor: '#fff',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                padding: '20px'
              }}>
                <WorldMap
                  onCountryClick={handleCountryClick}
                  highlightedCountries={highlightedCountries}
                  targetCountry={targetCountry?.iso}
                  showHint={showHint}
                  continent={targetCountry?.continent}
                />
              </div>

              <div style={{
                marginTop: '20px',
                padding: '15px',
                backgroundColor: '#fff',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                textAlign: 'center'
              }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>How to Play</h3>
                <p style={{ margin: 0, color: '#666' }}>
                  The map automatically zooms to the continent when a new country is selected.
                  Click on the correct country. Use hints to see the country and its neighbors highlighted.
                  <br />
                  <strong>Scoring:</strong> Correct answer = 10 points | With hint = 5 points
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
