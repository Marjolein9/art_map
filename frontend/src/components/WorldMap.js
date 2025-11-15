import React, { memo, useState, useEffect, useRef } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from 'react-simple-maps';
import { easeCubicInOut } from 'd3-ease';
import { convertNumericToAlpha3 } from '../data/isoMapping';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Continent view configurations with center coordinates and zoom levels
const CONTINENT_VIEWS = {
  'Africa': { center: [20, 0], zoom: 4.5 },
  'Asia': { center: [90, 30], zoom: 3.5 },
  'Europe': { center: [15, 52], zoom: 5.5 },
  'North America': { center: [-100, 50], zoom: 4 },
  'South America': { center: [-60, -15], zoom: 4.5 },
  'Oceania': { center: [135, -25], zoom: 5 },
  'default': { center: [0, 20], zoom: 1 }
};

const WorldMap = ({
  onCountryClick,
  highlightedCountries = [],
  targetCountry = null,
  showHint = false,
  continent = null
}) => {
  const [position, setPosition] = useState({ coordinates: [0, 20], zoom: 1 });
  const [isAnimating, setIsAnimating] = useState(false);
  const previousContinentRef = useRef(null);
  const positionRef = useRef(position);

  // Keep position ref updated
  useEffect(() => {
    positionRef.current = position;
    console.log('📍 Position updated:', position);
  }, [position]);

  // Animate to continent when it changes
  useEffect(() => {
    console.log('🌍 Continent changed:', {
      newContinent: continent,
      previousContinent: previousContinentRef.current,
      willAnimate: continent && continent !== previousContinentRef.current
    });

    if (continent && continent !== previousContinentRef.current) {
      console.log('✅ Triggering animation from', previousContinentRef.current, 'to', continent);
      previousContinentRef.current = continent;
      const targetView = CONTINENT_VIEWS[continent] || CONTINENT_VIEWS['default'];
      console.log('🎯 Target view:', targetView);
      animateToPosition(targetView.center, targetView.zoom);
    }
  }, [continent]);

  const animateToPosition = (targetCenter, targetZoom) => {
    setIsAnimating(true);
    const startPosition = { ...positionRef.current }; // Use ref to get current position
    console.log('🚀 Starting animation:', {
      from: startPosition,
      to: { center: targetCenter, zoom: targetZoom }
    });
    const duration = 1000; // 1 second
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeCubicInOut(progress);

      // Interpolate coordinates and zoom
      const newCoordinates = [
        startPosition.coordinates[0] + (targetCenter[0] - startPosition.coordinates[0]) * eased,
        startPosition.coordinates[1] + (targetCenter[1] - startPosition.coordinates[1]) * eased
      ];
      const newZoom = startPosition.zoom + (targetZoom - startPosition.zoom) * eased;

      setPosition({
        coordinates: newCoordinates,
        zoom: newZoom
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        console.log('✅ Animation complete. Final position:', {
          coordinates: newCoordinates,
          zoom: newZoom
        });
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animate);
  };

  const getCountryFill = (geo) => {
    const numericCode = geo.id;
    const alpha3Code = convertNumericToAlpha3(numericCode);

    // If hint is shown, highlight target country and neighbors
    if (showHint && highlightedCountries.includes(alpha3Code)) {
      if (targetCountry && alpha3Code === targetCountry) {
        return "#4CAF50"; // Green for target country
      }
      return "#FFC107"; // Yellow for neighboring countries
    }

    return "#E0E0E0"; // Default gray
  };

  const handleMoveEnd = (newPosition) => {
    console.log('👆 User moved map (handleMoveEnd):', newPosition, 'isAnimating:', isAnimating);
    if (!isAnimating) {
      setPosition(newPosition);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 120
        }}
      >
        <ZoomableGroup
          center={position.coordinates}
          zoom={position.zoom}
          onMoveEnd={handleMoveEnd}
          minZoom={1}
          maxZoom={8}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onClick={() => {
                    const numericCode = geo.id;
                    const alpha3Code = convertNumericToAlpha3(numericCode);
                    console.log('🖱️ Clicked country:', {
                      numericId: numericCode,
                      alpha3Id: alpha3Code,
                      name: geo.properties?.name,
                      properties: geo.properties
                    });
                    onCountryClick(alpha3Code);
                  }}
                  fill={getCountryFill(geo)}
                  stroke="#FFFFFF"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: 'none' },
                    hover: {
                      fill: '#2196F3',
                      outline: 'none',
                      cursor: 'pointer'
                    },
                    pressed: {
                      fill: '#1976D2',
                      outline: 'none'
                    },
                  }}
                />
              ))
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
};

export default memo(WorldMap);
