import React, { memo, useState, useEffect, useRef } from 'react';
import Globe from 'react-globe.gl';
import { getCountryIsoCode, getCountryName } from '../utils/countryCodeMapping';
import { COLOR_SCHEMES } from '../styles/colorSchemes';
import { REGION_VIEWS } from '../config/regions';

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

  // Load country data
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(data => {
        setCountries(data);

        // Convert polygons to paths (border lines only) for consistent rendering
        const paths = data.features.map(feature => {
          const coords = feature.geometry.type === 'Polygon'
            ? feature.geometry.coordinates
            : feature.geometry.coordinates.flat(); // Handle MultiPolygon

          return {
            coords: coords,
            properties: feature.properties,
            geometry: feature.geometry
          };
        });

        setCountryPaths(paths);
        console.log('🌍 Loaded country data:', data.features.length, 'countries');
      })
      .catch(err => console.error('Error loading country data:', err));
  }, []);

  // Clear clicked country after feedback
  useEffect(() => {
    if (gameStatus !== 'playing') {
      const timer = setTimeout(() => {
        setClickedCountry(null);
      }, gameStatus === 'correct' ? 2000 : 1500);
      return () => clearTimeout(timer);
    }
  }, [gameStatus]);

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
    const iso3 = getCountryIsoCode(country.properties);
    if (!iso3) return COLORS.border;

    // If this country was just clicked and got a result
    if (clickedCountry === iso3) {
      if (gameStatus === 'correct') return COLORS.correct;
      if (gameStatus === 'incorrect') return COLORS.incorrect;
    }

    // If hovering over this country
    if (country === hoverD) {
      return COLORS.selected; // Highlight border on hover
    }

    // Default border color
    return COLORS.border;
  };

  // Handle country click
  const handlePolygonClick = (polygon) => {
    if (!polygon || !polygon.properties) return;

    const iso3 = getCountryIsoCode(polygon.properties);
    const name = getCountryName(polygon.properties);

    if (!iso3) {
      console.warn('⚠️ Could not determine ISO code for clicked country:', polygon.properties);
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

  // Get border color and icon for Find overlay
  const getFindOverlayStyle = () => {
    if (gameStatus === 'correct') {
      return {
        border: `3px solid ${COLORS.correct}`,
        icon: '✓'
      };
    } else if (gameStatus === 'incorrect') {
      return {
        border: `3px solid ${COLORS.incorrect}`,
        icon: '✗'
      };
    }
    return {
      border: `2px solid ${COLORS.border}`,
      icon: ''
    };
  };

  const overlayStyle = getFindOverlayStyle();

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

          polygonLabel={tooltipsEnabled ? ({ properties: d }) => {
            const name = getCountryName(d);
            const iso = getCountryIsoCode(d);
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
            const iso3 = getCountryIsoCode(d.properties);
            if (!iso3) return COLORS.border;

            if (clickedCountry === iso3) {
              if (gameStatus === 'correct') return COLORS.correct;
              if (gameStatus === 'incorrect') return COLORS.incorrect;
            }

            if (d === hoverD) return COLORS.selected;
            return COLORS.border;
          }}
          pathStroke={0.8}
          pathDashLength={1}
          pathDashGap={0}
          pathDashAnimateTime={0}

          enablePointerInteraction={true}
          width={900}
          height={600}
        />

        {/* Find overlay on top of globe */}
        {targetCountryName && (
          <div
            className="find-country-overlay"
            style={{
              '--card-bg': COLORS.cardBg,
              '--text-color': COLORS.text,
              '--glow-color': COLORS.glow,
              '--overlay-border': overlayStyle.border
            }}
          >
            {overlayStyle.icon && <span className="icon">{overlayStyle.icon}</span>}
            Find: {targetCountryName}
          </div>
        )}
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
