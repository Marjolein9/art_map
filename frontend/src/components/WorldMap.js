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
import SettingsIcon from '@mui/icons-material/Settings';
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
// Helper function to format country/territory names as "Territory (Parent Country)"

/**
 * WorldMap Component Definition
 *
 * PROPS (Component Inputs):
 * Props are like parameters passed to a function - they let parent components configure this component.
 * We use "destructuring" syntax ({ prop1, prop2 }) to extract individual props from the props object.
 */
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
  setShowWelcome,         // Function to show/hide the welcome overlay
  hintsEnabled = false,   // Whether hints are enabled (show neighboring countries)
  selectedQuizRegion = null, // Selected region for filtering quiz questions
}) => {
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

        // Filter to only include countries/territories that are marked for quiz inclusion
        // This includes all sovereign countries AND the 7 territories with clickable geometries
        // (Greenland, Puerto Rico, French Polynesia, New Caledonia, Guam, Curaçao, Aruba)
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
        console.error('Error loading country data:', err);
      }
    };

    // Call the async function we just defined
    loadData();
  }, [backendReady]); // Re-run this effect when backendReady changes

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
        if (hintCountryRef.current === targetCountry) return;

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

          console.log(`🎯 Highlighting entire ${targetSubregion} subregion (${subregionM49s.length} countries)`);

          // Template literal (`string ${variable}`) embeds variables in strings
          console.log(`✅ HINTS FETCHED for ${targetCountry}: ${highlightM49s.length} countries (including target)`, highlightM49s);
          setHintNeighborsM49(highlightM49s);

          // Remember which country we fetched hints for
          hintCountryRef.current = targetCountry;

        } catch (err) {
          console.error('❌ Error fetching hints:', err);
        }
      } else {
        // Clear hints when not in quiz mode or hints disabled
        console.log(`🚫 HINTS DISABLED or not in quiz mode`);
        setHintNeighborsM49([]);
        hintCountryRef.current = null;
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
      setClickedCountry(null);
      setShowMeActivated(false);
    }
    // Update our record of the previous target
    prevTargetCountryRef.current = targetCountry;
  }, [targetCountry]);

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
  const activeHints = showMeActivated ? [] : hintNeighborsM49;

  // Clear explore selection when switching modes
  useEffect(() => {
    if (mode === 'quiz') {
      setExploreSelectedCountry('');
    }
  }, [mode]);

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
      // In explore mode, zoom to the country's subregion
      setExploreSelectedCountry(iso3);

      // Get the subregion view
      const subregion = selectedCountry.subregion;
      const targetView = REGION_VIEWS[subregion] || REGION_VIEWS['default'];

      // Zoom to the subregion
      if (globeEl.current) {
        globeEl.current.pointOfView({
          lat: targetView.lat,
          lng: targetView.lng,
          altitude: targetView.altitude
        }, 1000);
      }
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

    // Timestamp ensures paths update when needed (forces re-render in Globe component)
    const timestamp = Date.now();

    // Layer 1: Base country paths (all countries, no special styling)
    countryPaths.forEach(path => paths.push({
      ...path,  // Spread all existing path properties
      isHintOverlay: false,
      isShowMeOverlay: false,
      _updateKey: timestamp  // Internal key for tracking updates
    }));

    // Layer 2: Hint overlays (colored countries that are hints)
    countryPaths.forEach(path => {
      // Get M49 code for this path
      const m49 = path.id || path.properties?.id;
      const paddedM49 = m49 ? String(m49).padStart(3, '0') : null;

      // If this country should be highlighted as a hint
      if (paddedM49 && activeHints.includes(paddedM49)) {
        const hintPath = {
          ...path,
          isHintOverlay: true,   // Flag this as a hint
          isShowMeOverlay: false,
          _updateKey: timestamp
        };
        paths.push(hintPath);
      }
    });

    // Layer 3: "Show Me" overlay (highlights the correct answer)
    if (showMeActivated && targetCountry) {
      countryPaths.forEach(path => {
        const iso3 = getCountryIsoCode(path);
        if (iso3 === targetCountry) paths.push({
          ...path,
          isHintOverlay: false,
          isShowMeOverlay: true,  // Flag this as the revealed answer
          _updateKey: timestamp
        });
      });
    }

    return paths;
  }, [countryPaths, activeHints, showMeActivated, targetCountry]);
  // Only recalculate when these dependencies change

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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
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
                      {getDisplayName(c)} {c.subregion && `(${c.subregion})`}
                    </MenuItem>
                  ))}
              </Select>
              {mode === 'quiz' && selectedQuizRegion && (
                <Typography variant="caption" sx={{ color: 'var(--text-color)', fontStyle: 'italic' }}>
                  ({selectedQuizRegion})
                </Typography>
              )}

              {/* Settings Button - opens settings/help overlay */}
              <IconButton
                onClick={() => setShowWelcome(true)}
                title="Settings & Help"
                sx={{
                  padding: '4px',
                  color: 'var(--text-color)',
                  '&:hover': {
                    backgroundColor: 'transparent',
                  }
                }}
              >
                <SettingsIcon fontSize="small" />
              </IconButton>
            </Box>
          </div>

          <div className="overlay-controls">
            {/* Quiz Mode Toggle and Action Buttons */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 1,
              flexWrap: 'wrap'
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
              />

              {/* Next and Show buttons (only in quiz mode) */}
              {mode === 'quiz' && (
                <>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={onStartOver}
                    title="Next Country"
                    sx={{
                      minWidth: 'auto',
                      padding: '2px 8px',
                      fontSize: '1rem'
                    }}
                  >
                    Next
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleShowMe}
                    title="Show Me"
                    disabled={showMeActivated}
                    sx={{
                      opacity: showMeActivated ? 0.5 : 1,
                      minWidth: 'auto',
                      padding: '2px 8px',
                      fontSize: '1rem'
                    }}
                  >
                    {showMeActivated ? 'Shown' : 'Show'}
                  </Button>
                </>
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
