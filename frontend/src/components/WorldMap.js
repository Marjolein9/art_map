/**
 * WorldMap Component
 *
 * This is a React component that displays an interactive 3D globe for a geography quiz game.
 *
 * REACT BASICS:
 * - Components are reusable pieces of UI that can accept inputs (props) and manage their own state
 * - This component uses React Hooks (special functions that let you "hook into" React features)
 */

// Import statements bring in code from other files so we can use it here
import React, { memo, useState, useEffect, useRef, useMemo } from 'react';
// React: The core React library
// memo: A performance optimization that prevents unnecessary re-renders when props haven't changed
// useState: Hook that lets us add state variables (data that can change) to our component
// useEffect: Hook that lets us perform side effects (like fetching data, setting up listeners)
// useRef: Hook that creates a persistent reference to a value or DOM element across re-renders
// useMemo: Hook that memoizes (caches) expensive calculations so they only run when needed

import Globe from 'react-globe.gl';
// Globe: A 3D globe visualization library that renders an interactive Earth

import { Button, Box, Select, MenuItem, FormControlLabel, Switch, IconButton, Typography } from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
// Material-UI (MUI): A popular React component library that provides pre-built, styled components
// Button: Clickable button component
// Box: A flexible container component for layout
// IconButton: Button component for icons
// Select/MenuItem: Dropdown menu components
// FormControlLabel/Switch: Toggle switch components
// SettingsIcon: Gear icon from Material-UI icons

import { getCountryIsoCode, initializeCountryMapping } from '../utils/countryCodeMapping';
// Utility functions for working with country codes (ISO3 format like "USA", "DEU")

import { REGION_VIEWS } from '../config/regions';
// Configuration object defining camera positions for different world regions

import { loadTopoJSON } from '../utils/topoJsonLoader';
// Function to load TopoJSON map data (a compact format for geographic boundaries)

import { fetchCountries } from '../services/api';
// API functions that fetch data from our backend server
// fetchCountries: Gets list of all countries

import { getPathColor, getPathStrokeColor } from '../utils/pastelColorPalette';
// Functions that determine what colors to use for country borders

import { getDisplayName } from '../utils/displayHelpers';

import { debug, error as logError } from '../utils/logger';
// Logger utility for environment-aware logging
// Helper function to format country/territory names as "Territory (Parent Country)"

import { useGameSettings } from '../contexts/GameSettingsContext';
// Context hook for accessing game settings without prop drilling

/**
 * WorldMap Component Definition
 *
 * PROPS (Component Inputs):
 * Props are like parameters passed to a function - they let parent components configure this component.
 * We use "destructuring" syntax ({ prop1, prop2 }) to extract individual props from the props object.
 */
const QUIZ_REGIONS = ['Africa', 'Americas', 'Asia', 'Europe', 'Oceania'];

const WorldMap = ({
  onCountryClick,          // Function to call when user clicks a country
  targetCountry = null,    // The country the user needs to find (ISO3 code)
  targetCountryName = null,// Human-readable name of target country
  region = null,           // Current region view (e.g., "Europe", "Asia")
  colors,                  // Color scheme object with theme colors
  onNewGame,              // Function to start a new quiz game
  onStartOver,            // Function to skip to next country
  mode = 'quiz',          // Current mode: 'quiz' or 'explore'
  onModeToggle,           // Function to toggle between quiz and explore modes
  loading = false,        // Whether data is currently being loaded
  onManualCountrySelect = null, // Function to manually select a country from dropdown
  countryLookup = {},     // Object mapping country codes to country data
  backendReady = false,   // Whether the backend server is ready to accept requests
}) => {
  // Get game settings from context instead of props
  const { hintsEnabled, selectedQuizRegion, setSelectedQuizRegion, correctCountries, clearCorrectCountries } = useGameSettings();
  const [showFoundList, setShowFoundList] = useState(false);
  const foundTrackerRef = useRef(null);
  // Ref to always have the latest onStartOver when region changes
  const onStartOverRef = useRef(onStartOver);
  useEffect(() => { onStartOverRef.current = onStartOver; });
  // Store colors in a constant for easy access throughout the component
  const COLORS = colors;

  /**
   * STATE VARIABLES
   *
   * State variables hold data that can change over time. When state changes, React automatically
   * re-renders the component to show the updated data.
   *
   * Syntax: const [value, setValue] = useState(initialValue)
   * - value: The current state value
   * - setValue: Function to update the state
   * - initialValue: Starting value when component first renders
   */

  // globeEl: Reference to the Globe component so we can control it (zoom, rotate, etc.)
  // useRef creates a "reference" that persists across re-renders without causing re-renders when changed
  const globeEl = useRef();

  // countries: Holds the GeoJSON data for all country boundaries
  // GeoJSON is a standard format for encoding geographic shapes
  const [countries, setCountries] = useState({ features: [] });

  // countryPaths: Array of individual polygons for each country (some countries have multiple pieces)
  const [countryPaths, setCountryPaths] = useState([]);

  // hoverD: Currently hovered country (null if no country is hovered)
  const [hoverD, setHoverD] = useState(null);

  // previousRegionRef: Tracks the last region we viewed (used to detect region changes)
  const previousRegionRef = useRef(null);

  // clickedCountry: The country the user last clicked (ISO3 code)
  const [clickedCountry, setClickedCountry] = useState(null);

  // hintNeighborsM49: Array of UN M49 codes for countries to highlight as hints
  // M49 is a numeric country code system (e.g., 276 for Germany, 840 for USA)
  const [hintNeighborsM49, setHintNeighborsM49] = useState([]);

  // globeDimensions: Width and height of the globe in pixels
  const [globeDimensions, setGlobeDimensions] = useState({
    width: window.innerWidth - 60,   // Full window width minus margins
    height: window.innerHeight - 120 // Full window height minus header/footer space
  });

  // hintsEnabled is now passed as a prop from App.js

  // allCountries: Complete list of valid countries from the database
  const [allCountries, setAllCountries] = useState([]);

  // showMeActivated: Whether user clicked "Show Me" button to reveal the answer
  const [showMeActivated, setShowMeActivated] = useState(false);

  // showTargetOverlay: Controls visibility of "Find: [Country]" overlay in quiz mode
  const [showTargetOverlay, setShowTargetOverlay] = useState(false);

  // exploreSelectedCountry: Tracks the selected country in explore mode
  const [exploreSelectedCountry, setExploreSelectedCountry] = useState('');

  /**
   * SIDE EFFECTS
   *
   * useEffect is a Hook that runs code in response to component lifecycle events or data changes.
   * It's used for:
   * - Fetching data from APIs
   * - Setting up event listeners (like window resize)
   * - Updating the DOM
   * - Cleaning up resources
   *
   * Syntax: useEffect(() => { ...code here... }, [dependencies])
   * - The function runs when dependencies change
   * - Empty array [] means run only once when component mounts
   * - Return a cleanup function to run when component unmounts or before re-running
   */

  // Handle window resize for responsive globe
  // This ensures the globe resizes when the browser window changes size
  useEffect(() => {
    // Define a function that calculates new globe dimensions based on window size
    const updateGlobeDimensions = () => {
      // Get current window dimensions
      const width = window.innerWidth;
      const height = window.innerHeight;
      let globeWidth, globeHeight;

      // Adjust globe size based on screen size (smaller margins on mobile)
      if (width <= 768) {
        // Mobile devices
        globeWidth = width - 40;
        globeHeight = height - 100;
      } else if (width <= 1024) {
        // Tablets
        globeWidth = width - 60;
        globeHeight = height - 120;
      } else {
        // Desktop
        globeWidth = width - 60;
        globeHeight = height - 120;
      }

      // Update state with new dimensions (triggers re-render with new size)
      setGlobeDimensions({ width: globeWidth, height: globeHeight });
    };

    // Run once when component first loads
    updateGlobeDimensions();

    // Set up event listener to run updateGlobeDimensions whenever window is resized
    // addEventListener attaches a function to browser events (resize, click, etc.)
    window.addEventListener('resize', updateGlobeDimensions);

    // Cleanup function: Remove event listener when component unmounts
    // This prevents memory leaks and errors from listeners on unmounted components
    return () => window.removeEventListener('resize', updateGlobeDimensions);
  }, []); // Empty dependency array = run only once on mount

  /**
   * ASYNC DATA LOADING
   *
   * This effect loads country data from the backend when it becomes ready.
   *
   * ASYNC/AWAIT:
   * - async marks a function that performs asynchronous operations
   * - await pauses execution until a Promise resolves (like waiting for server response)
   * - This lets us write async code that looks synchronous
   */
  useEffect(() => {
    // Guard clause: Don't load data until backend is ready
    if (!backendReady) return;

    // Define an async function to load data (can't use async directly in useEffect)
    const loadData = async () => {
      try {
        // TRY/CATCH: Error handling for code that might fail
        // try block: Code that might throw an error
        // catch block: Code to run if an error occurs

        // await pauses here until fetchCountries() completes
        // fetchCountries() returns a Promise that resolves to country data
        const dbCountries = await fetchCountries();

        // Initialize mapping between country codes
        initializeCountryMapping(dbCountries);

        const validCountries = dbCountries.filter(c => c.include_in_quiz);
        setAllCountries(validCountries);

        // Load TopoJSON map data
        const data = await loadTopoJSON(dbCountries);
        setCountries(data);

        // Process country shapes into individual paths for rendering
        const paths = [];

        // forEach loops through each element in an array
        data.features.forEach(feature => {
          // Check geometry type - countries can be simple Polygons or MultiPolygons (with islands)
          if (feature.geometry.type === 'Polygon') {
            // Single polygon - add it directly
            paths.push({
              coords: feature.geometry.coordinates,
              properties: feature.properties,
              geometry: feature.geometry,
              id: feature.id
            });
          } else if (feature.geometry.type === 'MultiPolygon') {
            // Multiple polygons (islands) - add each one separately
            feature.geometry.coordinates.forEach(islandCoords => {
              paths.push({
                coords: islandCoords,
                properties: feature.properties,
                geometry: {
                  ...feature.geometry,  // Spread operator: copies all properties from feature.geometry
                  coordinates: islandCoords,
                  type: 'Polygon'
                },
                id: feature.id
              });
            });
          }
        });

        setCountryPaths(paths);
      } catch (err) {
        // If any error occurs in the try block, this code runs
        logError('Error loading country data:', err);
      }
    };

    // Call the async function we just defined
    loadData();
  }, [backendReady]);

  /**
   * HINTS SYSTEM
   *
   * This effect manages the hint system that highlights neighboring countries or similar islands.
   */

  // Track which country we've fetched hints for (prevents re-fetching same hints)
  const hintCountryRef = useRef(null);

  useEffect(() => {
    if (!backendReady) return;

    const showHints = async () => {
      // Only show hints in quiz mode when hints are enabled and there's a target country
      if (targetCountry && mode === 'quiz' && hintsEnabled) {
        // Skip if we already fetched hints for this country
        if (hintCountryRef.current === targetCountry) {
          return;
        }

        console.log(`[Map] 📡 Fetching hints for ${targetCountry} (prev: ${hintCountryRef.current})`);

        try {
          // Find the target country's data from the GeoJSON features
          // Array.find returns the first element that matches the condition
          const targetCountryData = countries.features.find(f => getCountryIsoCode(f) === targetCountry);

          // Get the UN M49 code (numeric country code) from the target country
          // Optional chaining (?.) safely accesses properties that might not exist
          const targetM49 = targetCountryData?.id;

          // Array to collect M49 codes of countries to highlight as hints
          const highlightM49s = [];

          // Include target country in hints (so it's highlighted too)
          if (targetM49) {
            // String() converts to string, padStart(3,'0') ensures 3 digits (e.g., 40 → '040')
            highlightM49s.push(String(targetM49).padStart(3,'0'));
          }

          // Get target country details for subregion/region fallback
          const targetCountryInfo = allCountries.find(c => c.iso3 === targetCountry);
          const targetSubregion = targetCountryInfo?.subregion;

          // TESTING: Highlight entire subregion for zoom level testing
          // TO REVERT: Replace this section with the original neighbor-based hint logic

          // Get all countries in the same subregion
          const subregionCountries = allCountries.filter(c =>
            c.subregion === targetSubregion && c.iso3 !== targetCountry
          );

          // Convert all subregion countries to M49 codes
          const subregionM49s = subregionCountries
            .map(c => String(c.m49).padStart(3,'0'))
            .filter(Boolean);

          highlightM49s.push(...subregionM49s);

          debug(`🎯 Highlighting entire ${targetSubregion} subregion (${subregionM49s.length} countries)`);

          // Template literal (`string ${variable}`) embeds variables in strings
          console.log(`[Map] ✅ Hints for ${targetCountry}: ${targetSubregion} — ${highlightM49s.length} countries`);
          setHintNeighborsM49(highlightM49s);

          // Remember which country we fetched hints for
          hintCountryRef.current = targetCountry;

        } catch (err) {
          logError('❌ Error fetching hints:', err);
        }
      } else {
        // Clear hints when not in quiz mode or hints disabled
        if (hintNeighborsM49.length > 0) {
          console.log(`[Map] 🚫 Hints cleared — ${!targetCountry ? 'no target' : !hintsEnabled ? 'hints off' : 'not quiz mode'}`);
          setHintNeighborsM49([]);
          hintCountryRef.current = null;
        }
      }
    };

    showHints();
  }, [targetCountry, targetCountryName, mode, countries, hintsEnabled, backendReady, clickedCountry, allCountries]);
  // Re-run when any of these dependencies change

  // Reset hint state when a new target appears
  const prevTargetCountryRef = useRef(null);
  useEffect(() => {
    // Check if target country changed (and wasn't just set initially)
    if (prevTargetCountryRef.current && prevTargetCountryRef.current !== targetCountry) {
      console.log(`[Map] 🎯 Target changed: ${prevTargetCountryRef.current} → ${targetCountry}`);
      setClickedCountry(null);
      setShowMeActivated(false);
    } else if (!prevTargetCountryRef.current && targetCountry) {
      console.log(`[Map] 🎯 Initial target set: ${targetCountry}`);
    }
    // Update our record of the previous target
    prevTargetCountryRef.current = targetCountry;
  }, [targetCountry, mode]);

  // Show "Find: [Country]" overlay when target country changes in quiz mode
  useEffect(() => {
    if (mode === 'quiz' && targetCountryName && targetCountry) {
      // Show the overlay
      setShowTargetOverlay(true);

      // Hide after 5 seconds
      const timer = setTimeout(() => {
        setShowTargetOverlay(false);
      }, 5000);

      // Cleanup: clear timeout if component unmounts or targetCountry changes
      return () => clearTimeout(timer);
    } else {
      // Hide overlay if not in quiz mode
      setShowTargetOverlay(false);
    }
  }, [targetCountry, targetCountryName, mode]);

  // Determine which hints to show (empty if "Show Me" was clicked)
  // Moved activeHints calculation into useMemo to fix dependency warning
  // const activeHints = showMeActivated ? [] : hintNeighborsM49;

  // Clear explore selection when switching modes
  useEffect(() => {
    if (mode === 'quiz') {
      setExploreSelectedCountry('');
    }
  }, [mode]);

  // Close found-countries panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (foundTrackerRef.current && !foundTrackerRef.current.contains(e.target)) {
        setShowFoundList(false);
      }
    };
    if (showFoundList) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFoundList]);

  // Fetch a new country when quiz region changes (defer so React re-renders first)
  const prevRegionRef = useRef(selectedQuizRegion);
  useEffect(() => {
    if (prevRegionRef.current !== selectedQuizRegion && mode === 'quiz') {
      prevRegionRef.current = selectedQuizRegion;
      setTimeout(() => onStartOverRef.current(), 50);
    } else {
      prevRegionRef.current = selectedQuizRegion;
    }
  }, [selectedQuizRegion, mode]);

  // Rotate to region on change OR when new country appears (to reset manual adjustments)
  useEffect(() => {
    // Guard clause: ensure globe exists and we're in quiz mode with a region
    if (!globeEl.current || !region || mode !== 'quiz') return;

    // Get camera position for this region (or default if not found)
    const targetView = REGION_VIEWS[region] || REGION_VIEWS['default'];

    // Move camera to region's position over 1000ms (1 second)
    // This resets the view even if user manually adjusted it
    globeEl.current.pointOfView({
      lat: targetView.lat,      // Latitude
      lng: targetView.lng,      // Longitude
      altitude: targetView.altitude  // Zoom level
    }, 1000);

    // Update tracking ref
    previousRegionRef.current = region;
  }, [region, targetCountry, mode]);

  // Zoom to Middle East during loading
  useEffect(() => {
    if (!globeEl.current) return;
    if (loading) globeEl.current.pointOfView({ lat:30, lng:45, altitude:1 }, 1000);
  }, [loading]);

  /**
   * EVENT HANDLERS
   *
   * Functions that respond to user interactions (clicks, hovers, etc.)
   */

  // Called when user clicks a country on the globe
  const handlePolygonClick = (polygon) => {
    // Guard clauses: validate input
    if (!polygon || !polygon.properties) return;

    // Get the ISO3 code for the clicked country
    const iso3 = getCountryIsoCode(polygon);

    // Update which country is clicked
    setClickedCountry(iso3 || null);

    // Notify parent component
    onCountryClick(iso3);
  };

  /**
   * UTILITY FUNCTIONS
   */

  // Calculate the center point (centroid) of a country's geometry
  const calculateCentroid = (coordinates) => {
    let latSum = 0, lngSum = 0, count = 0;

    // Recursive function to process nested coordinate arrays
    const processCoords = (coords) => {
      // Check if this is nested arrays (MultiPolygon structure)
      if (Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
        coords.forEach(c => processCoords(c));
      } else {
        // Base case: array of [lng, lat] coordinate pairs
        coords.forEach(([lng, lat]) => {
          lngSum += lng;
          latSum += lat;
          count++;
        });
      }
    };

    processCoords(coordinates);

    // Return average of all coordinates (or null if no coordinates found)
    // Ternary operator: condition ? valueIfTrue : valueIfFalse
    return count > 0 ? { lat: latSum / count, lng: lngSum / count } : null;
  };

  // "Show Me" button handler - reveals the target country
  const handleShowMe = () => {
    if (!targetCountry || !globeEl.current) return;

    // Find target country in our data
    const targetFeature = countries.features.find(f => getCountryIsoCode(f) === targetCountry);
    if (!targetFeature) return;

    // Calculate center of the country
    const centroid = calculateCentroid(targetFeature.geometry.coordinates);
    if (!centroid) return;

    // Zoom to country's center
    globeEl.current.pointOfView({
      lat: centroid.lat,
      lng: centroid.lng,
      altitude: 0.5  // Close zoom
    }, 1000);

    // Mark that we've shown the answer
    setShowMeActivated(true);
  };

  // Handle country selection from dropdown menu
  const handleCountryDropdownChange = (e) => {
    // e.target.value contains the selected option's value
    const iso3 = e.target.value;
    if (!iso3) return;

    // Find the full country data object
    const selectedCountry = allCountries.find(c => c.iso3 === iso3);
    if (!selectedCountry) return;

    // In quiz mode, use the manual select callback
    if (mode === 'quiz' && onManualCountrySelect) {
      onManualCountrySelect(selectedCountry);
    } else if (mode === 'explore') {
      // In explore mode, zoom to the country's center (like "Show" button)
      setExploreSelectedCountry(iso3);

      // Find the country feature in our data
      const targetFeature = countries.features.find(f => getCountryIsoCode(f) === iso3);
      if (!targetFeature) return;

      // Calculate center of the country
      const centroid = calculateCentroid(targetFeature.geometry.coordinates);
      if (!centroid) return;

      // Zoom to country's center (same as "Show" button)
      if (globeEl.current) {
        globeEl.current.pointOfView({
          lat: centroid.lat,
          lng: centroid.lng,
          altitude: 1.0  // Medium zoom
        }, 1000);
      }

      // Trigger the country click to show artwork overlay after 3 seconds
      setTimeout(() => {
        onCountryClick(iso3);
      }, 3000);
    }
  };

  /**
   * MEMOIZED VALUES
   *
   * useMemo caches expensive calculations so they only re-run when dependencies change.
   * This improves performance by avoiding unnecessary recalculations on every render.
   *
   * Syntax: const value = useMemo(() => expensiveCalculation, [dependencies])
   */

  // Build layered paths for rendering (base countries + hint overlays + show-me overlay)
  const layeredPaths = useMemo(() => {
    const paths = [];
    const activeHints = showMeActivated ? [] : hintNeighborsM49;

    // Timestamp ensures paths update when needed (forces re-render in Globe component)
    const timestamp = Date.now();

    // Assign each unique country a stable altitude index based on its order in countryPaths.
    // This gives every country a unique depth so adjacent borders never share the same altitude,
    // eliminating z-fighting along shared edges. The spread (426 countries × 0.000002 ≈ 0.00085)
    // is imperceptible visually but large enough for the 24-bit depth buffer to distinguish.
    const countryAltMap = {};
    let countryAltCounter = 0;
    countryPaths.forEach(path => {
      const iso3 = getCountryIsoCode(path);
      if (!(iso3 in countryAltMap)) {
        countryAltMap[iso3] = countryAltCounter++ * 0.000002;
      }
    });

    // Layer 1: Base country paths (all countries, no special styling)
    const islandIndex = {};
    countryPaths.forEach(path => {
      const iso3 = getCountryIsoCode(path);
      const currentIslandIdx = (islandIndex[iso3] || 0);
      islandIndex[iso3] = currentIslandIdx + 1;

      paths.push({
        ...path,
        isHintOverlay: false,
        isShowMeOverlay: false,
        _updateKey: timestamp,
        _order: 0,
        // Per-country unique base (0.002+) + per-island micro-offset to prevent all forms of z-fighting
        pathAltitude: 0.002 + countryAltMap[iso3] + currentIslandIdx * 0.000001
      });
    });

    // Layer 2: Hint overlays — same per-country altitude logic, shifted up by 0.002
    const hintIslandIndex = {};
    countryPaths.forEach(path => {
      const m49 = path.id || path.properties?.id;
      const paddedM49 = m49 ? String(m49).padStart(3, '0') : null;

      if (paddedM49 && activeHints.includes(paddedM49)) {
        const iso3 = getCountryIsoCode(path);
        const currentIslandIdx = (hintIslandIndex[iso3] || 0);
        hintIslandIndex[iso3] = currentIslandIdx + 1;

        paths.push({
          ...path,
          isHintOverlay: true,
          isShowMeOverlay: false,
          _updateKey: timestamp,
          _order: 1,
          pathAltitude: 0.004 + countryAltMap[iso3] + currentIslandIdx * 0.000001
        });
      }
    });

    // Layer 3: "Show Me" overlay (highlights the correct answer)
    // Order 2, altitude 0.004
    if (showMeActivated && targetCountry) {
      countryPaths.forEach(path => {
        const iso3 = getCountryIsoCode(path);
        if (iso3 === targetCountry) paths.push({
          ...path,
          isHintOverlay: false,
          isShowMeOverlay: true,  // Flag this as the revealed answer
          _updateKey: timestamp,
          _order: 2,              // Render last, always on top
          pathAltitude: 0.006     // Above hint layer (0.004)
        });
      });
    }

    // Layer 4: Explore mode selection (highlights the selected country in explore mode)
    // Order 2, altitude 0.004
    if (mode === 'explore' && exploreSelectedCountry) {
      countryPaths.forEach(path => {
        const iso3 = getCountryIsoCode(path);
        if (iso3 === exploreSelectedCountry) paths.push({
          ...path,
          isHintOverlay: false,
          isShowMeOverlay: true,  // Use same highlight as "Show Me"
          _updateKey: timestamp,
          _order: 2,              // Same order as "Show Me"
          pathAltitude: 0.006     // Above hint layer (0.004)
        });
      });
    }

    // Warn only if z-fighting actually occurs
    const pathsByCountry = {};
    paths.forEach(p => {
      const iso3 = getCountryIsoCode(p);
      if (!pathsByCountry[iso3]) pathsByCountry[iso3] = [];
      pathsByCountry[iso3].push(p.pathAltitude);
    });
    const duplicateAltitudes = Object.entries(pathsByCountry).filter(([, alts]) =>
      new Set(alts).size < alts.length
    );
    if (duplicateAltitudes.length > 0) {
      console.warn('[Map] ⚠️ Z-fighting:', duplicateAltitudes.slice(0, 5).map(([iso3]) => iso3));
    }

    return paths;
  }, [countryPaths, showMeActivated, targetCountry, mode, exploreSelectedCountry, hintNeighborsM49]);

  // three-globe recreates all LineMaterial objects from scratch whenever pathsData changes
  // (because our spread objects have new references each render, so ThreeDigest treats them as new).
  // setTimeout(0) fires too early — before three-globe finishes creating materials.
  // Solution: patch on every animation frame so we catch new materials the moment they appear.
  // The check `depthWrite !== false` is a no-op in steady state, so frame cost is just a traversal.
  useEffect(() => {
    if (!globeEl.current) return;
    let frameId;
    const patchEveryFrame = () => {
      const scene = globeEl.current?.scene?.();
      if (scene) {
        scene.traverse(obj => {
          if (obj.__globeObjType === 'path') {
            obj.children.forEach(child => {
              if (child.material && child.material.depthWrite !== false) {
                child.material.depthWrite = false;
                child.material.needsUpdate = true;
              }
            });
          }
        });
      }
      frameId = requestAnimationFrame(patchEveryFrame);
    };
    frameId = requestAnimationFrame(patchEveryFrame);
    return () => cancelAnimationFrame(frameId);
  }, []); // run once — the loop itself handles all future path updates

  /**
   * JSX RENDERING
   *
   * JSX is a syntax extension that lets us write HTML-like code in JavaScript.
   * React transforms JSX into JavaScript function calls.
   *
   * Example: <div>Hello</div> becomes React.createElement('div', null, 'Hello')
   */
  return (
    <div className="world-map-wrapper">
      <div className="globe-position-container">
        {/*
          Globe Component

          This renders the interactive 3D globe. Props configure its appearance and behavior.
        */}
        <Globe
          ref={globeEl}  // Attach our ref so we can control the globe programmatically
          // Visual assets
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"  // Earth texture
          backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"      // Space background
          // atmosphereColor: The glow color around the Earth (uses our theme's hover color)
          atmosphereColor={COLORS.hover}
          // atmosphereAltitude: How far the glow extends from the surface (0.15 = 15% of Earth radius)
          atmosphereAltitude={0.15}
          // Polygon layer: Base country shapes
          // These are invisible (transparent) because we use the path layer instead for coloring
          polygonsData={countries.features}  // Array of country geometries
          polygonCapColor={() => 'rgba(0,0,0,0)'}    // Top face: transparent
          polygonSideColor={() => 'rgba(0,0,0,0)'}   // Side faces: transparent
          polygonStrokeColor={() => 'rgba(0,0,0,0)'} // Outline: transparent
          polygonAltitude={0.001}  // Slight height (prevents z-fighting rendering issues)
          polygonLabel={() => ''}  // Disable hover tooltip
          onPolygonHover={setHoverD}       // Update hover state when hovering
          onPolygonClick={handlePolygonClick}  // Handle clicks on countries
          // Path layer: Colored country borders/fills
          // We use paths instead of polygons so we can layer multiple versions for hints
          pathsData={layeredPaths}  // Our computed array of country paths with hint overlays
          // Path coordinate accessors - tell Globe how to read our coordinate format
          pathPoints={d => Array.isArray(d.coords[0]) ? d.coords[0] : d.coords}
          pathPointLat={p => p[1]}  // Latitude is 2nd element in coordinate pair
          pathPointLng={p => p[0]}  // Longitude is 1st element in coordinate pair
          // pathAltitude: Z-position (depth) of each path layer
          // Higher altitude = rendered on top, prevents Z-fighting during zoom
          // This ensures consistent rendering order regardless of camera angle
          pathAltitude={d => d.pathAltitude || 0}
          // pathColor: Function that returns the color for each path
          // Arrow function with implicit return: d => expression
          pathColor={d => {
            return getPathColor(
              d,                  // The path data
              d.isHintOverlay,    // Is this a hint overlay?
              d.isShowMeOverlay,  // Is this the "Show Me" overlay?
              COLORS,             // Our color scheme
              hoverD,             // Currently hovered country
              hintsEnabled,       // Are hints enabled?
              mode                // Current mode (quiz/explore)
            );
          }}
          // pathStrokeColor: Color of the path outline/border
          pathStrokeColor={d => getPathStrokeColor(d, d.isHintOverlay, d.isShowMeOverlay, hintsEnabled, mode)}
          // pathStroke: Border thickness (thicker for hints and "Show Me", 0 for non-hints when hints enabled)
          pathStroke={d => {
            if (d.isShowMeOverlay || d.isHintOverlay) return 4;
            if (mode === 'quiz' && hintsEnabled) return 0;
            return 2;
          }}
          // Path animation settings (all disabled for performance)
          pathDashLength={1}           // No dashed lines
          pathDashGap={0}              // No gaps in dashes
          pathDashAnimateTime={0}      // No dash animation
          pathTransitionDuration={0}   // Instant updates (no fade transitions)
          pathLabel={() => ''}         // Disable hover tooltip
          // Path interaction handlers
          onPathHover={setHoverD}
          onPathClick={handlePolygonClick}
          enablePointerInteraction  // Allow mouse/touch interaction
          // Labels: Disabled (no country name labels on globe)
          labelsData={[]}  // Empty array - no labels
          // Globe dimensions (responsive to window size)
          width={globeDimensions.width}
          height={globeDimensions.height}
        />

        {/* Target Country Overlay - Shows "Find: [Country]" for 5 seconds */}
        {showTargetOverlay && mode === 'quiz' && targetCountryName && (
          <Box
            sx={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 9999,
              backgroundColor: 'rgb(0, 0, 0)',
              color: '#ffffff',
              padding: '24px 48px',
              borderRadius: '12px',
              fontSize: '32px',
              fontWeight: 700,
              opacity: .5,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              animation: 'fadeIn 0.3s ease-in-out',
              pointerEvents: 'none', // Allow clicking through the overlay
              minHeight: '80px', // Fixed minimum height to prevent jumping
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            Find: {targetCountryName}
          </Box>
        )}

        {/*
          Control Overlay (Top)

          CSS custom properties (--property-name) let us pass dynamic values to CSS
          These are defined in the style attribute and used in the CSS file
        */}
        <div className="control-overlay" style={{
          '--card-bg': COLORS.cardBg,
          '--text-color': COLORS.text,
          '--glow-color': COLORS.glow,
          '--border-color': COLORS.border
        }}>
          {/* Title area - shows dropdown in both quiz and explore modes */}
          <div className="overlay-title">
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Select
                value={
                  mode === 'quiz'
                    ? (targetCountry && allCountries.some(c => c.iso3 === targetCountry) ? targetCountry : '')
                    : exploreSelectedCountry
                }
                onChange={handleCountryDropdownChange}
                size="small"
                displayEmpty
                sx={{
                  minWidth: '180px',
                  backgroundColor: 'var(--card-bg)',
                  '& .MuiSelect-select': {
                    fontSize: { xs: '16px', sm: '17px' },
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'var(--border-color)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'var(--glow-color)',
                  },
                }}
              >
                {/* Placeholder option */}
                <MenuItem value="">
                  {mode === 'quiz' ? 'Select country...' : 'Explore a country...'}
                </MenuItem>

                {/* Map over sorted countries to create menu items */}
                {allCountries
                  .sort((a, b) =>
                    getDisplayName(a).localeCompare(getDisplayName(b))
                  )
                  .map(c => (
                    <MenuItem key={c.iso3} value={c.iso3}>
                      {getDisplayName(c)}
                    </MenuItem>
                  ))}
              </Select>
              {mode === 'quiz' && selectedQuizRegion && (
                <Typography variant="caption" sx={{ color: 'var(--text-color)', fontStyle: 'italic' }}>
                  ({selectedQuizRegion})
                </Typography>
              )}

              {/* Explore mode instruction text */}
              {mode === 'explore' && (
                <Typography variant="body2" sx={{ color: 'var(--text-color)', fontStyle: 'italic', ml: 1 }}>
                  Click or select a country to see public domain images
                </Typography>
              )}
            </Box>
          </div>

          <div className="overlay-controls">
            {/* Quiz Mode Toggle and Action Buttons */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              flexWrap: 'wrap',
              width: '100%',
            }}>
              {/* Quiz Mode Toggle Switch */}
              <FormControlLabel
                control={
                  <Switch
                    checked={mode === 'quiz'}
                    onChange={onModeToggle}
                    size="small"
                  />
                }
                label="Quiz"
                sx={{ '& .MuiFormControlLabel-label': { fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.1em' } }}
              />

              {/* Region selector (quiz mode only) */}
              {mode === 'quiz' && (
                <Select
                  value={selectedQuizRegion ?? ''}
                  onChange={(e) => setSelectedQuizRegion(e.target.value || null)}
                  size="small"
                  displayEmpty
                  sx={{
                    minWidth: '110px',
                    fontSize: '0.8rem',
                    backgroundColor: 'var(--card-bg)',
                    '& .MuiSelect-select': { padding: '2px 8px', fontSize: '0.8rem' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border-color)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--glow-color)' },
                  }}
                >
                  <MenuItem value="">All regions</MenuItem>
                  {QUIZ_REGIONS.map(r => (
                    <MenuItem key={r} value={r}>{r}</MenuItem>
                  ))}
                </Select>
              )}

              {/* Next, Show, Found tracker + Reset — always one line */}
              {mode === 'quiz' && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'nowrap', flexShrink: 0 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={onStartOver}
                    title="Next Country"
                    sx={{ minWidth: 'auto', padding: '2px 8px', textTransform: 'none' }}
                  >
                    Next
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleShowMe}
                    title="Show Me"
                    disabled={showMeActivated}
                    sx={{ opacity: showMeActivated ? 0.5 : 1, minWidth: 'auto', padding: '2px 8px', textTransform: 'none' }}
                  >
                    {showMeActivated ? 'Shown' : 'Show'}
                  </Button>
                  <Box ref={foundTrackerRef} sx={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <button
                      className="control-button found-tracker-btn"
                      onClick={() => setShowFoundList(prev => !prev)}
                      title="Countries correctly identified"
                    >
                      {correctCountries.length} found
                    </button>
                    <IconButton
                      size="small"
                      onClick={() => { clearCorrectCountries(); setShowFoundList(false); }}
                      title="Reset found countries"
                      sx={{ padding: '2px', color: 'var(--ink-3)', '&:hover': { color: 'var(--accent)', backgroundColor: 'transparent' } }}
                    >
                      <RestartAltIcon sx={{ fontSize: '16px' }} />
                    </IconButton>
                    {showFoundList && (
                      <div className="found-countries-panel">
                        <p className="found-countries-heading">
                          {correctCountries.length === 0 ? 'No countries found yet' : `${correctCountries.length} countries found`}
                        </p>
                        {correctCountries.length > 0 && (
                          <ul className="found-countries-list">
                            {correctCountries
                              .map(iso => countryLookup[iso] || iso)
                              .sort((a, b) => a.localeCompare(b))
                              .map((name) => (
                                <li key={name}>{name}</li>
                              ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * COMPONENT EXPORT
 *
 * memo: A React optimization that prevents re-rendering when props haven't changed
 * This improves performance for expensive components like this 3D globe
 */
export default memo(WorldMap);
