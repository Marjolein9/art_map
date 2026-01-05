/**
 * Content Settings Context
 *
 * Provides content-related settings (nudity filter, selected collections)
 * to all components without prop drilling.
 *
 * Separated from GameSettingsContext because content settings and game settings
 * are independent concerns. This follows the Single Responsibility Principle.
 */

import { createContext, useContext, useState } from 'react';

// Create context with default value
const ContentSettingsContext = createContext(null);

/**
 * Provider component that wraps the app and provides content settings
 */
export const ContentSettingsProvider = ({ children }) => {
  const [showNudity, setShowNudity] = useState(false);
  const [selectedCollections, setSelectedCollections] = useState([
    'Albert Kahn',
    'Children in Art',
    'Public Domain Review',
    'Met Museum'
  ]);

  // Package all state and setters into value object
  const value = {
    showNudity,
    setShowNudity,
    selectedCollections,
    setSelectedCollections,
  };

  return (
    <ContentSettingsContext.Provider value={value}>
      {children}
    </ContentSettingsContext.Provider>
  );
};

/**
 * Custom hook to access content settings
 *
 * Usage in any component:
 *   const { showNudity, setShowNudity } = useContentSettings();
 *
 * Throws error if used outside ContentSettingsProvider (helps catch bugs early)
 */
export const useContentSettings = () => {
  const context = useContext(ContentSettingsContext);

  if (!context) {
    throw new Error('useContentSettings must be used within ContentSettingsProvider');
  }

  return context;
};
