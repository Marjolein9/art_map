import { useState, useEffect, useRef } from 'react';
import { Box, Typography, IconButton, Link } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

// Get API base URL from environment variable
// Remove /api suffix to get the base server URL for images
const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api', '');

/**
 * ImageGallery Component (MUI Version)
 *
 * Displays a single image collection with pagination controls.
 * Handles different metadata formats for each collection type.
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
  const [maxHeight, setMaxHeight] = useState(150); // Start with min-height
  const containerRef = useRef(null);

  // Preload all images and calculate max height
  useEffect(() => {
    if (!images || images.length === 0) return;

    // Create image elements to measure natural dimensions
    const imagePromises = images.map((img) => {
      return new Promise((resolve) => {
        const tempImg = new Image();
        tempImg.onload = () => {
          // Calculate display height based on container width
          const containerWidth = containerRef.current?.offsetWidth || 468; // Default width
          const aspectRatio = tempImg.naturalHeight / tempImg.naturalWidth;
          const displayHeight = Math.min(
            containerWidth * aspectRatio,
            600 // max-height from CSS
          );
          resolve(displayHeight);
        };
        tempImg.onerror = () => resolve(150); // Use min-height on error
        tempImg.src = img.filepath.startsWith('http')
          ? img.filepath
          : `${API_BASE}/${img.filepath}`;
      });
    });

    Promise.all(imagePromises).then((heights) => {
      const tallest = Math.max(...heights, 150); // Ensure at least min-height
      setMaxHeight(tallest);
      console.log(`📏 Carousel max height set to ${tallest}px for ${collection}`);
    });
  }, [images, collection]);

  // Early return after all hooks
  if (!images || images.length === 0) return null;

  const currentImage = images[currentIndex] || images[0];
  const hasMultiple = images.length > 1;

  // Helper function to get source institution name and URL
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

  // Helper function to render collection-specific caption
  const renderCaption = (image, collectionType) => {
    switch(collectionType) {
      case 'Albert Kahn':
        return (
          <>
            {image.title && <Typography className="artwork-title">{image.title}</Typography>}
            {image.mission && <Typography className="artwork-location">{image.mission}</Typography>}
            {image.date && <Typography className="artwork-date">{image.date}</Typography>}
            <Typography className="artwork-source">
              {image.page_url ? (
                <Link href={image.page_url} target="_blank" rel="noopener noreferrer">
                  Musée départemental Albert-Kahn
                </Link>
              ) : (
                <Link href="https://albert-kahn.hauts-de-seine.fr/en/" target="_blank" rel="noopener noreferrer">
                  musée départemental Albert-Kahn
                </Link>
              )}
            </Typography>
          </>
        );
      case 'Children in Art':
        const sourceInfo = getSourceInfo(image.source);
        return (
          <>
            {image.title && <Typography className="artwork-title">{image.title}</Typography>}
            {image.artist_name && (
              <Typography className="artwork-artist">
                {image.author_wikilink ? (
                  <Link href={image.author_wikilink} target="_blank" rel="noopener noreferrer">
                    {image.artist_name}
                  </Link>
                ) : (
                  image.artist_name
                )}
                {image.artist_nationality && `, ${image.artist_nationality}`}
              </Typography>
            )}
            {sourceInfo && (
              <Typography className="artwork-source">
                <Link href={image.work_url || sourceInfo.url} target="_blank" rel="noopener noreferrer">
                  {sourceInfo.name}
                </Link>
              </Typography>
            )}
          </>
        );
      case 'Public Domain Review':
        return (
          <>
            {image.description && <Typography className="artwork-location">{image.description}</Typography>}
            {image.source_link && (
              <Typography className="artwork-source">
                <Link href={image.source_link} target="_blank" rel="noopener noreferrer">
                  Source
                </Link>
              </Typography>
            )}
            {image.title && image.source_url && (
              <Typography className="artwork-article">
                Featured in Public Domain Review: <Link href={image.source_url} target="_blank" rel="noopener noreferrer">
                  {image.title}
                </Link>
              </Typography>
            )}
          </>
        );
      case 'Met Museum':
        return (
          <>
            {image.title && <Typography className="artwork-title">{image.title}</Typography>}
            {image.artist_name && (
              <Typography className="artwork-artist">
                {image.artist_name}
                {image.object_date && ` (${image.object_date})`}
              </Typography>
            )}
            {image.culture && <Typography className="artwork-culture">{image.culture}</Typography>}
            <Typography className="artwork-source">
              {image.object_url ? (
                <Link href={image.object_url} target="_blank" rel="noopener noreferrer">
                  Learn more at the Metropolitan Museum of Art
                </Link>
              ) : (
                <Link href="https://www.metmuseum.org/" target="_blank" rel="noopener noreferrer">
                  Learn more at the Metropolitan Museum of Art
                </Link>
              )}
            </Typography>
          </>
        );
      default:
        return <Typography className="artwork-title">{image.title || 'Untitled'}</Typography>;
    }
  };

  // Helper function to get collection title
  const getCollectionTitle = (collectionType) => {
    switch(collectionType) {
      case 'Albert Kahn':
        return "Albert Kahn's Archives of the Planet";
      case 'Children in Art':
        return "Children in Art";
      case 'Public Domain Review':
        return "Public Domain Review";
      case 'Met Museum':
        return "Met Museum";
      default:
        return collectionType;
    }
  };

  // Helper function to get collection subtitle with link
  const getCollectionSubtitle = (collectionType) => {
    switch(collectionType) {
      case 'Albert Kahn':
        return (
          <Link
            href="https://publicdomainreview.org/essay/albert-kahns-archives-of-the-planet/"
            target="_blank"
            rel="noopener noreferrer"
            className="collection-subtitle"
          >
            The Color of Memory
          </Link>
        );
      case 'Children in Art':
        return (
          <Typography component="span" className="collection-subtitle">
            Artists from {countryName || 'this country'}
          </Typography>
        );
      case 'Public Domain Review':
        return null;
      case 'Met Museum':
        return (
          <Link
            href="https://www.metmuseum.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="collection-subtitle"
          >
            Metropolitan Museum of Art collection
          </Link>
        );
      default:
        return null;
    }
  };

  return (
    <Box className="overlay-section">
      {/* Collection Header */}
      <Box className="overlay-section-header">
        <Box>
          <Typography variant="h4" className="overlay-section-title">
            {getCollectionTitle(collection)}
          </Typography>
          {getCollectionSubtitle(collection)}
        </Box>
      </Box>

      {/* Collection Content */}
      <Box className="overlay-section-content">
        <Box className="card-item">
          <Box
            className="artwork-image-container"
            ref={containerRef}
            sx={{ height: `${maxHeight}px` }}
          >
            <img
              key={`${collection}-${currentIndex}`}
              ref={imageRef}
              src={currentImage.filepath.startsWith('http')
                ? currentImage.filepath
                : `${API_BASE}/${currentImage.filepath}`}
              alt={currentImage.title || 'Image'}
              className="artwork-image"
              loading="lazy"
              decoding="async"
              style={{ backgroundColor: '#ddd' }}
              onLoad={(e) => {
                const img = e.target;
                const container = img.parentElement;

                console.log('✅ Image loaded:', {
                  title: currentImage.title || 'Untitled',
                  collection: collection,
                  naturalDimensions: `${img.naturalWidth}x${img.naturalHeight}`,
                  displayedDimensions: `${img.offsetWidth}x${img.offsetHeight}`,
                  containerDimensions: `${container.offsetWidth}x${container.offsetHeight}`,
                  aspectRatio: (img.naturalWidth / img.naturalHeight).toFixed(2),
                  orientation: img.naturalWidth > img.naturalHeight ? 'landscape' : 'portrait'
                });

                if (img.naturalWidth > 2000 || img.naturalHeight > 2000) {
                  console.warn('⚠️ Large image detected:', currentImage.filepath,
                    `${img.naturalWidth}x${img.naturalHeight}`);
                }
              }}
              onError={(e) => {
                const attemptedUrl = currentImage.filepath.startsWith('http')
                  ? currentImage.filepath
                  : `${API_BASE}/${currentImage.filepath}`;

                console.error('❌ Image failed to load:', {
                  title: currentImage.title || 'Untitled',
                  collection: collection,
                  filepath: currentImage.filepath,
                  attemptedUrl: attemptedUrl,
                  apiBase: API_BASE
                });

                // Set placeholder image
                e.target.src = 'data:image/svg+xml,' + encodeURIComponent(`
                  <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
                    <rect fill="#cccccc" width="200" height="200"/>
                    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
                          font-family="Arial, sans-serif" font-size="14" fill="#666666">
                      Image Not Available
                    </text>
                  </svg>
                `);
              }}
            />

            {/* Pagination controls for multiple images */}
            {hasMultiple && (
              <Box className="artwork-pagination">
                <IconButton
                  className="pagination-btn"
                  onClick={onPrev}
                  size="small"
                  title="Previous"
                >
                  <ChevronLeftIcon fontSize="small" />
                </IconButton>
                <Typography className="pagination-info">
                  {currentIndex + 1} / {images.length}
                </Typography>
                <IconButton
                  className="pagination-btn"
                  onClick={onNext}
                  size="small"
                  title="Next"
                >
                  <ChevronRightIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
          </Box>

          {/* Image metadata/caption */}
          <Box className="overlay-caption">
            {renderCaption(currentImage, collection)}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ImageGallery;
