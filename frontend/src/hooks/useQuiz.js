/**
 * Custom hook for quiz game logic
 */
import { useState, useEffect, useRef } from 'react';
import { fetchRandomCountry, checkAnswer } from '../services/api';

export const useQuiz = () => {
  const [targetCountry, setTargetCountry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gameStatus, setGameStatus] = useState('playing'); // 'playing', 'correct', 'incorrect'
  const isInitialLoad = useRef(true);

  // Function to reset game status back to playing (for retrying after incorrect answer)
  const resetGameStatus = () => {
    setGameStatus('playing');
  };

  // Fetch a random country for the quiz
  const fetchNewCountry = async () => {
    try {
      // Only show loading state on initial load
      if (isInitialLoad.current) {
        setLoading(true);
      }

      setGameStatus('playing');
      const country = await fetchRandomCountry();
      // Use common_name if available, fallback to name
      const countryWithDisplayName = {
        ...country,
        name: country.common_name || country.name
      };
      setTargetCountry(countryWithDisplayName);

      // Add 5-second delay ONLY on initial load for testing loading state
      if (isInitialLoad.current) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        isInitialLoad.current = false;
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching random country:', err);
      if (isInitialLoad.current) {
        setLoading(false);
      }
    }
  };

  // Initialize with a random country on mount
  useEffect(() => {
    fetchNewCountry();
  }, []);

  // Handle country selection/answer
  const handleCountryClick = async (countryIso) => {
    if (gameStatus !== 'playing' || !targetCountry) return;

    try {
      const result = await checkAnswer(countryIso, targetCountry.iso);

      if (result.correct) {
        setGameStatus('correct');
        // Don't auto-fetch new country - wait for user to click "Next" button
      } else {
        setGameStatus('incorrect');
        // Stay in incorrect state - no timeout reset
        // User can try again, hints persist until correct or new country
      }
    } catch (err) {
      console.error('Error checking answer:', err);
    }
  };

  return {
    targetCountry,
    loading,
    gameStatus,
    handleCountryClick,
    fetchNewCountry,
    resetGameStatus
  };
};
