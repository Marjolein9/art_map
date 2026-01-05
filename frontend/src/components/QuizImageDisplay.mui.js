import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Link,
  Button,
  Paper,
} from '@mui/material';
import COLOR_SCHEME from '../styles/colorSchemes';
import { API_BASE } from '../utils/apiConfig';
import {
  getSourceInfo,
  getSourceDisplayName,
  getSourceUrl
} from '../utils/sourceHelpers';

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
  const [isMounted, setIsMounted] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Trigger fade-in after 0.5s delay on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Reset error states when country or image changes
  useEffect(() => {
    setMapError(false);
    setImageError(false);
  }, [countryISO, randomImage]);

  // Select a random image when imagesByCollection changes
  useEffect(() => {
    if (!imagesByCollection || Object.keys(imagesByCollection).length === 0) {
      setRandomImage(null);
      setCollectionName(null);
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
      return;
    }

    // Pick a truly random image from all collections
    const randomIndex = Math.floor(Math.random() * allImagesWithCollection.length);
    const selected = allImagesWithCollection[randomIndex];
    setRandomImage(selected.image);
    setCollectionName(selected.collection);
  }, [imagesByCollection]);

  const hasImages = randomImage && collectionName;

  // Source mapping functions imported from shared utility

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
              {/* License information */}
              {randomImage.license === 'Librement réutilisable (CC-BY-4.0)' && (
                <Typography variant="body2">
                  CC-BY-4.0
                </Typography>
              )}
              {randomImage.license === 'No known copyright restrictions' && (
                <Typography variant="body2">
                  No known copyright restrictions
                </Typography>
              )}
              {/* Organization (conditionally display based on license) */}
              {randomImage.license !== 'No known copyright restrictions' && (
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

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      opacity: isMounted ? 1 : 0,
      transition: 'opacity 0.5s ease-in-out',
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
            {/* Map Box - Load pre-generated SVG from backend */}
            <Box sx={{
              position: 'relative',
              width: { xs: '100%', sm: 180 },
              maxWidth: 180,
              height: 130,
              overflow: 'hidden',
              borderRadius: 1
            }}>
              {!mapError ? (
                <img
                  src={`${API_BASE}/api/maps/${countryISO}`}
                  alt={`Map of ${countryName}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'block'
                  }}
                  onError={() => setMapError(true)}
                />
              ) : (
                <Box sx={{
                  display: 'flex',
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#e8f4f8',
                  border: `2px solid ${COLOR_SCHEME.border}`,
                  borderRadius: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  color: '#666'
                }}>
                  Map not available
                </Box>
              )}
            </Box>
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
                maxHeight: '600px',
                overflow: 'hidden',
              }}
            >
              {!imageError ? (
                getImageLinkUrl() ? (
                  <Link
                    href={getImageLinkUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}
                  >
                    <img
                      src={imageUrl}
                      alt={randomImage.title || randomImage.description || 'Artwork'}
                      style={{
                        width: '100%',
                        height: 'auto',
                        maxHeight: '600px',
                        objectFit: 'contain',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                      onLoad={() => {}}
                      onError={() => setImageError(true)}
                    />
                  </Link>
                ) : (
                  <img
                    src={imageUrl}
                    alt={randomImage.title || randomImage.description || 'Artwork'}
                    style={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: '600px',
                      objectFit: 'contain',
                      borderRadius: '4px',
                    }}
                    onLoad={() => {}}
                    onError={() => setImageError(true)}
                  />
                )
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    minHeight: '200px',
                    backgroundColor: '#f5f5f5',
                    border: `2px solid ${COLOR_SCHEME.border}`,
                    borderRadius: '4px',
                    color: '#666',
                  }}
                >
                  Image unavailable
                </Box>
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
