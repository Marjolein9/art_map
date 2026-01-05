import { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Box,
  Typography,
  Link,
  IconButton
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import COLOR_SCHEME from '../styles/colorSchemes';
import { API_BASE } from '../utils/apiConfig';
import { debug, warn, error as logError } from '../utils/logger';
import {
  getSourceInfo as getSourceInfoUtil,
  getSourceDisplayName as getSourceDisplayNameUtil,
  getSourceUrl as getSourceUrlUtil
} from '../utils/sourceHelpers';

/**
 * ImageGallery Component (MUI Version)
 *
 * Displays a single image collection with pagination controls.
 * Handles different metadata formats for each collection type.
 *
 * @param {string} collection - Collection name
 * @param {Array} images - Array of image objects
 * @param {string} countryName - Name of the country (for Children in Art subtitle)
 * @param {number} currentIndex - Current image index
 * @param {Function} onPrev - Handler for previous image
 * @param {Function} onNext - Handler for next image
 * @param {Function} imageRef - Ref callback for image element
 */
const ImageGallery = ({
  collection,
  images,
  countryName,
  currentIndex,
  onPrev,
  onNext,
  imageRef
}) => {
  const [maxHeight, setMaxHeight] = useState(150);
  const containerRef = useRef(null);

  // Preload all images and calculate max height
  useEffect(() => {
    if (!images || images.length === 0) return;

    const imagePromises = images.map((img) => {
      return new Promise((resolve) => {
        const tempImg = new Image();
        tempImg.onload = () => {
          const containerWidth = containerRef.current?.offsetWidth || 468;
          const aspectRatio = tempImg.naturalHeight / tempImg.naturalWidth;
          const displayHeight = Math.min(
            containerWidth * aspectRatio,
            600
          );
          resolve(displayHeight);
        };
        tempImg.onerror = () => resolve(150);
        tempImg.src = img.filepath.startsWith('http')
          ? img.filepath
          : `${API_BASE}/${img.filepath}`;
      });
    });

    Promise.all(imagePromises).then((heights) => {
      const tallest = Math.max(...heights, 150);
      setMaxHeight(tallest);
      debug(`📏 Carousel max height set to ${tallest}px for ${collection}`);
    });
  }, [images, collection]);

  if (!images || images.length === 0) return null;

  const currentImage = images[currentIndex] || images[0];
  const hasMultiple = images.length > 1;

  // Use shared utility functions for source mapping
  const getSourceInfo = getSourceInfoUtil;
  const getSourceDisplayName = getSourceDisplayNameUtil;
  const getSourceUrl = getSourceUrlUtil;

  // Helper function to get type subtitle based on collection
  const getTypeSubtitle = (collectionType) => {
    switch(collectionType) {
      case 'Albert Kahn':
        return 'Historical Photograph';
      case 'Public Domain Review':
        return 'Public Domain Review';
      case 'Met Museum':
        return 'Museum Artwork';
      case 'Children in Art':
        return `Artists from ${countryName || 'this country'}`;
      default:
        return null;
    }
  };

  const renderCaption = (image, collectionType) => {
    switch(collectionType) {
      case 'Albert Kahn':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {/* Title (linked to page_url) */}
            {image.title && image.page_url && (
             <Link
                href={image.page_url}
                target="_blank"
                rel="noopener noreferrer"
                variant="body2"
                sx={{ color: COLOR_SCHEME.linkColor, textDecoration: 'underline' }}
              >
               {image.title}
              </Link>
            )}
            {/* Location, Date (combined on one line) */}
            {(image.location || image.date) && (
              <Typography variant="body2" sx={{ color: COLOR_SCHEME.textPrimary }}>
                {image.location && image.date
                  ? `${image.location}, ${image.date}`
                  : image.location || image.date}
              </Typography>
            )}
            {/* Mission (plain text, no hyperlink) */}
            {image.mission && (
              <Typography variant="body2" sx={{ color: COLOR_SCHEME.textPrimary }}>
                {image.mission}
              </Typography>
            )}
            {/* License information */}
            {image.license === 'Librement réutilisable (CC-BY-4.0)' && (
              <Typography variant="body2" sx={{ color: COLOR_SCHEME.textPrimary }}>
                CC-BY-4.0
              </Typography>
            )}
            {image.license === 'No known copyright restrictions' && (
              <Typography variant="body2" sx={{ color: COLOR_SCHEME.textPrimary }}>
                No known copyright restrictions
              </Typography>
            )}
            {/* Organization (conditionally display based on license) */}
            {image.license !== 'No known copyright restrictions' && (
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
      case 'Children in Art':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {/* Title (linked to work_url) */}
            {image.title && image.work_url && (
              <Link
                href={image.work_url}
                target="_blank"
                rel="noopener noreferrer"
                variant="body2"
                sx={{ color: COLOR_SCHEME.linkColor, textDecoration: 'underline' }}
              >
                {image.title}
              </Link>
            )}
            {/* Artist Name (Nationality) - parentheses, not comma */}
            {image.artist_name && (
              <Typography variant="body2" sx={{ color: COLOR_SCHEME.textPrimary }}>
                {image.author_wikilink ? (
                  <Link
                    href={image.author_wikilink}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ color: COLOR_SCHEME.linkColor, textDecoration: 'underline' }}
                  >
                    {image.artist_name}
                  </Link>
                ) : (
                  image.artist_name
                )}
                {image.artist_nationality && ` (${image.artist_nationality})`}
              </Typography>
            )}
            {/* via Source Name (with hyperlink) */}
            {image.source && getSourceUrl(image.source) && (
              <Typography variant="body2" sx={{ color: COLOR_SCHEME.textPrimary }}>
                via{' '}
                <Link
                  href={getSourceUrl(image.source)}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ color: COLOR_SCHEME.linkColor, textDecoration: 'underline' }}
                >
                  {getSourceDisplayName(image.source)}
                </Link>
              </Typography>
            )}
          </Box>
        );
      case 'Public Domain Review':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {/* Description (plain text, NOT linked) */}
            {image.description && (
              <Typography variant="body2" sx={{ color: COLOR_SCHEME.textPrimary }}>
                {image.description}
              </Typography>
            )}
            {/* Source - Public Domain Review: Title (source and PDR linked, title plain text) */}
            <Typography variant="body2" sx={{ color: COLOR_SCHEME.textPrimary }}>
              {image.source_link && (
                <>
                  <Link
                    href={image.source_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ color: COLOR_SCHEME.linkColor, textDecoration: 'underline' }}
                  >
                    Source
                  </Link>
                  {' - '}
                </>
              )}
              {image.source_url && (
                <Link
                  href={image.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ color: COLOR_SCHEME.linkColor, textDecoration: 'underline' }}
                >
                  Public Domain Review
                </Link>
              )}
              {image.title && `: ${image.title}`}
            </Typography>
          </Box>
        );
      case 'Met Museum':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {/* Title (linked to object_url) */}
            {image.title && (
              <Link
                href={image.object_url || 'https://www.metmuseum.org/exhibitions'}
                target="_blank"
                rel="noopener noreferrer"
                variant="body2"
                sx={{ color: COLOR_SCHEME.linkColor, textDecoration: 'underline' }}
              >
                {image.title}
              </Link>
            )}
            {/* Artist/Culture, Date (combined on one line) */}
            {(image.artist_name || image.culture || image.object_date) && (
              <Typography variant="body2" sx={{ color: COLOR_SCHEME.textPrimary }}>
                {image.artist_name || image.culture}
                {image.object_date && (image.artist_name || image.culture ? `, ${image.object_date}` : image.object_date)}
              </Typography>
            )}
            {/* Medium */}
            {image.medium && (
              <Typography variant="body2" sx={{ color: COLOR_SCHEME.textPrimary }}>
                {image.medium}
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
      default:
        return (
          <Typography variant="body2" sx={{ color: COLOR_SCHEME.textPrimary }}>
            {image.title || 'Untitled'}
          </Typography>
        );
    }
  };

  const getCollectionTitle = (collectionType) => {
    // All images are public domain, so show unified title based on count
    return images.length === 1 ? 'A Public Domain Image:' : 'All Public Domain Images';
  };

  const getCollectionSubtitle = (collectionType) => {
    const subtitle = getTypeSubtitle(collectionType);
    if (!subtitle) return null;

    return (
      <Typography variant="body2" sx={{ color: COLOR_SCHEME.textPrimary }}>
        {subtitle}
      </Typography>
    );
  };

  // Get the appropriate link URL for the image based on collection type
  const getImageLinkUrl = (image, collectionType) => {
    switch(collectionType) {
      case 'Albert Kahn':
        return image.page_url || null;
      case 'Children in Art':
        return image.work_url || null;
      case 'Public Domain Review':
        return image.source_url || null;
      case 'Met Museum':
        return image.object_url || null;
      default:
        return null;
    }
  };

  return (
    <Card sx={{ borderRadius: 1, backgroundColor: COLOR_SCHEME.bgPrimary }}>
      <CardHeader
        title={getCollectionTitle(collection)}
        subheader={getCollectionSubtitle(collection)}
        titleTypographyProps={{ variant: 'h6', sx: { fontWeight: 600, color: COLOR_SCHEME.textPrimary } }}
        sx={{
          backgroundColor: COLOR_SCHEME.bgSecondary,
          borderBottom: `1px solid ${COLOR_SCHEME.borderSecondary}`,
          padding: 2,
          textAlign: 'center'
        }}
      />

      <CardContent sx={{ padding: 2 }}>
        <Box
          ref={containerRef}
          sx={{
            position: 'relative',
            width: '100%',
            height: `${maxHeight}px`,
            minHeight: '150px',
            maxHeight: '600px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: COLOR_SCHEME.bgPrimary,
            borderRadius: 1,
            marginBottom: 2,
            overflow: 'visible'
          }}
        >
          <a
            href={getImageLinkUrl(currentImage, collection)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%'
            }}
          >
            <img
              key={`${collection}-${currentIndex}`}
              ref={imageRef}
              src={currentImage.filepath.startsWith('http')
                ? currentImage.filepath
                : `${API_BASE}/${currentImage.filepath}`}
              alt={currentImage.title || 'Image'}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                width: 'auto',
                height: 'auto',
                display: 'block',
                borderRadius: '4px',
                objectFit: 'contain',
                backgroundColor: COLOR_SCHEME.bgSecondary
              }}
              loading="lazy"
              decoding="async"
              onLoad={(e) => {
                const img = e.target;
                const container = img.parentElement.parentElement;
                const loadedUrl = currentImage.filepath.startsWith('http')
                  ? currentImage.filepath
                  : `${API_BASE}/${currentImage.filepath}`;

                debug('✅ Image loaded:', {
                  title: currentImage.title || 'Untitled',
                  collection: collection,
                  naturalDimensions: `${img.naturalWidth}x${img.naturalHeight}`,
                  displayedDimensions: `${img.offsetWidth}x${img.offsetHeight}`,
                  containerDimensions: `${container.offsetWidth}x${container.offsetHeight}`,
                  aspectRatio: (img.naturalWidth / img.naturalHeight).toFixed(2),
                  orientation: img.naturalWidth > img.naturalHeight ? 'landscape' : 'portrait'
                });

                if (img.naturalWidth > 2000 || img.naturalHeight > 2000) {
                  warn('⚠️ Large image detected:', currentImage.filepath,
                    `${img.naturalWidth}x${img.naturalHeight}`);
                }
              }}
              onError={(e) => {
                const attemptedUrl = currentImage.filepath.startsWith('http')
                  ? currentImage.filepath
                  : `${API_BASE}/${currentImage.filepath}`;

                logError('❌ Image failed to load:', {
                  title: currentImage.title || 'Untitled',
                  collection: collection,
                  filepath: currentImage.filepath,
                  attemptedUrl: attemptedUrl,
                  apiBase: API_BASE
                });

                e.target.src = 'data:image/svg+xml,' + encodeURIComponent(`
                  <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
                    <rect fill="${COLOR_SCHEME.borderSecondary}" width="200" height="200"/>
                    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
                          font-family="Arial, sans-serif" font-size="14" fill="${COLOR_SCHEME.textSecondary}">
                      Image Not Available
                    </text>
                  </svg>
                `);
              }}
            />
          </a>

          {/* Pagination controls */}
          {hasMultiple && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 20,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                backgroundColor: COLOR_SCHEME.bgPrimary,
                padding: '8px 15px',
                borderRadius: 3,
                backdropFilter: 'blur(10px)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
              }}
            >
              <IconButton
                onClick={onPrev}
                title="Previous"
                size="small"
                sx={{
                  color: COLOR_SCHEME.textPrimary,
                  '&:hover': {
                    backgroundColor: COLOR_SCHEME.bgSecondary
                  }
                }}
              >
                <ChevronLeftIcon />
              </IconButton>
              <Typography
                variant="body2"
                sx={{
                  minWidth: '50px',
                  textAlign: 'center',
                  fontWeight: 600,
                  color: COLOR_SCHEME.textPrimary
                }}
              >
                {currentIndex + 1} / {images.length}
              </Typography>
              <IconButton
                onClick={onNext}
                title="Next"
                size="small"
                sx={{
                  color: COLOR_SCHEME.textPrimary,
                  '&:hover': {
                    backgroundColor: COLOR_SCHEME.bgSecondary
                  }
                }}
              >
                <ChevronRightIcon />
              </IconButton>
            </Box>
          )}
        </Box>

        {/* Image caption */}
        <Box sx={{ padding: 1, backgroundColor: COLOR_SCHEME.bgSecondary, borderRadius: 1, textAlign: 'center' }}>
          {renderCaption(currentImage, collection)}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ImageGallery;
