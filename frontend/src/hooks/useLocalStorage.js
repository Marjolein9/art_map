import { useState, useEffect } from 'react';

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Sync to localStorage whenever storedValue changes.
  // This avoids closure-staleness bugs that occur when writing inside setValue.
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error('[useLocalStorage] Error saving to localStorage:', error);
    }
  }, [key, storedValue]);

  // Return the real React setter so functional updates (prev => ...) work correctly.
  return [storedValue, setStoredValue];
}
