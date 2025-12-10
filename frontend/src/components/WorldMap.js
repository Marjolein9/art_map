import React, { memo, useState, useEffect, useRef } from 'react';
import Globe from 'react-globe.gl';
import { getCountryIsoCode, getCountryName, initializeCountryMapping } from '../utils/countryCodeMapping';
import { COLOR_SCHEMES } from '../styles/colorSchemes';
import { REGION_VIEWS } from '../config/regions';
import { loadTopoJSON } from '../utils/topoJsonLoader';
import { fetchCountries, fetchNeighbors, fetchSimilarIslands, fetchEmptyCountries } from '../services/api';

const WorldMap = ({
  onCountryClick,
  targetCountry = null,
  targetCountryName = null,
  region = null, // Can be continent or subregion
  gameStatus = 'playing',
  tooltipsEnabled = true,
  colors,
  onNewGame,
  onStartOver,
  onToggleTooltips,
  selectedColorScheme,
  onColorSchemeChange,
  mode = 'quiz',
  onModeToggle
}) => {
  const COLORS = colors;
  const globeEl = useRef();
  const [countries, setCountries] = useState({ features: [] });
  const [countryPaths, setCountryPaths] = useState([]);
  const [hoverD, setHoverD] = useState(null);
  const previousRegionRef = useRef(null);
  const [clickedCountry, setClickedCountry] = useState(null);
  const [hintNeighborsM49, setHintNeighborsM49] = useState([]);
  const [emptyCountries, setEmptyCountries] = useState(new Set());

  // Load country data using TopoJSON
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch countries from database first
        console.log('📊 Fetching countries from database...');
        const dbCountries = await fetchCountries();
        console.log(`✅ Fetched ${dbCountries.length} countries from database`);

        // Initialize M49→ISO3 mapping from database
        initializeCountryMapping(dbCountries);

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
        console.log('🌍 Loaded country data:', data.features.length, 'countries');
      } catch (err) {
        console.error('Error loading country data:', err);
      }
    };

    loadData();
  }, []);

  // Fetch list of countries with no images
  useEffect(() => {
    const loadEmptyCountries = async () => {
      try {
        const emptyList = await fetchEmptyCountries();
        setEmptyCountries(new Set(emptyList));
        console.log(`📭 Loaded ${emptyList.length} empty countries (no images)`);
      } catch (err) {
        console.error('Error fetching empty countries:', err);
      }
    };

    loadEmptyCountries();
  }, []);

  // Handle incorrect answer - show border hints
  // Keep hints visible until a new target country is selected
  const hintCountryRef = useRef(null);  // Track which country hints are for

  useEffect(() => {
    console.log('🔄 Hint effect running:', { gameStatus, targetCountry, mode });

    const showHints = async () => {
      if (gameStatus === 'incorrect' && targetCountry && mode === 'quiz') {
        // Only generate new hints if this is a different country than last time
        if (hintCountryRef.current === targetCountry) {
          console.log('♻️ Keeping same hints - same target country:', targetCountry);
          return; // Keep existing hints, don't regenerate
        }

        try {
          console.log(`🎯 Target country: ${targetCountryName} (${targetCountry})`);

          // Find target country's M49 code from the countries data
          const targetCountryData = countries.features.find(f => getCountryIsoCode(f) === targetCountry);
          const targetM49 = targetCountryData?.id;

          console.log(`🔢 Target country M49 code: ${targetM49} (${targetCountryName})`);

          const highlightM49s = [];

          // Always add the target country itself
          if (targetM49) {
            highlightM49s.push(targetM49);
            console.log(`✨ Highlighting target country: ${targetCountryName} (M49: ${targetM49})`);
          }

          // Check if this is an island country (no land neighbors)
          const islandData = await fetchSimilarIslands(targetCountry);

          if (islandData.is_island) {
            // For islands, show 2 other similar islands
            console.log(`🏝️ ${targetCountryName} is an island! Showing similar islands from ${islandData.target_subregion || islandData.target_continent}`);

            if (islandData.islands && islandData.islands.length > 0) {
              const islandM49s = islandData.islands.map(island => {
                const paddedM49 = String(island.m49).padStart(3, '0');
                console.log(`✨ Highlighting similar island: ${island.name} (M49: ${paddedM49})`);
                return paddedM49;
              }).filter(Boolean);

              highlightM49s.push(...islandM49s);
            } else {
              console.log('⚠️ No similar islands found for hint');
            }
          } else {
            // For non-islands, use neighbors as before
            const neighbors = await fetchNeighbors(targetCountry);
            console.log(`📍 Found ${neighbors.length} neighboring countries for ${targetCountryName}`);

            if (neighbors && neighbors.length > 0) {
              // Randomly select up to 2 neighbors to highlight
              const shuffled = [...neighbors].sort(() => Math.random() - 0.5);
              const selected = shuffled.slice(0, Math.min(2, neighbors.length));

              // Add neighbor M49 codes (with zero-padding to match TopoJSON)
              const neighborM49s = selected.map(n => {
                const paddedM49 = String(n.m49).padStart(3, '0');
                console.log(`✨ Highlighting neighbor: ${n.name} (M49: ${paddedM49})`);
                return paddedM49;
              }).filter(Boolean);

              highlightM49s.push(...neighborM49s);
            }
          }

          console.log(`🎨 Total countries to highlight: ${highlightM49s.length}`, highlightM49s);
          setHintNeighborsM49(highlightM49s);
          hintCountryRef.current = targetCountry; // Remember which country these hints are for
        } catch (err) {
          console.error('❌ Error fetching hints:', err);
        }
      } else if (mode !== 'quiz') {
        // Clear hints if not in quiz mode
        console.log('🧹 Clearing hints - not in quiz mode');
        setHintNeighborsM49([]);
        hintCountryRef.current = null;
      }
      // Note: Don't clear hints when gameStatus changes back to 'playing'
      // Hints persist until a new target country is selected
    };

    showHints();
  }, [gameStatus, targetCountry, targetCountryName, mode, countries]);

  // Clear hints and visual feedback when a NEW target country appears
  const prevTargetCountryRef = useRef(null);
  useEffect(() => {
    if (prevTargetCountryRef.current && prevTargetCountryRef.current !== targetCountry) {
      console.log('🧹 Clearing hints and feedback - new target country:', targetCountry);
      setHintNeighborsM49([]);
      hintCountryRef.current = null; // Reset hint tracking
      setClickedCountry(null); // Clear visual feedback
    }
    prevTargetCountryRef.current = targetCountry;
  }, [targetCountry]);

  // Rotate to region when it changes
  useEffect(() => {
    if (!globeEl.current) return;

    console.log('🌍 Region changed:', {
      newRegion: region,
      previousRegion: previousRegionRef.current,
      willRotate: region && region !== previousRegionRef.current
    });

    if (region && region !== previousRegionRef.current) {
      console.log('✅ Triggering rotation from', previousRegionRef.current, 'to', region);
      previousRegionRef.current = region;
      const targetView = REGION_VIEWS[region] || REGION_VIEWS['default'];
      console.log('🎯 Target view:', targetView);

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

  // Get country fill color based on game state
  const getCountryColor = () => {
    // Make countries completely transparent - only show outlines
    return 'rgba(0, 0, 0, 0)';
  };

  // Get border color based on hover and game status
  const getBorderColor = (country) => {
    const iso3 = getCountryIsoCode(country);
    if (!iso3) return COLORS.border;

    // If this country was just clicked and got a result
    if (clickedCountry === iso3) {
      if (gameStatus === 'correct') return COLORS.correct;
      if (gameStatus === 'incorrect') return COLORS.incorrect;
    }

    // Hint: Highlight borders of neighboring countries using M49 codes (highest priority)
    const m49 = country.id || country.properties?.id;
    if (m49 && hintNeighborsM49.includes(String(m49))) {
      return COLORS.correct; // Use bright color for hint borders
    }

    // If hovering over this country
    if (country === hoverD) {
      return COLORS.selected; // Highlight border on hover
    }

    // Empty countries (no images) - show with dimmer border
    if (emptyCountries.has(iso3)) {
      return 'rgba(150, 150, 150, 0.3)'; // Dimmer, more transparent border
    }

    // Default border color
    return COLORS.border;
  };

  // Handle country click
  const handlePolygonClick = (polygon) => {
    if (!polygon || !polygon.properties) return;

    const iso3 = getCountryIsoCode(polygon);
    const name = getCountryName(polygon.properties);

    if (!iso3) {
      console.warn('⚠️ Could not determine ISO code for clicked country:', polygon.properties);
      console.log('ℹ️ Country name:', name, '- This country may not have artwork data available');
      // Still allow the click to proceed - let the artwork component handle missing data
      onCountryClick(null);
      return;
    }

    console.log('🖱️ Clicked country:', {
      name,
      iso3,
      rawISO_A3: polygon.properties.ISO_A3,
      properties: polygon.properties
    });

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

          polygonLabel={tooltipsEnabled ? (feature) => {
            const name = getCountryName(feature.properties);
            const iso = getCountryIsoCode(feature);
            return `
              <div style="background: ${COLORS.tooltipBg}; color: ${COLORS.tooltipText}; padding: 8px 12px; border-radius: 4px; font-family: system-ui; font-weight: bold; box-shadow: 0 0 10px ${COLORS.glow}; border: 2px solid ${COLORS.border};">
                ${name}${iso ? ` (${iso})` : ''}
              </div>
            `;
          } : undefined}
          onPolygonHover={setHoverD}
          onPolygonClick={handlePolygonClick}

          // Use pathsData for consistent border rendering
          pathsData={countryPaths}
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
            const iso3 = getCountryIsoCode(d);
            if (!iso3) return COLORS.border;

            // Target country gets correct/incorrect color
            if (clickedCountry === iso3) {
              if (gameStatus === 'correct') return COLORS.correct;
              if (gameStatus === 'incorrect') return COLORS.incorrect;
            }

            // Hint: Highlight borders of neighboring countries using M49 codes (highest priority)
            const m49 = d.id || d.properties?.id;
            if (m49 && hintNeighborsM49.includes(String(m49))) {
              return COLORS.correct; // Use bright color for hint borders
            }

            if (d === hoverD) return COLORS.selected;
            return COLORS.border;
          }}
          pathStroke={d => {
            // Make hint neighbor borders much thicker and more visible using M49 codes
            const m49 = d.id || d.properties?.id;
            if (m49 && hintNeighborsM49.includes(String(m49))) {
              return 4.0; // Extra thick for hints
            }
            return 0.8; // Normal thickness
          }}
          pathDashLength={1}
          pathDashGap={0}
          pathDashAnimateTime={0}
          onPathHover={setHoverD}
          onPathClick={handlePolygonClick}

          enablePointerInteraction={true}
          width={900}
          height={600}
        />
      </div>

      {/* All control buttons - below globe, small, all in one line */}
      <div className="globe-controls">
        <button
          onClick={rotateLeft}
          className="globe-control-btn"
          style={{
            '--button-bg': COLORS.buttonBg,
            '--border-color': COLORS.border,
            '--glow-color': COLORS.glow
          }}
          title="Rotate Left"
        >
          ←
        </button>
        <button
          onClick={rotateRight}
          className="globe-control-btn"
          style={{
            '--button-bg': COLORS.buttonBg,
            '--border-color': COLORS.border,
            '--glow-color': COLORS.glow
          }}
          title="Rotate Right"
        >
          →
        </button>
        <button
          onClick={zoomIn}
          className="globe-control-btn"
          style={{
            '--button-bg': COLORS.buttonBg,
            '--border-color': COLORS.border,
            '--glow-color': COLORS.glow
          }}
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={zoomOut}
          className="globe-control-btn"
          style={{
            '--button-bg': COLORS.buttonBg,
            '--border-color': COLORS.border,
            '--glow-color': COLORS.glow
          }}
          title="Zoom Out"
        >
          −
        </button>

        <span className="globe-controls-divider" style={{ '--border-color': COLORS.border }} />

        <button
          onClick={() => mode !== 'quiz' && onModeToggle()}
          className={`globe-control-btn ${mode === 'quiz' ? 'primary' : 'secondary'}`}
          style={{
            '--button-primary': COLORS.buttonPrimary,
            '--button-secondary': COLORS.buttonSecondary,
            '--text-color': COLORS.text,
            '--button-text': COLORS.ocean,
            '--border-color': COLORS.border,
            '--glow-color': COLORS.glow
          }}
          title="Quiz Mode"
        >
          🎯 Quiz
        </button>

        <button
          onClick={() => mode !== 'explore' && onModeToggle()}
          className={`globe-control-btn ${mode === 'explore' ? 'primary' : 'secondary'}`}
          style={{
            '--button-primary': COLORS.buttonPrimary,
            '--button-secondary': COLORS.buttonSecondary,
            '--text-color': COLORS.text,
            '--button-text': COLORS.ocean,
            '--border-color': COLORS.border,
            '--glow-color': COLORS.glow
          }}
          title="Explore Mode"
        >
          🗺️ Explore
        </button>

        {mode === 'quiz' && (
          <button
            onClick={onStartOver}
            className="globe-control-btn primary"
            style={{
              '--button-primary': COLORS.buttonPrimary,
              '--text-color': COLORS.text,
              '--border-color': COLORS.border,
              '--glow-color': COLORS.glow
            }}
            title="Next Country"
          >
            Next
          </button>
        )}

        <button
          onClick={onToggleTooltips}
          className={`globe-control-btn ${tooltipsEnabled ? 'secondary toggle-on' : 'toggle-off'}`}
          style={{
            '--button-secondary': COLORS.buttonSecondary,
            '--button-text': COLORS.ocean,
            '--land-color': COLORS.land,
            '--text-secondary': COLORS.textSecondary,
            '--border-color': COLORS.border,
            '--hover-color': COLORS.hover
          }}
          title="Toggle Tooltips"
        >
          {tooltipsEnabled ? 'Tips: ON' : 'Tips: OFF'}
        </button>

        <select
          value={selectedColorScheme}
          onChange={(e) => onColorSchemeChange(e.target.value)}
          className="color-scheme-dropdown"
          style={{
            '--button-primary': COLORS.buttonPrimary,
            '--text-color': COLORS.text,
            '--border-color': COLORS.border,
            '--glow-color': COLORS.glow
          }}
        >
          {Object.keys(COLOR_SCHEMES).map(schemeKey => (
            <option key={schemeKey} value={schemeKey}>
              {COLOR_SCHEMES[schemeKey].name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default memo(WorldMap);
