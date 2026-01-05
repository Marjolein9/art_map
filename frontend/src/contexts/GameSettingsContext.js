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

import { createContext, useContext, useState } from 'react';

// Create context with default value
const GameSettingsContext = createContext(null);

/**
 * Provider component that wraps the app and provides game settings
 */
export const GameSettingsProvider = ({ children }) => {
  const [hintsEnabled, setHintsEnabled] = useState(true);
  const [selectedQuizRegion, setSelectedQuizRegion] = useState(null);
  const [quizCountriesOnly, setQuizCountriesOnly] = useState(true);

  // Package all state and setters into value object
  const value = {
    hintsEnabled,
    setHintsEnabled,
    selectedQuizRegion,
    setSelectedQuizRegion,
    quizCountriesOnly,
    setQuizCountriesOnly,
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
