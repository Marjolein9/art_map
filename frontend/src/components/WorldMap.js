import React, { memo, useState, useEffect, useRef, useMemo } from 'react';
import Globe from 'react-globe.gl';
import { Button, Box, Typography, FormControlLabel, Switch, Select, MenuItem } from '@mui/material';
import { getCountryIsoCode, initializeCountryMapping } from '../utils/countryCodeMapping';
import { REGION_VIEWS } from '../config/regions';
import { loadTopoJSON } from '../utils/topoJsonLoader';
import { fetchCountries, fetchNeighbors, fetchSimilarIslands } from '../services/api';
import { getPathColor, getPathStrokeColor } from '../utils/pastelColorPalette';

const WorldMap = ({
  onCountryClick,
  targetCountry = null,
  targetCountryName = null,
  region = null,
  gameStatus = 'playing',
  colors,
  onNewGame,
  onStartOver,
  mode = 'quiz',
  onModeToggle,
  loading = false,
  onManualCountrySelect = null,
  countryLookup = {},
  backendReady = false, 
    setShowWelcome,
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
  const [hintsGuessed, setHintsGuessed] = useState(false); // Track if user has made a guess

  // Handle window resize for responsive globe
  useEffect(() => {
    const updateGlobeDimensions = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      let globeWidth, globeHeight;

      if (width <= 768) {
        globeWidth = width - 40;
        globeHeight = height - 100;
      } else if (width <= 1024) {
        globeWidth = width - 60;
        globeHeight = height - 120;
      } else {
        globeWidth = width - 60;
        globeHeight = height - 120;
      }

      setGlobeDimensions({ width: globeWidth, height: globeHeight });
    };

    updateGlobeDimensions();
    window.addEventListener('resize', updateGlobeDimensions);
    return () => window.removeEventListener('resize', updateGlobeDimensions);
  }, []);

  // Load country data from backend only when backendReady
  useEffect(() => {
    if (!backendReady) return; // <-- wait for backend

    const loadData = async () => {
      try {
        const dbCountries = await fetchCountries();
        initializeCountryMapping(dbCountries);

        const excluded = ['BES','BVT','CXR','CCK','GUF','GIB','GLP','MTQ','MYT','REU','SJM','TKL','TUV','UMI'];
        const validCountries = dbCountries.filter(c => c.is_country && !excluded.includes(c.iso3));
        setAllCountries(validCountries);

        const data = await loadTopoJSON(dbCountries);
        setCountries(data);

        const paths = [];
        data.features.forEach(feature => {
          if (feature.geometry.type === 'Polygon') {
            paths.push({ coords: feature.geometry.coordinates, properties: feature.properties, geometry: feature.geometry, id: feature.id });
          } else if (feature.geometry.type === 'MultiPolygon') {
            feature.geometry.coordinates.forEach(islandCoords => {
              paths.push({ coords: islandCoords, properties: feature.properties, geometry: { ...feature.geometry, coordinates: islandCoords, type: 'Polygon' }, id: feature.id });
            });
          }
        });

        setCountryPaths(paths);
      } catch (err) {
        console.error('Error loading country data:', err);
      }
    };

    loadData();
  }, [backendReady]);

  // Handle hints for target country
  const hintCountryRef = useRef(null);
  useEffect(() => {
    if (!backendReady) return; // <-- wait for backend

    const showHints = async () => {
      if (targetCountry && mode === 'quiz' && hintsEnabled) {
        if (hintCountryRef.current === targetCountry) return;

        try {
          const targetCountryData = countries.features.find(f => getCountryIsoCode(f) === targetCountry);
          const targetM49 = targetCountryData?.id;
          const highlightM49s = [];

          if (targetM49) highlightM49s.push(String(targetM49).padStart(3,'0'));

          const islandData = await fetchSimilarIslands(targetCountry);

          if (islandData.is_island && islandData.islands?.length > 0) {
            const islandM49s = islandData.islands.map(i => String(i.m49).padStart(3,'0')).filter(Boolean);
            highlightM49s.push(...islandM49s);
          } else {
            const neighbors = await fetchNeighbors(targetCountry);
            if (neighbors?.length) {
              const shuffled = [...neighbors].sort(() => Math.random() - 0.5).slice(0,2);
              const neighborM49s = shuffled.map(n => String(n.m49).padStart(3,'0')).filter(Boolean);
              highlightM49s.push(...neighborM49s);
            }
          }

          console.log(`✅ HINTS FETCHED for ${targetCountry}:`, highlightM49s);
          setHintNeighborsM49(highlightM49s);
          hintCountryRef.current = targetCountry;

        } catch (err) {
          console.error('❌ Error fetching hints:', err);
        }
      } else {
        console.log(`🚫 HINTS DISABLED or not in quiz mode`);
        setHintNeighborsM49([]);
        hintCountryRef.current = null;
      }
    };

    showHints();
  }, [targetCountry, targetCountryName, mode, countries, hintsEnabled, backendReady, clickedCountry]);

  // Reset hint state when a new target appears
  const prevTargetCountryRef = useRef(null);
  useEffect(() => {
    if (prevTargetCountryRef.current && prevTargetCountryRef.current !== targetCountry) {
      console.log(`🔄 NEW TARGET: ${prevTargetCountryRef.current} → ${targetCountry}`);
      console.log(`  Resetting: clickedCountry, hintsGuessed, showMe`);
      console.log(`  NOT clearing hints array - will re-fetch for new target`);
      setClickedCountry(null);
      setShowMeActivated(false);
      setHintsGuessed(false); // Reset hints to colored for new target
      // Note: We don't clear hintNeighborsM49 here - it will be updated by the effect above
    }
    prevTargetCountryRef.current = targetCountry;
  }, [targetCountry]);

  // Debug: Log state changes
  useEffect(() => {
    console.log(`📊 GAME STATE: gameStatus=${gameStatus}, clickedCountry=${clickedCountry}, targetCountry=${targetCountry}, hintsGuessed=${hintsGuessed}`);
  }, [gameStatus, clickedCountry, targetCountry, hintsGuessed]);

  useEffect(() => {
    console.log(`💡 HINTS STATE: hintsGuessed=${hintsGuessed}, hintNeighborsM49=`, hintNeighborsM49);
  }, [hintsGuessed, hintNeighborsM49]);

  const activeHints = showMeActivated ? [] : hintNeighborsM49;

  // Rotate to region on change
  useEffect(() => {
    if (!globeEl.current) return;
    if (region && region !== previousRegionRef.current) {
      previousRegionRef.current = region;
      const targetView = REGION_VIEWS[region] || REGION_VIEWS['default'];
      globeEl.current.pointOfView({ lat: targetView.lat, lng: targetView.lng, altitude: targetView.altitude }, 1000);
    }
  }, [region]);

  // Zoom to Middle East during loading
  useEffect(() => {
    if (!globeEl.current) return;
    if (loading) globeEl.current.pointOfView({ lat:30, lng:45, altitude:1 }, 1000);
  }, [loading]);

  const handlePolygonClick = (polygon) => {
    if (!polygon || !polygon.properties) return;
    const iso3 = getCountryIsoCode(polygon);
    console.log(`🖱️ COUNTRY CLICKED: ${iso3}`);
    console.log(`  Setting hintsGuessed = true (hints will turn black)`);
    setClickedCountry(iso3 || null);
    setHintsGuessed(true); // Turn hints black after any guess
    onCountryClick(iso3);
  };

  const rotateLeft = () => {
    if (!globeEl.current) return;
    const currentView = globeEl.current.pointOfView();
    globeEl.current.pointOfView({ lng: currentView.lng-30, lat: currentView.lat, altitude: currentView.altitude }, 500);
  };

  const rotateRight = () => {
    if (!globeEl.current) return;
    const currentView = globeEl.current.pointOfView();
    globeEl.current.pointOfView({ lng: currentView.lng+30, lat: currentView.lat, altitude: currentView.altitude }, 500);
  };

  const zoomIn = () => {
    if (!globeEl.current) return;
    const currentView = globeEl.current.pointOfView();
    globeEl.current.pointOfView({ lng: currentView.lng, lat: currentView.lat, altitude: Math.max(currentView.altitude-0.3,0.5) }, 500);
  };

  const zoomOut = () => {
    if (!globeEl.current) return;
    const currentView = globeEl.current.pointOfView();
    globeEl.current.pointOfView({ lng: currentView.lng, lat: currentView.lat, altitude: Math.min(currentView.altitude+0.3,3) }, 500);
  };

  const calculateCentroid = (coordinates) => {
    let latSum=0, lngSum=0, count=0;
    const processCoords = (coords) => {
      if (Array.isArray(coords[0]) && Array.isArray(coords[0][0])) coords.forEach(c => processCoords(c));
      else coords.forEach(([lng,lat]) => { lngSum+=lng; latSum+=lat; count++; });
    };
    processCoords(coordinates);
    return count>0 ? { lat:latSum/count, lng:lngSum/count } : null;
  };

  const handleShowMe = () => {
    if (!targetCountry || !globeEl.current) return;
    const targetFeature = countries.features.find(f => getCountryIsoCode(f) === targetCountry);
    if (!targetFeature) return;
    const centroid = calculateCentroid(targetFeature.geometry.coordinates);
    if (!centroid) return;
    globeEl.current.pointOfView({ lat: centroid.lat, lng: centroid.lng, altitude:0.5 }, 1000);
    setShowMeActivated(true);
  };

  const handleCountryDropdownChange = (e) => {
    const iso3 = e.target.value;
    if (!iso3 || !onManualCountrySelect) return;
    const selectedCountry = allCountries.find(c => c.iso3===iso3);
    if (selectedCountry) onManualCountrySelect(selectedCountry);
  };

  const layeredPaths = useMemo(() => {
    const paths = [];
    const timestamp = Date.now(); // Force Globe to see paths as different

    countryPaths.forEach(path => paths.push({
      ...path,
      isHintOverlay:false,
      isShowMeOverlay:false,
      hintsGuessed: false,
      _updateKey: timestamp
    }));

    const hintPaths = [];
    countryPaths.forEach(path => {
      const m49 = path.id || path.properties?.id;
      const paddedM49 = m49 ? String(m49).padStart(3,'0') : null;
      const pathIso = getCountryIsoCode(path);
      // Don't show hint overlay for clicked country (it should show as red instead)
      if (paddedM49 && activeHints.includes(paddedM49) && pathIso !== clickedCountry) {
        const hintPath = {
          ...path,
          isHintOverlay:true,
          isShowMeOverlay:false,
          hintsGuessed,
          _updateKey: timestamp
        };
        paths.push(hintPath);
        hintPaths.push({ m49: paddedM49, iso: pathIso, hintsGuessed });
      }
    });

    if (showMeActivated && targetCountry) {
      countryPaths.forEach(path => {
        const iso3 = getCountryIsoCode(path);
        if (iso3 === targetCountry) paths.push({
          ...path,
          isHintOverlay:false,
          isShowMeOverlay:true,
          hintsGuessed: false,
          _updateKey: timestamp
        });
      });
    }

    console.log(`🗺️ LAYERED PATHS RECALCULATED`);
    console.log(`  Total paths: ${paths.length}`);
    console.log(`  Hint paths created:`, hintPaths);
    console.log(`  hintsGuessed=${hintsGuessed}, activeHints=`, activeHints);
    console.log(`  Update key: ${timestamp}`);

    return paths;
  }, [countryPaths, activeHints, showMeActivated, targetCountry, clickedCountry, hintsGuessed]);

  return (
    <div className="world-map-wrapper">
      <div className="globe-position-container">
        <Globe
          ref={globeEl}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
          atmosphereColor={COLORS.hover}
          atmosphereAltitude={0.15}
          polygonsData={countries.features}
          polygonCapColor={() => 'rgba(0,0,0,0)'}
          polygonSideColor={() => 'rgba(0,0,0,0)'}
          polygonStrokeColor={() => 'rgba(0,0,0,0)'}
          polygonAltitude={0.001}
          onPolygonHover={setHoverD}
          onPolygonClick={handlePolygonClick}
          pathsData={layeredPaths}
          pathPoints={d => Array.isArray(d.coords[0]) ? d.coords[0] : d.coords}
          pathPointLat={p => p[1]}
          pathPointLng={p => p[0]}
          pathColor={d => {
            return getPathColor(
              d,
              gameStatus,
              d.isHintOverlay,
              d.isShowMeOverlay,
              clickedCountry,
              targetCountry,
              getCountryIsoCode,
              COLORS,
              hoverD
            );
          }}
          pathStrokeColor={d => getPathStrokeColor(d, d.isHintOverlay, d.isShowMeOverlay, d.hintsGuessed)}
          pathStroke={d => (d.isShowMeOverlay||d.isHintOverlay)?4:2}
          pathDashLength={1} pathDashGap={0} pathDashAnimateTime={0} pathTransitionDuration={0}
          onPathHover={setHoverD} onPathClick={handlePolygonClick}
          enablePointerInteraction
          width={globeDimensions.width} height={globeDimensions.height}
        />

        <div className="control-overlay" style={{ '--card-bg': COLORS.cardBg, '--text-color': COLORS.text, '--glow-color': COLORS.glow, '--border-color': COLORS.border }}>
          <div className="overlay-title">
            {mode==='quiz' && targetCountryName ? `Find: ${targetCountryName}` : ''}
          </div>

          <div className="overlay-controls">
            {/* Quiz Mode Toggle and Controls */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={mode==='quiz'}
                    onChange={onModeToggle}
                    size="small"
                  />
                }
                label="Quiz"
              />
              <Button
                variant="outlined"
                size="small"
                onClick={() => setShowWelcome(true)}
                title="Open Welcome Menu"
                sx={{ minWidth: 'auto', padding: '2px 8px', fontSize: '16px' }}
              >
                ℹ
              </Button>
              {mode === 'quiz' && (
                <>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={onStartOver}
                    title="Next Country"
                    sx={{ minWidth: 'auto', padding: '2px 8px', fontSize: '14px' }}
                  >
                    Skip
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
                      fontSize: '14px'
                    }}
                  >
                    {showMeActivated ? 'Shown' : 'Show'}
                  </Button>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={hintsEnabled}
                        onChange={() => setHintsEnabled(prev => !prev)}
                        size="small"
                      />
                    }
                    label="Hint"
                  />
                </>
              )}
            </Box>

            {/* Quiz-Specific Controls */}
            {mode === 'quiz' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>

                {/* Country Dropdown */}
                <Select
                  value={targetCountry || ''}
                  onChange={handleCountryDropdownChange}
                  size="small"
                  displayEmpty
                  sx={{
                    maxWidth: '150px',
                    minWidth: '140px',
                  }}
                >
                  <MenuItem value="">Test country...</MenuItem>
                  {allCountries
                    .sort((a, b) =>
                      (a.common_name || a.name).localeCompare(
                        b.common_name || b.name
                      )
                    )
                    .map(c => (
                      <MenuItem key={c.iso3} value={c.iso3}>
                        {c.common_name || c.name}
                      </MenuItem>
                    ))}
                </Select>
              </Box>
            )}

          </div>
        </div>

        {/* Bottom Control Overlay - Zoom and Rotation */}
        <div className="control-overlay-bottom" style={{ '--card-bg': COLORS.cardBg, '--text-color': COLORS.text, '--glow-color': COLORS.glow, '--border-color': COLORS.border }}>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={rotateLeft}
              title="Rotate Left"
              sx={{ minWidth: 'auto', padding: '2px 8px', fontSize: '16px' }}
            >
              ←
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={rotateRight}
              title="Rotate Right"
              sx={{ minWidth: 'auto', padding: '2px 8px', fontSize: '16px' }}
            >
              →
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={zoomIn}
              title="Zoom In"
              sx={{ minWidth: 'auto', padding: '2px 8px', fontSize: '16px' }}
            >
              +
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={zoomOut}
              title="Zoom Out"
              sx={{ minWidth: 'auto', padding: '2px 8px', fontSize: '16px' }}
            >
              −
            </Button>
          </Box>
        </div>
      </div>
    </div>
  );
};

export default memo(WorldMap);
