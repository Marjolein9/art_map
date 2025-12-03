/**
 * Custom hook for quiz game logic
 */
import { useState, useEffect } from 'react';
import { fetchRandomCountry, checkAnswer } from '../services/api';

export const useQuiz = () => {
  const [targetCountry, setTargetCountry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gameStatus, setGameStatus] = useState('playing'); // 'playing', 'correct', 'incorrect'

  // Fetch a random country for the quiz
  const fetchNewCountry = async () => {
    try {
      setGameStatus('playing');
      const country = await fetchRandomCountry();
      console.log('🎲 Fetched new country:', country);
      setTargetCountry(country);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching random country:', err);
      setLoading(false);
    }
  };

  // Initialize with a random country on mount
  useEffect(() => {
    fetchNewCountry();
  }, []);

  // Log target country changes
  useEffect(() => {
    if (targetCountry) {
      console.log('🗺️ Target country changed:', {
        country: targetCountry.name,
        continent: targetCountry.continent,
        subregion: targetCountry.subregion,
        iso: targetCountry.iso
      });
    }
  }, [targetCountry]);

  // Handle country selection/answer
  const handleCountryClick = async (countryIso) => {
    if (gameStatus !== 'playing' || !targetCountry) return;

    console.log('🎯 Checking answer:', {
      clickedCountry: countryIso,
      targetCountry: targetCountry.iso,
      targetName: targetCountry.name
    });

    try {
      const result = await checkAnswer(countryIso, targetCountry.iso);
      console.log('📊 Answer result:', result);

      if (result.correct) {
        setGameStatus('correct');
        setTimeout(() => {
          fetchNewCountry(); // Auto start new round after 2 seconds
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

  return {
    targetCountry,
    loading,
    gameStatus,
    handleCountryClick,
    fetchNewCountry
  };
};
