import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Link,
  Button,
} from '@mui/material';
import COLOR_SCHEME from '../styles/colorSchemes';
import { API_BASE } from '../utils/apiConfig';

/**
 * QuizImageDisplay Component
 *
 * Displays a single random image from all available collections during quiz mode.
 * Shows only the image and caption, without collection headers.
 *
 * @param {Object} imagesByCollection - Object with collection names as keys and image arrays as values
 * @param {string} countryName - Name of the country
 * @param {Function} onShowAll - Callback to show all images in collections
 */
const QuizImageDisplay = ({ imagesByCollection, countryName, onShowAll }) => {
  const [randomImage, setRandomImage] = useState(null);
  const [collectionName, setCollectionName] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  // Select a random image when imagesByCollection changes
  useEffect(() => {
    if (!imagesByCollection || Object.keys(imagesByCollection).length === 0) {
      setRandomImage(null);
      setCollectionName(null);
      setIsVisible(false);
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
      setIsVisible(false);
      return;
    }

    // Pick a random image
    const randomIndex = Math.floor(Math.random() * allImagesWithCollection.length);
    const selected = allImagesWithCollection[randomIndex];
    setRandomImage(selected.image);
    setCollectionName(selected.collection);

    // Reset visibility and fade in after 2 seconds
    setIsVisible(false);
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [imagesByCollection]);

  if (!randomImage || !collectionName) return null;

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

  const imageUrl = randomImage.filepath.startsWith('http')
    ? randomImage.filepath
    : `${API_BASE}/${randomImage.filepath}`;

  return (
    <Card
      sx={{
        backgroundColor: COLOR_SCHEME.cardBg,
        color: COLOR_SCHEME.text,
        border: `1px solid ${COLOR_SCHEME.border}`,
        boxShadow: 'none',
        borderRadius: 2,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 1s ease-in-out',
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
  );
};

export default QuizImageDisplay;
