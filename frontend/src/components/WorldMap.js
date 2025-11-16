import React, { memo, useState, useEffect, useRef } from 'react';
import Globe from 'react-globe.gl';

// Space theme color palette
const COLORS = {
  ocean: '#0a1128',
  land: '#F1FAEE',
  hover: '#5bc0be',
  selected: '#6fffe9',
  correct: '#06D6A0',
  incorrect: '#ff006e',
  border: '#5bc0be',
  text: '#1D3557',
  tooltipBg: '#1c2541',
  tooltipText: '#ffffff',
  buttonBg: '#3a506b',
  glow: 'rgba(91, 192, 190, 0.6)'
};

// Continent center coordinates (lat, lng, altitude)
const CONTINENT_VIEWS = {
  'Africa': { lat: 0, lng: 20, altitude: 1.5 },
  'Asia': { lat: 30, lng: 90, altitude: 1.5 },
  'Europe': { lat: 52, lng: 15, altitude: 1.3 },
  'North America': { lat: 50, lng: -100, altitude: 1.5 },
  'South America': { lat: -15, lng: -60, altitude: 1.5 },
  'Oceania': { lat: -25, lng: 135, altitude: 1.5 },
  'default': { lat: 0, lng: 0, altitude: 2.5 }
};

const WorldMap = ({
  onCountryClick,
  highlightedCountries = [],
  targetCountry = null,
  showHint = false,
  continent = null,
  correctlyAnsweredCountries = [],
  gameStatus = 'playing'
}) => {
  const globeEl = useRef();
  const [countries, setCountries] = useState({ features: [] });
  const [hoverD, setHoverD] = useState(null);
  const previousContinentRef = useRef(null);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
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

  // Show feedback message when game status changes
  useEffect(() => {
    if (gameStatus === 'correct') {
      setFeedbackMessage('✓ Correct!');
      const timer = setTimeout(() => {
        setFeedbackMessage(null);
        setClickedCountry(null);
      }, 2000);
      return () => clearTimeout(timer);
    } else if (gameStatus === 'incorrect') {
      setFeedbackMessage('✗ Try Again!');
      const timer = setTimeout(() => {
        setFeedbackMessage(null);
        setClickedCountry(null);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [gameStatus]);

  // Rotate to continent when it changes
  useEffect(() => {
    if (!globeEl.current) return;

    console.log('🌍 Continent changed:', {
      newContinent: continent,
      previousContinent: previousContinentRef.current,
      willRotate: continent && continent !== previousContinentRef.current
    });

    if (continent && continent !== previousContinentRef.current) {
      console.log('✅ Triggering rotation from', previousContinentRef.current, 'to', continent);
      previousContinentRef.current = continent;
      const targetView = CONTINENT_VIEWS[continent] || CONTINENT_VIEWS['default'];
      console.log('🎯 Target view:', targetView);

      // Smoothly transition to the continent
      globeEl.current.pointOfView(
        {
          lat: targetView.lat,
          lng: targetView.lng,
          altitude: targetView.altitude
        },
        1000 // 1 second transition
      );
    }
  }, [continent]);

  // Get country fill color based on game state
  const getCountryColor = (country) => {
    const iso3 = country.properties.ISO_A3;

    // Correctly answered countries are green
    if (correctlyAnsweredCountries.includes(iso3)) {
      return COLORS.correct;
    }

    // Hinted countries (target and neighbors)
    if (showHint && highlightedCountries.includes(iso3)) {
      return COLORS.selected;
    }

    // Default land color
    return COLORS.land;
  };

  // Get border color based on hover and game status
  const getBorderColor = (country) => {
    const iso3 = country.properties.ISO_A3;

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

    const iso3 = polygon.properties.ISO_A3;
    const name = polygon.properties.NAME;

    console.log('🖱️ Clicked country:', {
      name,
      iso3,
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
        polygonLabel={({ properties: d }) => `
          <div style="background: ${COLORS.tooltipBg}; color: ${COLORS.tooltipText}; padding: 8px 12px; border-radius: 4px; font-family: system-ui; font-weight: bold; box-shadow: 0 0 10px ${COLORS.glow}; border: 2px solid ${COLORS.border};">
            ${d.NAME}
          </div>
        `}
        onPolygonHover={setHoverD}
        onPolygonClick={handlePolygonClick}
        polygonsTransitionDuration={300}

        enablePointerInteraction={true}
        width={900}
        height={600}
      />

      {/* Control buttons */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={rotateLeft}
            style={{
              padding: '10px 15px',
              backgroundColor: COLORS.buttonBg,
              color: 'white',
              border: `2px solid ${COLORS.border}`,
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 'bold',
              boxShadow: `0 0 10px ${COLORS.glow}`,
              transition: 'all 0.3s ease'
            }}
            title="Rotate Left"
          >
            ← Rotate
          </button>
          <button
            onClick={rotateRight}
            style={{
              padding: '10px 15px',
              backgroundColor: COLORS.buttonBg,
              color: 'white',
              border: `2px solid ${COLORS.border}`,
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 'bold',
              boxShadow: `0 0 10px ${COLORS.glow}`,
              transition: 'all 0.3s ease'
            }}
            title="Rotate Right"
          >
            Rotate →
          </button>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={zoomIn}
            style={{
              padding: '10px 15px',
              backgroundColor: COLORS.buttonBg,
              color: 'white',
              border: `2px solid ${COLORS.border}`,
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 'bold',
              boxShadow: `0 0 10px ${COLORS.glow}`,
              transition: 'all 0.3s ease'
            }}
            title="Zoom In"
          >
            + Zoom
          </button>
          <button
            onClick={zoomOut}
            style={{
              padding: '10px 15px',
              backgroundColor: COLORS.buttonBg,
              color: 'white',
              border: `2px solid ${COLORS.border}`,
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 'bold',
              boxShadow: `0 0 10px ${COLORS.glow}`,
              transition: 'all 0.3s ease'
            }}
            title="Zoom Out"
          >
            - Zoom
          </button>
        </div>
      </div>

      {/* Feedback message overlay */}
      {feedbackMessage && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: gameStatus === 'correct' ? COLORS.correct : COLORS.incorrect,
          color: 'white',
          padding: '15px 30px',
          borderRadius: '8px',
          fontSize: '24px',
          fontWeight: 'bold',
          fontFamily: 'system-ui',
          boxShadow: gameStatus === 'correct'
            ? `0 0 20px rgba(6, 214, 160, 0.8), 0 4px 6px rgba(0,0,0,0.3)`
            : `0 0 20px rgba(255, 0, 110, 0.8), 0 4px 6px rgba(0,0,0,0.3)`,
          border: `2px solid ${gameStatus === 'correct' ? COLORS.correct : COLORS.incorrect}`,
          zIndex: 100
        }}>
          {feedbackMessage}
        </div>
      )}
    </div>
  );
};

export default memo(WorldMap);
