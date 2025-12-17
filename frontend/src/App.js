import { useState, useEffect, useRef } from 'react';
import './styles/App.css';
import './styles/components.css';
import WorldMap from './components/WorldMap';
import ArtworkInfoBar from './components/ArtworkInfoBar';
import COLOR_SCHEME from './styles/colorSchemes';
import { useQuiz } from './hooks/useQuiz';
import { fetchCountries } from './services/api';

function App() {
  // ===========================================================================
  // STATE
  // ===========================================================================
  const [mode, setMode] = useState('explore');
  const [exploreCountry, setExploreCountry] = useState(null);
  const [infoBarOpen, setInfoBarOpen] = useState(false);
  const [countryLookup, setCountryLookup] = useState({});
  const [clickedCountry, setClickedCountry] = useState(null);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [exploreLoading, setExploreLoading] = useState(true);
  const [backendReady, setBackendReady] = useState(false);
  const isExploreInitialLoad = useRef(true);
  const COLORS = COLOR_SCHEME;

  // ===========================================================================
  // BACKEND FETCH & RETRY
  // ===========================================================================
  useEffect(() => {
    let cancelled = false;
    let retryTimeoutId = null;

    const loadCountries = async () => {
      try {
        console.log('[API] Trying to fetch countries...');
        const countries = await fetchCountries();
        if (cancelled) return;

        const lookup = {};
        countries.forEach(country => {
          lookup[country.iso3] = country.common_name || country.name;
        });
        setCountryLookup(lookup);

        if (isExploreInitialLoad.current) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          isExploreInitialLoad.current = false;
        }

        setExploreLoading(false);
        setBackendReady(true);
        console.log('[API] Backend available, explore mode ready');
      } catch (error) {
        console.error('[API] Backend unavailable, retrying in 10s...', error);
        retryTimeoutId = setTimeout(loadCountries, 10000);
      }
    };

    loadCountries();

    return () => {
      cancelled = true;
      if (retryTimeoutId) clearTimeout(retryTimeoutId);
    };
  }, []);

  // ===========================================================================
  // QUIZ HOOK
  // ===========================================================================
  const {
    targetCountry,
    loading,
    gameStatus,
    handleCountryClick,
    fetchNewCountry,
    resetGameStatus,
    setManualTargetCountry
  } = useQuiz(backendReady); // <-- pass backendReady

  // ===========================================================================
  // EVENT HANDLERS
  // ===========================================================================
  const handleModeToggle = () => {
    const newMode = mode === 'quiz' ? 'explore' : 'quiz';
    setMode(newMode);
    if (newMode === 'quiz') setExploreCountry(null);
  };

  const handleExploreClick = (countryIso) => {
    if (mode === 'explore') {
      setExploreCountry(countryIso);
      setInfoBarOpen(true);
    } else {
      setClickedCountry(countryIso);
      setAnswerSubmitted(true);
      handleCountryClick(countryIso);
      setInfoBarOpen(true);
    }
  };

  const handleCloseInfoBar = () => {
    setInfoBarOpen(false);
    setClickedCountry(null);
    setAnswerSubmitted(false);
    resetGameStatus();
  };

  const handleNextCountry = () => {
    setInfoBarOpen(false);
    setClickedCountry(null);
    setAnswerSubmitted(false);
    fetchNewCountry();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      if (mode === 'explore') handleCloseInfoBar();
      else {
        const isCorrect = clickedCountry === targetCountry?.iso;
        if (isCorrect) handleNextCountry();
        else handleCloseInfoBar();
      }
    }
  };

  const getCurrentCountryData = () => {
    if (mode === 'quiz') {
      if (clickedCountry) {
        const isCorrect = clickedCountry === targetCountry?.iso;
        return {
          iso: isCorrect ? targetCountry?.iso : clickedCountry,
          name: isCorrect ? targetCountry?.name : countryLookup[clickedCountry],
        };
      }
      return {
        iso: targetCountry?.iso,
        name: targetCountry?.name,
      };
    } else {
      return {
        iso: exploreCountry,
        name: countryLookup[exploreCountry],
      };
    }
  };

  const currentCountry = getCurrentCountryData();

  // ===========================================================================
  // RENDER
  // ===========================================================================
  return (
    <div className="App">
      <div className="app-background" style={{ '--bg-gradient': COLORS.backgroundGradient }}>
        <div className="app-container">
          <div className="app-content">
            <div
              className="map-container map-container-full"
              style={{
                '--card-bg': COLORS.cardBg,
                '--glow-color': COLORS.glow,
                '--border-color': COLORS.border,
              }}
            >
              <WorldMap
                backendReady={backendReady}
                onCountryClick={handleExploreClick}
                targetCountry={mode === 'quiz' ? targetCountry?.iso : null}
                targetCountryName={mode === 'quiz' ? targetCountry?.name : null}
                region={mode === 'quiz' && !loading ? (targetCountry?.subregion || targetCountry?.continent) : null}
                gameStatus={gameStatus}
                colors={COLORS}
                onNewGame={fetchNewCountry}
                onStartOver={fetchNewCountry}
                mode={mode}
                onModeToggle={handleModeToggle}
                loading={(loading && mode === 'quiz') || (exploreLoading && mode === 'explore')}
                onManualCountrySelect={setManualTargetCountry}
                countryLookup={countryLookup}
              />

              {((loading && mode === 'quiz') || (exploreLoading && mode === 'explore')) && (
                <div className="loading-overlay">
                  <div
                    className="loading-content"
                    style={{
                      '--card-bg': COLORS.cardBg,
                      '--text-color': COLORS.text,
                      '--glow-color': COLORS.glow,
                      '--border-color': COLORS.border,
                    }}
                  >
                    <div className="loading-spinner"></div>
                    <p className="loading-text">
                      {mode === 'quiz' ? 'Loading quiz data...' : 'Loading explore mode...'}
                    </p>
                  </div>
                </div>
              )}

              {infoBarOpen && currentCountry.iso && (
                <div className="artwork-backdrop" onClick={handleBackdropClick}>
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
        </div>
      </div>
    </div>
  );
}

export default App;
