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
 * @param {number} totalImagesAvailable - Total number of images available (from parent)
 * @param {boolean} showMap - Whether to show the map (default: true)
 * @param {boolean} hideNoImagesMessage - Whether to hide "No images available" message (default: false)
 */
const QuizImageDisplay = ({ imagesByCollection, countryName, countryISO, onShowAll, totalImagesAvailable = 0, showMap = true, hideNoImagesMessage = false, hideMainTitle = false }) => {
  const [randomImage, setRandomImage] = useState(null);
  const [collectionName, setCollectionName] = useState(null);
  const [neighbors, setNeighbors] = useState([]);
  const [loadingNeighbors, setLoadingNeighbors] = useState(false);
  const [geoData, setGeoData] = useState(null);
  const [targetCountryFeature, setTargetCountryFeature] = useState(null);
  const [neighborFeatures, setNeighborFeatures] = useState([]);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Trigger fade-in immediately on mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Select a random image when imagesByCollection changes
  useEffect(() => {
    if (!imagesByCollection || Object.keys(imagesByCollection).length === 0) {
      setRandomImage(null);
      setCollectionName(null);
      // If no images, set loaded to true so map can still be visible
      setImageLoaded(true);
      return;
    }

    // Truly random selection: flatten all images from all collections
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
      // If no images, set loaded to true so map can still be visible
      setImageLoaded(true);
      return;
    }

    // Pick a truly random image from all collections
    const randomIndex = Math.floor(Math.random() * allImagesWithCollection.length);
    const selected = allImagesWithCollection[randomIndex];
    setRandomImage(selected.image);
    setCollectionName(selected.collection);
    // Reset image loaded state when new image is selected
    setImageLoaded(false);
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
        // Fetch neighbor data and filter out France and Russia
        const neighborData = await fetchNeighbors(countryISO);
        const filteredNeighbors = (neighborData || []).filter(n => n.iso3 !== 'FRA' && n.iso3 !== 'RUS');
        setNeighbors(filteredNeighbors);

        // Find target country feature
        const targetFeature = geoData.features.find(f => getCountryIsoCode(f) === countryISO);
        setTargetCountryFeature(targetFeature);

        // Find neighbor features (excluding France and Russia)
        const neighborISO3s = filteredNeighbors.map(n => n.iso3);
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

  // Helper function to map source field to display names
  const getSourceDisplayName = (source) => {
    const mapping = {
      'wiki commons': 'Wikimedia Commons',
      'chicago': 'Art Institute of Chicago',
      'smithsonian': 'Smithsonian American Art Museum'
    };
    return mapping[source?.toLowerCase()] || source;
  };

  // Helper function to get source URL for Children in Art
  const getSourceUrl = (source) => {
    const mapping = {
      'wiki commons': 'https://commons.wikimedia.org/',
      'chicago': 'https://www.artic.edu/',
      'smithsonian': 'https://www.si.edu/'
    };
    return mapping[source?.toLowerCase()] || null;
  };

  // Helper function to get image link URL based on collection type
  const getImageLinkUrl = () => {
    if (!randomImage || !collectionName) return null;

    switch(collectionName) {
      case 'Albert Kahn':
        return randomImage.page_url;
      case 'Children in Art':
        return randomImage.work_url;
      case 'Public Domain Review':
        return randomImage.source_url;
      case 'Met Museum':
      case 'Metropolitan Museum of Art':
        return randomImage.object_url;
      default:
        return null;
    }
  };

  // Helper function to get type subtitle based on collection
  const getTypeSubtitle = (collection) => {
    switch(collection) {
      case 'Albert Kahn':
        return 'Historical Photograph';
      case 'Public Domain Review':
        return 'Public Domain Review';
      case 'Met Museum':
      case 'Metropolitan Museum of Art':
        return 'Museum Artwork';
      case 'Children in Art':
        return 'Children Depicted in Art';
      default:
        return null;
    }
  };

  const renderCaption = () => {
    const displayName = getCollectionDisplayName(collectionName);

    // Unified caption rendering with all metadata in one block
    const renderImageCaption = () => {
      switch(displayName) {
        case 'Albert Kahn':
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {/* Title (linked to page_url) */}
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
              {/* Mission (plain text, no hyperlink) */}
              {randomImage.mission && (
                <Typography variant="body2">
                  {randomImage.mission}
                </Typography>
              )}
              {/* Organization (always link to homepage) */}
              <Link
                href="https://albert-kahn.hauts-de-seine.fr/en/"
                target="_blank"
                rel="noopener noreferrer"
                variant="body2"
                sx={{ color: COLOR_SCHEME.linkColor, textDecoration: 'underline' }}
              >
                Musée départemental Albert-Kahn
              </Link>
            </Box>
          );

        case 'Metropolitan Museum of Art':
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {/* Title (linked to object_url) */}
              {randomImage.title && (
                <Link
                  href={randomImage.object_url || 'https://www.metmuseum.org/exhibitions'}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="body2"
                  sx={{ color: COLOR_SCHEME.linkColor, textDecoration: 'underline' }}
                >
                  {randomImage.title}
                </Link>
              )}
              {/* Artist/Culture, Date (combined on one line) */}
              {(randomImage.artist_name || randomImage.culture || randomImage.object_date) && (
                <Typography variant="body2">
                  {randomImage.artist_name || randomImage.culture}
                  {randomImage.object_date && (randomImage.artist_name || randomImage.culture ? `, ${randomImage.object_date}` : randomImage.object_date)}
                </Typography>
              )}
              {/* Medium */}
              {randomImage.medium && (
                <Typography variant="body2">
                  {randomImage.medium}
                </Typography>
              )}
              {/* Organization (link to exhibitions page) */}
              <Link
                href="https://www.metmuseum.org/exhibitions"
                target="_blank"
                rel="noopener noreferrer"
                variant="body2"
                sx={{ color: COLOR_SCHEME.linkColor, textDecoration: 'underline' }}
              >
                Metropolitan Museum of Art
              </Link>
            </Box>
          );

        case 'Children in Art':
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {/* Title (linked to work_url) */}
              {randomImage.title && randomImage.work_url && (
                <Link
                  href={randomImage.work_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="body2"
                  sx={{ color: COLOR_SCHEME.linkColor, textDecoration: 'underline' }}
                >
                  {randomImage.title}
                </Link>
              )}
              {/* Artist Name (Nationality) - parentheses, not comma */}
              {randomImage.artist_name && (
                <Typography variant="body2">
                  {randomImage.author_wikilink ? (
                    <Link
                      href={randomImage.author_wikilink}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ color: COLOR_SCHEME.linkColor, textDecoration: 'underline' }}
                    >
                      {randomImage.artist_name}
                    </Link>
                  ) : (
                    randomImage.artist_name
                  )}
                  {randomImage.artist_nationality && ` (${randomImage.artist_nationality})`}
                </Typography>
              )}
              {/* via Source Name (with hyperlink) */}
              {randomImage.source && getSourceUrl(randomImage.source) && (
                <Typography variant="body2">
                  via{' '}
                  <Link
                    href={getSourceUrl(randomImage.source)}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ color: COLOR_SCHEME.linkColor, textDecoration: 'underline' }}
                  >
                    {getSourceDisplayName(randomImage.source)}
                  </Link>
                </Typography>
              )}
            </Box>
          );

        case 'Public Domain Review':
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {/* Description with Source link to source_link */}
              {randomImage.description && (
                <Typography variant="body2">
                  {randomImage.description}
                  {randomImage.source_link && (
                    <>
                      {' - '}
                      <Link
                        href={randomImage.source_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ color: COLOR_SCHEME.linkColor, textDecoration: 'underline' }}
                      >
                        Source
                      </Link>
                    </>
                  )}
                </Typography>
              )}
              {/* Title with Source link to source_url */}
              {randomImage.title && (
                <Typography variant="body2">
                  {randomImage.title}
                  {randomImage.source_url && (
                    <>
                      {' - '}
                      <Link
                        href={randomImage.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ color: COLOR_SCHEME.linkColor, textDecoration: 'underline' }}
                      >
                        Source
                      </Link>
                    </>
                  )}
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

    // Add 5% padding
    const lngPadding = (maxLng - minLng) * 0.05;
    const latPadding = (maxLat - minLat) * 0.05;

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
  const baseMapWidth = 250;
  let baseMapHeight = 250;

  if (bounds) {
    const lngRange = bounds.maxLng - bounds.minLng;
    const latRange = bounds.maxLat - bounds.minLat;
    const aspectRatio = latRange / lngRange;

    // Calculate height to maintain aspect ratio
    baseMapHeight = Math.round(baseMapWidth * aspectRatio);

    // Clamp height between 125 and 350 for reasonable sizes
    baseMapHeight = Math.max(125, Math.min(350, baseMapHeight));
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
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      opacity: isMounted ? 1 : 0,
      transition: 'opacity 0.3s ease-in-out',
    }}>
      {/* Map View Section - Only show if showMap prop is true */}
      {showMap && (
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
              width: { xs: '100%', sm: 250 },
              maxWidth: 250,
              height: { xs: 'auto', sm: 250 },
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
              width: { xs: '100%', sm: 250 },
              maxWidth: 250,
              height: 250,
              overflow: 'hidden',
              borderRadius: 1
            }}>
              <svg
                viewBox={`0 0 ${baseMapWidth} ${baseMapHeight}`}
                preserveAspectRatio="xMidYMid meet"
                style={{
                  width: '100%',
                  height: '100%',
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
            </Box>
          )}
        </Box>
      </Paper>
      )}

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
            {/* Type Subtitle */}
            {collectionName && getTypeSubtitle(collectionName) && (
              <Box
                sx={{
                  mb: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                }}
              >
                <Typography sx={{ fontSize: '1rem', color: COLOR_SCHEME.text }}>
                  {!hideMainTitle && onShowAll && <span style={{ fontWeight: 'normal' }}>Random Image: </span>}
                  <span style={{ fontWeight: 600 }}>{getTypeSubtitle(collectionName)}</span>
                </Typography>
                {onShowAll && (
                  <Button
                    variant="outlined"
                    size="small"
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
                    Show all ({totalImagesAvailable})
                  </Button>
                )}
              </Box>
            )}
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
              {getImageLinkUrl() ? (
                <Link
                  href={getImageLinkUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ display: 'flex', justifyContent: 'center' }}
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
                      cursor: 'pointer',
                    }}
                    onLoad={() => {
                      setImageLoaded(true);
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </Link>
              ) : (
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
                  onLoad={() => {
                    setImageLoaded(true);
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              )}
            </Box>

            {/* Caption */}
            {renderCaption()}
          </CardContent>
        </Card>
      ) : !hideNoImagesMessage ? (
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
      ) : null}
    </Box>
  );
};

export default QuizImageDisplay;
