import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Link,
  Button,
  CircularProgress,
  Paper,
} from '@mui/material';
import COLOR_SCHEME from '../styles/colorSchemes';
import { API_BASE } from '../utils/apiConfig';
import { fetchNeighbors, fetchCountries } from '../services/api';
import { loadTopoJSON } from '../utils/topoJsonLoader';
import { getCountryIsoCode } from '../utils/countryCodeMapping';

/**
 * QuizImageDisplay Component
 *
 * Displays a single random image from all available collections during quiz mode.
 * Shows only the image and caption, without collection headers.
 * Also displays a map section with neighboring countries.
 *
 * @param {Object} imagesByCollection - Object with collection names as keys and image arrays as values
 * @param {string} countryName - Name of the country
 * @param {string} countryISO - ISO3 code of the country
 * @param {Function} onShowAll - Callback to show all images in collections
 */
const QuizImageDisplay = ({ imagesByCollection, countryName, countryISO, onShowAll }) => {
  const [randomImage, setRandomImage] = useState(null);
  const [collectionName, setCollectionName] = useState(null);
  const [neighbors, setNeighbors] = useState([]);
  const [loadingNeighbors, setLoadingNeighbors] = useState(false);
  const [geoData, setGeoData] = useState(null);
  const [targetCountryFeature, setTargetCountryFeature] = useState(null);
  const [neighborFeatures, setNeighborFeatures] = useState([]);

  // Select a random image when imagesByCollection changes
  useEffect(() => {
    if (!imagesByCollection || Object.keys(imagesByCollection).length === 0) {
      setRandomImage(null);
      setCollectionName(null);
      return;
    }

    // Flatten all images from all collections into a single array
    const allImagesWithCollection = [];
    Object.entries(imagesByCollection).forEach(([collection, images]) => {
      if (images && images.length > 0) {
        images.forEach(image => {
          allImagesWithCollection.push({ image, collection });
        });
      }
    });

    if (allImagesWithCollection.length === 0) {
      setRandomImage(null);
      setCollectionName(null);
      return;
    }

    // Pick a random image
    const randomIndex = Math.floor(Math.random() * allImagesWithCollection.length);
    const selected = allImagesWithCollection[randomIndex];
    setRandomImage(selected.image);
    setCollectionName(selected.collection);
  }, [imagesByCollection]);

  // Load GeoJSON data with full country list
  useEffect(() => {
    const loadGeoData = async () => {
      try {
        // Fetch countries list first to ensure all countries are loaded
        const countries = await fetchCountries();
        const data = await loadTopoJSON(countries);
        setGeoData(data);
      } catch (error) {
        console.error('Error loading GeoJSON:', error);
        // Fallback to simple topology if countries fetch fails
        try {
          const data = await loadTopoJSON([]);
          setGeoData(data);
        } catch (fallbackError) {
          console.error('Fallback GeoJSON loading failed:', fallbackError);
        }
      }
    };
    loadGeoData();
  }, []);

  // Fetch neighbors and extract country features when country changes
  useEffect(() => {
    if (!countryISO || !geoData) {
      setNeighbors([]);
      setTargetCountryFeature(null);
      setNeighborFeatures([]);
      return;
    }

    const loadNeighbors = async () => {
      setLoadingNeighbors(true);
      try {
        // Fetch neighbor data
        const neighborData = await fetchNeighbors(countryISO);
        setNeighbors(neighborData || []);

        // Find target country feature
        const targetFeature = geoData.features.find(f => getCountryIsoCode(f) === countryISO);
        setTargetCountryFeature(targetFeature);

        // Find neighbor features
        const neighborISO3s = (neighborData || []).map(n => n.iso3);
        const neighborGeoFeatures = geoData.features.filter(f =>
          neighborISO3s.includes(getCountryIsoCode(f))
        );
        setNeighborFeatures(neighborGeoFeatures);
      } catch (error) {
        console.error('Error fetching neighbors:', error);
        setNeighbors([]);
        setTargetCountryFeature(null);
        setNeighborFeatures([]);
      } finally {
        setLoadingNeighbors(false);
      }
    };

    loadNeighbors();
  }, [countryISO, geoData]);

  const hasImages = randomImage && collectionName;

  const getSourceInfo = (source) => {
    switch(source?.toLowerCase()) {
      case 'smithsonian':
        return { name: 'Smithsonian', url: 'https://www.si.edu/explore/art' };
      case 'wiki commons':
        return { name: 'Wikimedia Commons', url: 'https://commons.wikimedia.org/wiki/Main_Page' };
      case 'chicago':
        return { name: 'Art Institute of Chicago', url: 'https://www.artic.edu/' };
      default:
        return null;
    }
  };

  const getCollectionDisplayName = (collection) => {
    // Map backend collection names to display names for switch cases
    const displayNames = {
      'Albert Kahn': 'Albert Kahn',
      'Met Museum': 'Metropolitan Museum of Art',
      'Children in Art': 'Children in Art',
      'Public Domain Review': 'Public Domain Review',
      // Legacy table name mappings (in case they're used elsewhere)
      albert_kahn_images: 'Albert Kahn',
      met_images: 'Metropolitan Museum of Art',
      children_artwork_images: 'Children in Art',
      public_domain_images: 'Public Domain Review'
    };
    return displayNames[collection] || collection;
  };

  const renderCaption = () => {
    const displayName = getCollectionDisplayName(collectionName);

    // Collection header section
    const renderCollectionHeader = () => {
      switch(displayName) {
        case 'Albert Kahn':
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1.5 }}>
              <Link
                href="https://albert-kahn.hauts-de-seine.fr/en/"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: COLOR_SCHEME.linkColor,
                  textDecoration: 'underline',
                  fontWeight: 600,
                  fontSize: '1rem'
                }}
              >
                Albert Kahn's Archives of the Planet
              </Link>
              <Link
                href="https://publicdomainreview.org/essay/albert-kahns-archives-of-the-planet/"
                target="_blank"
                rel="noopener noreferrer"
                variant="body2"
                sx={{
                  color: COLOR_SCHEME.linkColor,
                  textDecoration: 'underline',
                  fontSize: '0.875rem'
                }}
              >
                The Color of Memory
              </Link>
            </Box>
          );

        case 'Metropolitan Museum of Art':
          return (
            <Box sx={{ mb: 1.5 }}>
              <Link
                href="https://www.metmuseum.org/"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: COLOR_SCHEME.linkColor,
                  textDecoration: 'underline',
                  fontWeight: 600,
                  fontSize: '1rem'
                }}
              >
                Metropolitan Museum of Art collection
              </Link>
            </Box>
          );

        case 'Children in Art':
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1.5 }}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                Children in Art
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                Artists from {countryName}
              </Typography>
            </Box>
          );

        case 'Public Domain Review':
          return (
            <Box sx={{ mb: 1.5 }}>
              <Link
                href="https://publicdomainreview.org/"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: COLOR_SCHEME.linkColor,
                  textDecoration: 'underline',
                  fontWeight: 600,
                  fontSize: '1rem'
                }}
              >
                Public Domain Review
              </Link>
            </Box>
          );

        default:
          return null;
      }
    };

    // Image-specific caption
    const renderImageCaption = () => {
      switch(displayName) {
        case 'Albert Kahn':
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {randomImage.title && randomImage.page_url && (
                <Link
                  href={randomImage.page_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="body2"
                  sx={{ color: COLOR_SCHEME.linkColor, textDecoration: 'underline' }}
                >
                  {randomImage.title}
                </Link>
              )}
              {randomImage.mission && (
                <Typography variant="body2">
                  {randomImage.mission}
                </Typography>
              )}
              {randomImage.date && (
                <Typography variant="body2">
                  {randomImage.date}
                </Typography>
              )}
              {randomImage.page_url ? (
                <Link
                  href={randomImage.page_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="body2"
                  sx={{ color: COLOR_SCHEME.linkColor, textDecoration: 'underline' }}
                >
                  Musée départemental Albert-Kahn
                </Link>
              ) : (
                <Link
                  href="https://albert-kahn.hauts-de-seine.fr/en/"
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="body2"
                  sx={{ color: COLOR_SCHEME.linkColor, textDecoration: 'underline' }}
                >
                  Musée départemental Albert-Kahn
                </Link>
              )}
            </Box>
          );

        case 'Metropolitan Museum of Art':
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {randomImage.object_url && randomImage.title ? (
                <Link
                  href={randomImage.object_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="body2"
                  sx={{ color: COLOR_SCHEME.linkColor, textDecoration: 'underline' }}
                >
                  {randomImage.title}
                </Link>
              ) : (
                <Link
                  href="https://www.metmuseum.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="body2"
                  sx={{ color: COLOR_SCHEME.linkColor, textDecoration: 'underline' }}
                >
                  {randomImage.title}
                </Link>
              )}
              {randomImage.artist_name && (
                <Typography variant="body2">
                  {randomImage.artist_name}
                  {randomImage.object_date && ` (${randomImage.object_date})`}
                </Typography>
              )}
              {randomImage.culture && (
                <Typography variant="body2">
                  {randomImage.culture}
                </Typography>
              )}
            </Box>
          );

        case 'Children in Art':
          const sourceInfo = getSourceInfo(randomImage.source);
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {randomImage.title && (
                <Link
                  href={randomImage.work_url || sourceInfo?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="body2"
                  sx={{ color: COLOR_SCHEME.linkColor, textDecoration: 'underline' }}
                >
                  {randomImage.title}
                </Link>
              )}
              {randomImage.artist_name && (
                <Typography variant="body2">
                  {randomImage.author_wikilink ? (
                    <Link
                      href={randomImage.author_wikilink}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="body2"
                      sx={{ color: COLOR_SCHEME.linkColor, textDecoration: 'underline' }}
                    >
                      {randomImage.artist_name}
                    </Link>
                  ) : (
                    randomImage.artist_name
                  )}
                  {randomImage.artist_nationality && `, ${randomImage.artist_nationality}`}
                </Typography>
              )}
              {sourceInfo && (
                <Typography variant="body2">
                  via{' '}
                  <Link
                    href={randomImage.work_url || sourceInfo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="body2"
                    sx={{ color: COLOR_SCHEME.linkColor, textDecoration: 'underline' }}
                  >
                    {sourceInfo.name}
                  </Link>
                </Typography>
              )}
            </Box>
          );

        case 'Public Domain Review':
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {randomImage.source_link && randomImage.description && (
                <Link
                  href={randomImage.source_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="body2"
                  sx={{ color: COLOR_SCHEME.linkColor, textDecoration: 'underline' }}
                >
                  {randomImage.description}
                </Link>
              )}
              {randomImage.title && randomImage.image_url && (
                <Typography variant="body2">
                  <Link
                    href={randomImage.image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="body2"
                    sx={{ color: COLOR_SCHEME.linkColor, textDecoration: 'underline' }}
                  >
                    {randomImage.title}
                  </Link>
                  {' '}Public Domain Review
                </Typography>
              )}
            </Box>
          );

        default:
          return null;
      }
    };

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', textAlign: 'center' }}>
        {renderCollectionHeader()}
        {renderImageCaption()}
      </Box>
    );
  };

  const imageUrl = hasImages
    ? (randomImage.filepath.startsWith('http')
        ? randomImage.filepath
        : `${API_BASE}/${randomImage.filepath}`)
    : null;

  // Helper function to calculate bounding box for a set of features
  const calculateBounds = (features) => {
    if (!features || features.length === 0) return null;

    let minLng = Infinity, maxLng = -Infinity;
    let minLat = Infinity, maxLat = -Infinity;

    const processCoords = (coords) => {
      if (!Array.isArray(coords)) return;

      if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
        const [lng, lat] = coords;
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
      } else {
        coords.forEach(c => processCoords(c));
      }
    };

    features.forEach(feature => {
      if (feature?.geometry?.coordinates) {
        processCoords(feature.geometry.coordinates);
      }
    });

    if (minLng === Infinity) return null;

    // Add 20% padding
    const lngPadding = (maxLng - minLng) * 0.3;
    const latPadding = (maxLat - minLat) * 0.3;

    return {
      minLng: minLng - lngPadding,
      maxLng: maxLng + lngPadding,
      minLat: minLat - latPadding,
      maxLat: maxLat + latPadding
    };
  };

  // Helper function to convert GeoJSON to SVG path
  const geometryToSVGPath = (geometry, bounds, width = 500, height = 500) => {
    if (!geometry || !bounds) return '';

    const lngRange = bounds.maxLng - bounds.minLng;
    const latRange = bounds.maxLat - bounds.minLat;
    const scale = Math.min(width / lngRange, height / latRange);

    // Center the map
    const offsetX = (width - lngRange * scale) / 2;
    const offsetY = (height - latRange * scale) / 2;

    const projectPoint = ([lng, lat]) => {
      const x = (lng - bounds.minLng) * scale + offsetX;
      const y = height - ((lat - bounds.minLat) * scale + offsetY);
      return [x, y];
    };

    const coordsToPath = (coords, isFirst = true) => {
      if (!Array.isArray(coords) || coords.length === 0) return '';

      if (typeof coords[0] === 'number') {
        const [x, y] = projectPoint(coords);
        return `${x},${y}`;
      }

      if (Array.isArray(coords[0]) && typeof coords[0][0] === 'number') {
        // Filter out invalid coordinates
        const validCoords = coords.filter(coord => {
          if (!coord || coord.length < 2) return false;
          const [lng, lat] = coord;
          return Math.abs(lng) <= 180 && Math.abs(lat) <= 90;
        });

        if (validCoords.length === 0) return '';

        // Build path, breaking it when there's a large longitude jump (antimeridian crossing)
        let pathSegments = [];
        let currentSegment = [];

        validCoords.forEach((coord, i) => {
          if (i === 0) {
            currentSegment.push(coord);
          } else {
            const [prevLng] = validCoords[i - 1];
            const [currLng] = coord;
            const lngDiff = Math.abs(currLng - prevLng);

            // If longitude jumps more than 180 degrees, it's crossing the antimeridian
            // Start a new segment to avoid drawing a line across the map
            if (lngDiff > 180) {
              if (currentSegment.length > 0) {
                pathSegments.push(currentSegment);
              }
              currentSegment = [coord];
            } else {
              currentSegment.push(coord);
            }
          }
        });

        // Add the last segment
        if (currentSegment.length > 0) {
          pathSegments.push(currentSegment);
        }

        // Convert each segment to SVG path
        return pathSegments.map(segment => {
          if (segment.length < 2) return '';
          return segment.map((coord, i) => {
            const [x, y] = projectPoint(coord);
            return i === 0 ? `M ${x},${y}` : `L ${x},${y}`;
          }).join(' ') + ' Z';
        }).filter(Boolean).join(' ');
      }

      return coords.map(ring => coordsToPath(ring, false)).join(' ');
    };

    if (geometry.type === 'Polygon') {
      return coordsToPath(geometry.coordinates);
    } else if (geometry.type === 'MultiPolygon') {
      // Render each polygon separately to avoid weird connectors
      return geometry.coordinates.map(polygon => coordsToPath(polygon)).filter(Boolean).join(' ');
    }

    return '';
  };

  // Calculate bounds including target country and neighbors
  const allFeatures = targetCountryFeature
    ? [targetCountryFeature, ...neighborFeatures]
    : [];
  const bounds = calculateBounds(allFeatures);

  // Calculate SVG dimensions based on aspect ratio
  // Use a base width for calculation, will be responsive in CSS
  const baseMapWidth = 300;
  let baseMapHeight = 300;

  if (bounds) {
    const lngRange = bounds.maxLng - bounds.minLng;
    const latRange = bounds.maxLat - bounds.minLat;
    const aspectRatio = latRange / lngRange;

    // Calculate height to maintain aspect ratio
    baseMapHeight = Math.round(baseMapWidth * aspectRatio);

    // Clamp height between 150 and 450 for reasonable sizes
    baseMapHeight = Math.max(150, Math.min(450, baseMapHeight));
  }

  // Generate SVG paths with dynamic dimensions
  const targetPath = targetCountryFeature && bounds
    ? geometryToSVGPath(targetCountryFeature.geometry, bounds, baseMapWidth, baseMapHeight)
    : '';

  const neighborPaths = neighborFeatures.map(feature => ({
    path: bounds ? geometryToSVGPath(feature.geometry, bounds, baseMapWidth, baseMapHeight) : '',
    name: neighbors.find(n => n.iso3 === getCountryIsoCode(feature))?.common_name ||
          neighbors.find(n => n.iso3 === getCountryIsoCode(feature))?.name || ''
  }));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Map View Section - 500x500 box */}
      <Paper
        elevation={0}
        sx={{
          backgroundColor: COLOR_SCHEME.cardBg,
          border: `1px solid ${COLOR_SCHEME.border}`,
          borderRadius: 2,
          p: 2,
        }}
      >
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2
        }}>
          {/* Map Box with SVG - Dynamic height based on aspect ratio */}
          {loadingNeighbors || !geoData ? (
            <Box sx={{
              width: { xs: '100%', sm: 300 },
              maxWidth: 300,
              height: { xs: 'auto', sm: 300 },
              aspectRatio: '1',
              backgroundColor: '#e8f4f8',
              border: `2px solid ${COLOR_SCHEME.border}`,
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CircularProgress size={40} />
            </Box>
          ) : (
            <Box sx={{
              position: 'relative',
              width: { xs: '100%', sm: baseMapWidth },
              maxWidth: baseMapWidth,
              height: 'auto',
              overflow: 'hidden',
              borderRadius: 1
            }}>
              <svg
                viewBox={`0 0 ${baseMapWidth} ${baseMapHeight}`}
                preserveAspectRatio="xMidYMid meet"
                style={{
                  width: '100%',
                  height: 'auto',
                  border: `2px solid ${COLOR_SCHEME.border}`,
                  borderRadius: '4px',
                  backgroundColor: '#e8f4f8',
                  display: 'block'
                }}
              >
                {/* Render neighbor countries */}
                {neighborPaths.map((neighbor, idx) => (
                  <path
                    key={idx}
                    d={neighbor.path}
                    fill="#d0e8f0"
                    stroke="#5a8fa8"
                    strokeWidth="1"
                    opacity="0.6"
                  />
                ))}

                {/* Render target country (highlighted) */}
                {targetPath && (
                  <path
                    d={targetPath}
                    fill="#ff6b6b"
                    stroke="#d63031"
                    strokeWidth="2"
                    opacity="0.8"
                  />
                )}
              </svg>

              {/* Country name overlay */}
              <Box sx={{
                position: 'absolute',
                top: 8,
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                px: 2,
                py: 0.5,
                borderRadius: 1,
                border: '1px solid #cbd5e0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <Typography variant="body1" sx={{
                  fontWeight: 700,
                  color: '#2c5282',
                  textAlign: 'center',
                  fontSize: '0.9rem'
                }}>
                  {countryName}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Image Section - Only show if images exist */}
      {hasImages ? (
        <Card
          sx={{
            backgroundColor: COLOR_SCHEME.cardBg,
            color: COLOR_SCHEME.text,
            border: `1px solid ${COLOR_SCHEME.border}`,
            boxShadow: 'none',
            borderRadius: 2,
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            {/* Image */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                mb: 2,
                maxHeight: '400px',
                overflow: 'hidden',
              }}
            >
              <img
                src={imageUrl}
                alt={randomImage.title || randomImage.description || 'Artwork'}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  maxHeight: '400px',
                  objectFit: 'contain',
                  borderRadius: '4px',
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </Box>

            {/* Caption */}
            {renderCaption()}

            {/* Show all images button */}
            {onShowAll && (
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  onClick={onShowAll}
                  sx={{
                    color: COLOR_SCHEME.linkColor,
                    borderColor: COLOR_SCHEME.border,
                    '&:hover': {
                      borderColor: COLOR_SCHEME.linkColor,
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    },
                  }}
                >
                  Show all images
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      ) : (
        <Paper
          elevation={0}
          sx={{
            backgroundColor: COLOR_SCHEME.cardBg,
            border: `1px solid ${COLOR_SCHEME.border}`,
            borderRadius: 2,
            p: 3,
            textAlign: 'center'
          }}
        >
          <Typography variant="body1" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
            No images available for this country
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default QuizImageDisplay;
