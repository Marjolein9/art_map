import { useState, useRef } from 'react';
import { fetchRandomCountry, checkAnswer } from '../services/api';

export const useQuiz = (backendReady) => {
  const [targetCountry, setTargetCountry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gameStatus, setGameStatus] = useState('playing'); // 'playing', 'correct', 'incorrect'
  const isInitialLoad = useRef(true);

  const resetGameStatus = () => {
    setGameStatus('playing');
  };

  const fetchNewCountry = async () => {
    try {
      if (isInitialLoad.current) setLoading(true);

      setGameStatus('playing');
      const country = await fetchRandomCountry();
      const countryWithDisplayName = {
        ...country,
        name: country.common_name || country.name
      };
      setTargetCountry(countryWithDisplayName);

      if (isInitialLoad.current) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        isInitialLoad.current = false;
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching random country:', err);
      if (isInitialLoad.current) setLoading(false);
    }
  };

  const handleCountryClick = async (countryIso) => {
    if (gameStatus !== 'playing' || !targetCountry) return;
    try {
      const result = await checkAnswer(countryIso, targetCountry.iso);
      setGameStatus(result.correct ? 'correct' : 'incorrect');
    } catch (err) {
      console.error('Error checking answer:', err);
    }
  };

  const setManualTargetCountry = (country) => {
    setGameStatus('playing');
    const countryWithDisplayName = {
      iso: country.iso3 || country.iso,
      name: country.common_name || country.name,
      common_name: country.common_name,
      continent: country.continent,
      subregion: country.subregion
    };
    setTargetCountry(countryWithDisplayName);
  };

  return {
    targetCountry,
    loading,
    gameStatus,
    handleCountryClick,
    fetchNewCountry,
    resetGameStatus,
    setManualTargetCountry
  };
};
