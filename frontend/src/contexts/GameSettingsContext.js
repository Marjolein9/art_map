/**
 * Game Settings Context
 *
 * Provides game-related settings (hints, region filter, quiz countries)
 * to all components without prop drilling.
 *
 * WHY USE CONTEXT?
 * - Avoids passing props through multiple component levels
 * - Makes components more reusable
 * - Centralizes game settings logic
 *
 * BEFORE: App -> WorldMap -> SomeChild (3 levels of prop passing)
 * AFTER: SomeChild directly accesses useGameSettings()
 */

import { createContext, useContext } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

// Create context with default value
const GameSettingsContext = createContext(null);

/**
 * Provider component that wraps the app and provides game settings
 */
export const GameSettingsProvider = ({ children }) => {
  const [hintsEnabled, setHintsEnabled] = useLocalStorage('artmap_hints_enabled', true);
  const [selectedQuizRegion, setSelectedQuizRegion] = useLocalStorage('artmap_quiz_region_v2', null);
  // Array of ISO3 codes the user has correctly identified — persists across sessions
  const [correctCountries, setCorrectCountries] = useLocalStorage('artmap_correct_countries', []);

  const addCorrectCountry = (iso) => {
    setCorrectCountries(prev => prev.includes(iso) ? prev : [...prev, iso]);
  };

  const clearCorrectCountries = () => setCorrectCountries([]);

  // Package all state and setters into value object
  const value = {
    hintsEnabled,
    setHintsEnabled,
    selectedQuizRegion,
    setSelectedQuizRegion,
    correctCountries,
    addCorrectCountry,
    clearCorrectCountries,
  };

  return (
    <GameSettingsContext.Provider value={value}>
      {children}
    </GameSettingsContext.Provider>
  );
};

/**
 * Custom hook to access game settings
 *
 * Usage in any component:
 *   const { hintsEnabled, setHintsEnabled } = useGameSettings();
 *
 * Throws error if used outside GameSettingsProvider (helps catch bugs early)
 */
export const useGameSettings = () => {
  const context = useContext(GameSettingsContext);

  if (!context) {
    throw new Error('useGameSettings must be used within GameSettingsProvider');
  }

  return context;
};
