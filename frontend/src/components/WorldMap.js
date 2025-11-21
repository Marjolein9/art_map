import React, { memo, useState, useEffect, useRef } from 'react';
import Globe from 'react-globe.gl';
import { getCountryIsoCode, getCountryName } from '../utils/countryCodeMapping';
import { COLOR_SCHEMES } from '../styles/colorSchemes';

// Region center coordinates (lat, lng, altitude) - using subregions for better precision
const REGION_VIEWS = {
  // Africa subregions
  'North Africa': { lat: 28, lng: 15, altitude: 1.4 },
  'West Africa': { lat: 10, lng: 0, altitude: 1.4 },
  'East Africa': { lat: 0, lng: 38, altitude: 1.4 },
  'Southern Africa': { lat: -25, lng: 25, altitude: 1.4 },

  // Asia subregions
  'East Asia': { lat: 35, lng: 110, altitude: 1.4 },
  'Southeast Asia': { lat: 10, lng: 105, altitude: 1.3 },
  'South Asia': { lat: 23, lng: 80, altitude: 1.4 },
  'Central Asia': { lat: 45, lng: 65, altitude: 1.4 },
  'Middle East': { lat: 30, lng: 45, altitude: 1.3 },

  // Europe subregions
  'Western Europe': { lat: 50, lng: 5, altitude: 1.3 },
  'Eastern Europe': { lat: 52, lng: 30, altitude: 1.3 },
  'Northern Europe': { lat: 62, lng: 15, altitude: 1.3 },
  'Southern Europe': { lat: 42, lng: 15, altitude: 1.3 },
  'Central Europe': { lat: 50, lng: 15, altitude: 1.3 },

  // Americas
  'North America': { lat: 50, lng: -100, altitude: 1.5 },
  'Central America': { lat: 15, lng: -90, altitude: 1.3 },
  'Caribbean': { lat: 20, lng: -75, altitude: 1.3 },
  'South America': { lat: -15, lng: -60, altitude: 1.5 },

  // Oceania
  'Oceania': { lat: -25, lng: 135, altitude: 1.5 },

  // Fallback for broad continents (if subregion not available)
  'Africa': { lat: 0, lng: 20, altitude: 1.5 },
  'Asia': { lat: 30, lng: 90, altitude: 1.5 },
  'Europe': { lat: 52, lng: 15, altitude: 1.3 },
  'default': { lat: 0, lng: 0, altitude: 2.5 }
};

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
  onColorSchemeChange
}) => {
  const COLORS = colors;
  const globeEl = useRef();
  const [countries, setCountries] = useState({ features: [] });
  const [hoverD, setHoverD] = useState(null);
  const previousRegionRef = useRef(null);
  const [clickedCountry, setClickedCountry] = useState(null);

  // Load country data
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(data => {
        setCountries(data);
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
    // All countries use default land color
    return COLORS.land;
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
    <div style={{ width: '100%' }}>
      <div style={{ position: 'relative', width: '100%', height: '600px' }}>
        <Globe
          ref={globeEl}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
          atmosphereColor={COLORS.hover}
          atmosphereAltitude={0.15}

          polygonsData={countries.features}
          polygonCapColor={getCountryColor}
          polygonSideColor={() => COLORS.land}
          polygonStrokeColor={getBorderColor}
          polygonStrokeWidth={1.5}
          polygonAltitude={d => d === hoverD ? 0.015 : 0.008}
          polygonCapMaterial={(d) => {
            // Create semi-transparent material to show Earth underneath
            return { opacity: 0.7, transparent: true };
          }}
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
          polygonsTransitionDuration={300}

          enablePointerInteraction={true}
          width={900}
          height={600}
        />

        {/* Find overlay on top of globe */}
        {targetCountryName && (
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: COLORS.cardBg,
            color: COLORS.text,
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '20px',
            fontWeight: 'bold',
            fontFamily: 'system-ui',
            boxShadow: `0 0 20px ${COLORS.glow}, 0 4px 6px rgba(0,0,0,0.3)`,
            border: overlayStyle.border,
            backdropFilter: 'blur(10px)',
            zIndex: 100,
            transition: 'border 0.3s ease'
          }}>
            {overlayStyle.icon && <span style={{ marginRight: '8px' }}>{overlayStyle.icon}</span>}
            Find: {targetCountryName}
          </div>
        )}
      </div>

      {/* All control buttons - below globe, small, all in one line */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '6px',
        marginTop: '10px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <button
          onClick={rotateLeft}
          style={{
            padding: '4px 8px',
            backgroundColor: COLORS.buttonBg,
            color: 'white',
            border: `1px solid ${COLORS.border}`,
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 'bold',
            boxShadow: `0 0 5px ${COLORS.glow}`,
            transition: 'all 0.3s ease'
          }}
          title="Rotate Left"
        >
          ←
        </button>
        <button
          onClick={rotateRight}
          style={{
            padding: '4px 8px',
            backgroundColor: COLORS.buttonBg,
            color: 'white',
            border: `1px solid ${COLORS.border}`,
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 'bold',
            boxShadow: `0 0 5px ${COLORS.glow}`,
            transition: 'all 0.3s ease'
          }}
          title="Rotate Right"
        >
          →
        </button>
        <button
          onClick={zoomIn}
          style={{
            padding: '4px 8px',
            backgroundColor: COLORS.buttonBg,
            color: 'white',
            border: `1px solid ${COLORS.border}`,
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 'bold',
            boxShadow: `0 0 5px ${COLORS.glow}`,
            transition: 'all 0.3s ease'
          }}
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={zoomOut}
          style={{
            padding: '4px 8px',
            backgroundColor: COLORS.buttonBg,
            color: 'white',
            border: `1px solid ${COLORS.border}`,
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 'bold',
            boxShadow: `0 0 5px ${COLORS.glow}`,
            transition: 'all 0.3s ease'
          }}
          title="Zoom Out"
        >
          −
        </button>

        <span style={{
          width: '1px',
          height: '16px',
          backgroundColor: COLORS.border,
          margin: '0 4px'
        }} />

        <button
          onClick={onStartOver}
          style={{
            padding: '4px 10px',
            backgroundColor: COLORS.buttonPrimary,
            color: COLORS.text,
            border: `1px solid ${COLORS.border}`,
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 'bold',
            boxShadow: `0 0 5px ${COLORS.glow}`,
            transition: 'all 0.3s ease'
          }}
          title="Next Country"
        >
          Next
        </button>

        <button
          onClick={onToggleTooltips}
          style={{
            padding: '4px 10px',
            backgroundColor: tooltipsEnabled ? COLORS.buttonSecondary : COLORS.land,
            color: tooltipsEnabled ? COLORS.ocean : COLORS.textSecondary,
            border: `1px solid ${COLORS.border}`,
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 'bold',
            boxShadow: tooltipsEnabled ? `0 0 8px ${COLORS.hover}` : 'none',
            transition: 'all 0.3s ease'
          }}
          title="Toggle Tooltips"
        >
          {tooltipsEnabled ? 'Tips: ON' : 'Tips: OFF'}
        </button>

        <select
          value={selectedColorScheme}
          onChange={(e) => onColorSchemeChange(e.target.value)}
          style={{
            padding: '4px 8px',
            backgroundColor: COLORS.buttonPrimary,
            color: COLORS.text,
            border: `1px solid ${COLORS.border}`,
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 'bold',
            boxShadow: `0 0 5px ${COLORS.glow}`,
            transition: 'all 0.3s ease'
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
