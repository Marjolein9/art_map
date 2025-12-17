import React, { memo, useState, useEffect, useRef, useMemo } from 'react';
import Globe from 'react-globe.gl';
import { getCountryIsoCode, initializeCountryMapping } from '../utils/countryCodeMapping';
import { REGION_VIEWS } from '../config/regions';
import { loadTopoJSON } from '../utils/topoJsonLoader';
import { fetchCountries, fetchNeighbors, fetchSimilarIslands } from '../services/api';

const WorldMap = ({
  onCountryClick,
  targetCountry = null,
  targetCountryName = null,
  region = null, // Can be continent or subregion
  gameStatus = 'playing',
  colors,
  onNewGame,
  onStartOver,
  mode = 'quiz',
  onModeToggle,
  loading = false,
  onManualCountrySelect = null,
  countryLookup = {}
}) => {
  const COLORS = colors;
  const globeEl = useRef();
  const [countries, setCountries] = useState({ features: [] });
  const [countryPaths, setCountryPaths] = useState([]);
  const [hoverD, setHoverD] = useState(null);
  const previousRegionRef = useRef(null);
  const [clickedCountry, setClickedCountry] = useState(null);
  const [hintNeighborsM49, setHintNeighborsM49] = useState([]);
  const [globeDimensions, setGlobeDimensions] = useState({
    width: window.innerWidth - 60,
    height: window.innerHeight - 120
  });
  const [hintsEnabled, setHintsEnabled] = useState(true);
  const [allCountries, setAllCountries] = useState([]);
  const [showMeActivated, setShowMeActivated] = useState(false);

  // Handle window resize for responsive globe
  useEffect(() => {
    const updateGlobeDimensions = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      let globeWidth, globeHeight;

      if (width <= 768) {
        // Mobile - account for controls and padding
        globeWidth = width - 40;
        globeHeight = height - 100;
      } else if (width <= 1024) {
        // Tablet
        globeWidth = width - 60;
        globeHeight = height - 120;
      } else {
        // Desktop - full screen with minimal margins
        globeWidth = width - 60;
        globeHeight = height - 120;
      }

      setGlobeDimensions({ width: globeWidth, height: globeHeight });
    };

    // Set initial dimensions
    updateGlobeDimensions();

    // Add resize listener
    window.addEventListener('resize', updateGlobeDimensions);

    // Cleanup
    return () => window.removeEventListener('resize', updateGlobeDimensions);
  }, []);

  // Load country data using TopoJSON
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch countries from database first
        const dbCountries = await fetchCountries();

        // Initialize M49→ISO3 mapping from database
        initializeCountryMapping(dbCountries);

        // Store all countries for dropdown (excluding territories)
        const excluded = ['BES', 'BVT', 'CXR', 'CCK', 'GUF', 'GIB', 'GLP', 'MTQ', 'MYT', 'REU', 'SJM', 'TKL', 'TUV', 'UMI'];
        const validCountries = dbCountries.filter(c => c.is_country && !excluded.includes(c.iso3));
        setAllCountries(validCountries);

        // Load TopoJSON with database countries for validation
        const data = await loadTopoJSON(dbCountries);

        setCountries(data);

        // Convert polygons to paths (border lines only) for consistent rendering
        const paths = [];
        data.features.forEach(feature => {
          if (feature.geometry.type === 'Polygon') {
            // Single polygon - add as one path
            paths.push({
              coords: feature.geometry.coordinates,
              properties: feature.properties,
              geometry: feature.geometry,
              id: feature.id // Preserve M49 code
            });
          } else if (feature.geometry.type === 'MultiPolygon') {
            // Multi-polygon - create a separate path for each island
            feature.geometry.coordinates.forEach((islandCoords) => {
              paths.push({
                coords: islandCoords,
                properties: feature.properties,
                geometry: { ...feature.geometry, coordinates: islandCoords, type: 'Polygon' },
                id: feature.id // Preserve M49 code
              });
            });
          }
        });

        setCountryPaths(paths);
      } catch (err) {
        console.error('Error loading country data:', err);
      }
    };

    loadData();
  }, []);

  // Handle incorrect answer - show border hints
  // Keep hints visible until a new target country is selected
  const hintCountryRef = useRef(null);  // Track which country hints are for

  useEffect(() => {

    const showHints = async () => {
      if (targetCountry && mode === 'quiz' && hintsEnabled) {
        // Only generate new hints if this is a different country than last time
        if (hintCountryRef.current === targetCountry) {
          return; // Keep existing hints, don't regenerate
        }

        try {
          console.log('🔍 Generating hints for:', targetCountry);

          // Find target country's M49 code from the countries data
          const targetCountryData = countries.features.find(f => getCountryIsoCode(f) === targetCountry);
          const targetM49 = targetCountryData?.id;
          console.log('  Target M49:', targetM49, '(found in TopoJSON:', !!targetCountryData, ')');


          const highlightM49s = [];

          // Always add the target country itself (with proper zero-padded string formatting)
          if (targetM49) {
            const paddedTargetM49 = String(targetM49).padStart(3, '0');
            highlightM49s.push(paddedTargetM49);
            console.log('  Added target to highlights:', paddedTargetM49);
          }

          // Check if this is an island country (no land neighbors)
          const islandData = await fetchSimilarIslands(targetCountry);
          console.log('  Island data:', islandData);

          if (islandData.is_island) {
            // For islands, show 2 random countries from the same subregion
            // Priority: other islands > any countries in the subregion

            if (islandData.islands && islandData.islands.length > 0) {
              const islandM49s = islandData.islands.map(island => {
                const paddedM49 = String(island.m49).padStart(3, '0');
                return paddedM49;
              }).filter(Boolean);

              highlightM49s.push(...islandM49s);
            } else {
            }
          } else {
            // For non-islands, use neighbors as before
            const neighbors = await fetchNeighbors(targetCountry);

            if (neighbors && neighbors.length > 0) {
              // Randomly select up to 2 neighbors to highlight
              const shuffled = [...neighbors].sort(() => Math.random() - 0.5);
              const selected = shuffled.slice(0, Math.min(2, neighbors.length));

              // Add neighbor M49 codes (with zero-padding to match TopoJSON)
              const neighborM49s = selected.map(n => {
                const paddedM49 = String(n.m49).padStart(3, '0');
                return paddedM49;
              }).filter(Boolean);

              highlightM49s.push(...neighborM49s);
            }
          }

          console.log('  Final highlights M49 codes:', highlightM49s);
          setHintNeighborsM49(highlightM49s);
          hintCountryRef.current = targetCountry; // Remember which country these hints are for
        } catch (err) {
          console.error('❌ Error fetching hints:', err);
        }
      } else {
        // Clear hints if not in quiz mode or hints disabled
        console.log('  Clearing hints (mode:', mode, 'hintsEnabled:', hintsEnabled, ')');
        setHintNeighborsM49([]);
        hintCountryRef.current = null;
      }
    };

    showHints();
  }, [targetCountry, targetCountryName, mode, countries, hintsEnabled]);

  // Clear hints and visual feedback when a NEW target country appears
  const prevTargetCountryRef = useRef(null);
  useEffect(() => {
    if (prevTargetCountryRef.current && prevTargetCountryRef.current !== targetCountry) {
      setHintNeighborsM49([]);
      hintCountryRef.current = null; // Reset hint tracking
      setClickedCountry(null); // Clear visual feedback
      setShowMeActivated(false); // Reset Show Me
    }
    prevTargetCountryRef.current = targetCountry;
  }, [targetCountry]);

  // Don't show hints when Show Me is activated
  const activeHints = showMeActivated ? [] : hintNeighborsM49;

  // Rotate to region when it changes
  useEffect(() => {
    if (!globeEl.current) return;

    if (region && region !== previousRegionRef.current) {
      previousRegionRef.current = region;
      const targetView = REGION_VIEWS[region] || REGION_VIEWS['default'];

      // Smoothly transition to the region
      globeEl.current.pointOfView(
        {
          lat: targetView.lat,
          lng: targetView.lng,
          altitude: targetView.altitude
        },
        1000 // 1 second transition
      );
    }
  }, [region]);

  // Show Middle East region during loading
  useEffect(() => {
    if (!globeEl.current) return;

    if (loading) {
      // Always zoom to Middle East region during loading
      globeEl.current.pointOfView(
        {
          lat: 30,
          lng: 45,
          altitude: 1 // Quiz zoom level
        },
        1000 // 1 second transition
      );
    }
  }, [loading]);
  // Handle country click
  const handlePolygonClick = (polygon) => {
    if (!polygon || !polygon.properties) return;

    const iso3 = getCountryIsoCode(polygon);

    if (!iso3) {
      console.warn('⚠️ Could not determine ISO code for clicked country');
      // Still allow the click to proceed - let the artwork component handle missing data
      onCountryClick(null);
      return;
    }

    setClickedCountry(iso3);
    onCountryClick(iso3);
  };

  // Manual rotation controls
  const rotateLeft = () => {
    if (!globeEl.current) return;
    const currentView = globeEl.current.pointOfView();
    globeEl.current.pointOfView({
      lng: currentView.lng - 30,
      lat: currentView.lat,
      altitude: currentView.altitude
    }, 500);
  };

  const rotateRight = () => {
    if (!globeEl.current) return;
    const currentView = globeEl.current.pointOfView();
    globeEl.current.pointOfView({
      lng: currentView.lng + 30,
      lat: currentView.lat,
      altitude: currentView.altitude
    }, 500);
  };

  // Create layered paths: all countries in black, then hint countries in green on top
  // This allows hint countries to show both black borders (100% opacity) and green thick borders
  const layeredPaths = useMemo(() => {
    const paths = [];

    // First layer: All countries with normal styling (100% opacity black borders)
    countryPaths.forEach(path => {
      paths.push({ ...path, isHintOverlay: false, isShowMeOverlay: false });
    });

    // Second layer: Only hint countries with green borders (rendered on top)
    // Don't show hints when Show Me is activated
    countryPaths.forEach(path => {
      const m49 = path.id || path.properties?.id;
      // Ensure M49 is padded to 3 digits for consistent comparison
      const paddedM49 = m49 ? String(m49).padStart(3, '0') : null;
      const isHint = paddedM49 && activeHints.includes(paddedM49);

      if (isHint) {
        paths.push({ ...path, isHintOverlay: true, isShowMeOverlay: false });
      }
    });

    // Third layer: Target country green overlay when Show Me is activated (rendered on top of everything)
    if (showMeActivated && targetCountry) {
      countryPaths.forEach(path => {
        const iso3 = getCountryIsoCode(path);
        if (iso3 === targetCountry) {
          paths.push({ ...path, isHintOverlay: false, isShowMeOverlay: true });
        }
      });
    }

    return paths;
  }, [countryPaths, activeHints, showMeActivated, targetCountry]);

  const zoomIn = () => {
    if (!globeEl.current) return;
    const currentView = globeEl.current.pointOfView();
    globeEl.current.pointOfView({
      lng: currentView.lng,
      lat: currentView.lat,
      altitude: Math.max(currentView.altitude - 0.3, 0.5)
    }, 500);
  };

  const zoomOut = () => {
    if (!globeEl.current) return;
    const currentView = globeEl.current.pointOfView();
    globeEl.current.pointOfView({
      lng: currentView.lng,
      lat: currentView.lat,
      altitude: Math.min(currentView.altitude + 0.3, 3)
    }, 500);
  };

  // Handle manual country selection from dropdown (for testing)
  const handleCountryDropdownChange = (e) => {
    const iso3 = e.target.value;
    if (!iso3 || !onManualCountrySelect) return;

    const selectedCountry = allCountries.find(c => c.iso3 === iso3);
    if (selectedCountry) {
      onManualCountrySelect(selectedCountry);
    }
  };

  // Calculate centroid of a polygon
  const calculateCentroid = (coordinates) => {
    let latSum = 0;
    let lngSum = 0;
    let count = 0;

    const processCoords = (coords) => {
      if (Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
        // MultiPolygon or nested structure
        coords.forEach(c => processCoords(c));
      } else if (Array.isArray(coords[0]) && typeof coords[0][0] === 'number') {
        // Array of [lng, lat] points
        coords.forEach(([lng, lat]) => {
          lngSum += lng;
          latSum += lat;
          count++;
        });
      }
    };

    processCoords(coordinates);
    return count > 0 ? { lat: latSum / count, lng: lngSum / count } : null;
  };

  // Handle "Show Me" button click
  const handleShowMe = () => {
    if (!targetCountry || !globeEl.current) return;

    // Find the target country in the features
    const targetFeature = countries.features.find(f => getCountryIsoCode(f) === targetCountry);

    if (targetFeature) {
      // Calculate centroid
      const centroid = calculateCentroid(targetFeature.geometry.coordinates);

      if (centroid) {
        // Center the globe on the country
        globeEl.current.pointOfView(
          {
            lat: centroid.lat,
            lng: centroid.lng,
            altitude: .5
          },
          1000 // 1 second transition
        );
      }
    }

    // Activate coloring
    setShowMeActivated(true);
  };

  return (
    <div className="world-map-wrapper">
      <div className="globe-position-container">
        <Globe
          ref={globeEl}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
          atmosphereColor={COLORS.hover}
          atmosphereAltitude={0.15}

          // Use both polygons (for clicking) and paths (for consistent borders)
          polygonsData={countries.features}
          polygonCapColor={() => 'rgba(0, 0, 0, 0)'}
          polygonSideColor={() => 'rgba(0, 0, 0, 0)'}
          polygonStrokeColor={() => 'rgba(0, 0, 0, 0)'} // Hide polygon borders
          polygonAltitude={0.001}

          onPolygonHover={setHoverD}
          onPolygonClick={handlePolygonClick}

          // Use pathsData with layered rendering: black borders for all, then green hints on top
          pathsData={layeredPaths}
          pathPoints={d => {
            const coords = d.coords;
            // Convert polygon coordinates to path points
            if (Array.isArray(coords) && Array.isArray(coords[0])) {
              return coords[0]; // Get outer ring of polygon
            }
            return coords;
          }}
          pathPointLat={p => p[1]}
          pathPointLng={p => p[0]}
          pathColor={d => {
            // Check if this is a show me overlay layer (green borders on top)
            if (d.isShowMeOverlay) {
              return COLORS.correct; // Green color for show me overlay
            }

            // Check if this is a hint overlay layer (green borders on top)
            if (d.isHintOverlay) {
              return COLORS.correct; // Green color for hint overlays
            }

            // Base layer: normal country colors
            const iso3 = getCountryIsoCode(d);
            if (!iso3) return '#000';

            // Target country gets correct/incorrect color
            if (clickedCountry === iso3) {
              if (gameStatus === 'correct') return COLORS.correct;
              if (gameStatus === 'incorrect') return COLORS.incorrect;
            }

            if (d === hoverD) return COLORS.selected;

            // All countries get black borders in base layer with 100% opacity
            return '#000';
          }}
          pathStroke={d => {
            // Show Me overlay layer gets extra thick green borders
            if (d.isShowMeOverlay) {
              return 4.0;
            }

            // Hint overlay layer gets extra thick green borders
            if (d.isHintOverlay) {
              return 4.0;
            }

            // Base layer: normal thickness black borders (100% opacity)
            return 2.0;
          }}
          pathDashLength={1}
          pathDashGap={0}
          pathDashAnimateTime={0}
          pathTransitionDuration={0}
          onPathHover={setHoverD}
          onPathClick={handlePolygonClick}

          enablePointerInteraction={true}
          width={globeDimensions.width}
          height={globeDimensions.height}
        />

        {/* Control overlay on top of globe */}
        <div
          className="control-overlay"
          style={{
            '--card-bg': COLORS.cardBg,
            '--text-color': COLORS.text,
            '--glow-color': COLORS.glow,
            '--border-color': COLORS.border
          }}
        >
          {/* Title text */}
          <div className="overlay-title">
            {mode === 'quiz' && targetCountryName ? `Find: ${targetCountryName}` : 'Click to Explore Artwork, Photographs and More'}
          </div>

          {/* Control buttons and toggles */}
          <div className="overlay-controls">
            <button
              onClick={rotateLeft}
              className="globe-control-btn-small"
              title="Rotate Left"
            >
              ←
            </button>
            <button
              onClick={rotateRight}
              className="globe-control-btn-small"
              title="Rotate Right"
            >
              →
            </button>
            <button
              onClick={zoomIn}
              className="globe-control-btn-small"
              title="Zoom In"
            >
              +
            </button>
            <button
              onClick={zoomOut}
              className="globe-control-btn-small"
              title="Zoom Out"
            >
              −
            </button>

            <span className="controls-divider" />

            {/* Quiz/Explore Toggle */}
            <div className="toggle-container-small">
              <span className="toggle-label-small">Quiz</span>
              <label className="toggle-switch-small">
                <input
                  type="checkbox"
                  checked={mode === 'quiz'}
                  onChange={onModeToggle}
                />
                <span className="toggle-slider-small"></span>
              </label>
            </div>

            {mode === 'quiz' && (
              <>
                <button
                  onClick={onStartOver}
                  className="globe-control-btn-small"
                  title="Next Country"
                >
                  Next
                </button>

                <button
                  onClick={handleShowMe}
                  className="globe-control-btn-small"
                  title="Show Me"
                  disabled={showMeActivated}
                  style={{
                    opacity: showMeActivated ? 0.5 : 1,
                    cursor: showMeActivated ? 'not-allowed' : 'pointer'
                  }}
                >
                  {showMeActivated ? 'Shown!' : 'Show Me'}
                </button>

                {/* Hint Toggle */}
                <div className="toggle-container-small">
                  <span className="toggle-label-small">Hint</span>
                  <label className="toggle-switch-small">
                    <input
                      type="checkbox"
                      checked={hintsEnabled}
                      onChange={() => setHintsEnabled(prev => !prev)}
                    />
                    <span className="toggle-slider-small"></span>
                  </label>
                </div>

                <span className="controls-divider" />

                {/* Test Country Dropdown */}
                <select
                  onChange={handleCountryDropdownChange}
                  value={targetCountry || ''}
                  className="country-dropdown"
                  title="Select country to test"
                  style={{
                    padding: '4px 8px',
                    fontSize: '13px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--card-bg)',
                    color: 'var(--text-color)',
                    cursor: 'pointer',
                    maxWidth: '150px'
                  }}
                >
                  <option value="">Test country...</option>
                  {allCountries.sort((a, b) => (a.common_name || a.name).localeCompare(b.common_name || b.name)).map(country => (
                    <option key={country.iso3} value={country.iso3}>
                      {country.common_name || country.name}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(WorldMap);
