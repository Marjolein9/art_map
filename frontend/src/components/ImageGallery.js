import { useState, useEffect, useRef } from 'react';
import COLOR_SCHEME from '../styles/colorSchemes';

// Get API base URL from environment variable
// Remove /api suffix to get the base server URL for images
const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api', '');

/**
 * ImageGallery Component
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
            {image.title && <div className="artwork-title">{image.title}</div>}
            {image.mission && <div className="artwork-location">{image.mission}</div>}
            {image.date && <div className="artwork-date">{image.date}</div>}
            <div className="artwork-source">
              {image.page_url ? (
                <a href={image.page_url} target="_blank" rel="noopener noreferrer">
                  Musée départemental Albert-Kahn
                </a>
              ) : (
                <a href="https://albert-kahn.hauts-de-seine.fr/en/" target="_blank" rel="noopener noreferrer">
                  musée départemental Albert-Kahn
                </a>
              )}
            </div>
          </>
        );
      case 'Children in Art':
        const sourceInfo = getSourceInfo(image.source);
        return (
          <>
            {image.title && <div className="artwork-title">{image.title}</div>}
            {image.artist_name && (
              <div className="artwork-artist">
                
                {image.author_wikilink ? (
                  <a href={image.author_wikilink} target="_blank" rel="noopener noreferrer">
                    {image.artist_name}
                  </a>
                ) : (
                  image.artist_name
                )}
                {image.artist_nationality && `, ${image.artist_nationality}`}
              </div>
            )}
            {sourceInfo && (
              <div className="artwork-source">
                <a href={image.work_url || sourceInfo.url} target="_blank" rel="noopener noreferrer">
                  {sourceInfo.name}
                </a>
              </div>
            )}
          </>
        );
      case 'Public Domain Review':
        return (
          <>
            {image.description && <div className="artwork-location">{image.description}</div>}
            {image.source_link && (
              <div className="artwork-source">
                <a href={image.source_link} target="_blank" rel="noopener noreferrer">
                  Source
                </a>
              </div>
            )}
            {image.title && image.source_url && (
              <div className="artwork-article">
                Featured in Public Domain Review: <a href={image.source_url} target="_blank" rel="noopener noreferrer">
                  {image.title}
                </a>
              </div>
            )}
          </>
        );
      case 'Met Museum':
        return (
          <>
            {image.title && <div className="artwork-title">{image.title}</div>}
            {image.artist_name && (
              <div className="artwork-artist">
                {image.artist_name}
                {image.object_date && ` (${image.object_date})`}
              </div>
            )}
            {image.culture && <div className="artwork-culture">{image.culture}</div>}
            <div className="artwork-source">
              {image.object_url ? (
                <a href={image.object_url} target="_blank" rel="noopener noreferrer">
                  Learn more at the Metropolitan Museum of Art
                </a>
              ) : (
                <a href="https://www.metmuseum.org/" target="_blank" rel="noopener noreferrer">
                  Learn more at the Metropolitan Museum of Art
                </a>
              )}
            </div>
          </>
        );
      default:
        return <div className="artwork-title">{image.title || 'Untitled'}</div>;
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
          <a
            href="https://publicdomainreview.org/essay/albert-kahns-archives-of-the-planet/"
            target="_blank"
            rel="noopener noreferrer"
            className="collection-subtitle"
          >
            The Color of Memory
          </a>
        );
      case 'Children in Art':
        return (
          <span className="collection-subtitle">
            Artists from {countryName || 'this country'}
          </span>
        );
      case 'Public Domain Review':
        return null;
      case 'Met Museum':
        return (
          <a
            href="https://www.metmuseum.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="collection-subtitle"
          >
            Metropolitan Museum of Art collection
          </a>
        );
      default:
        return null;
    }
  };

  return (
    <div className="overlay-section">
      {/* Collection Header */}
      <div className="overlay-section-header">
        <div>
          <h4 className="overlay-section-title">
            {getCollectionTitle(collection)}
          </h4>
          {getCollectionSubtitle(collection)}
        </div>
      </div>

      {/* Collection Content */}
      <div className="overlay-section-content">
          <div className="card-item">
            <div
              className="artwork-image-container"
              ref={containerRef}
              style={{ height: `${maxHeight}px` }}
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
                style={{ backgroundColor: COLOR_SCHEME.bgSecondary }}
                onLoad={(e) => {
                  const img = e.target;
                  const container = img.parentElement;

                  // Log successful load with dimensions
                  const loadedUrl = currentImage.filepath.startsWith('http')
                    ? currentImage.filepath
                    : `${API_BASE}/${currentImage.filepath}`;

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
                  // Log detailed error information for debugging
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
                      <rect fill={COLOR_SCHEME.borderSecondary} width="200" height="200"/>
                      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
                            font-family="Arial, sans-serif" font-size="14" fill={COLOR_SCHEME.textSecondary}>
                        Image Not Available
                      </text>
                    </svg>
                  `);
                }}
              />

              {/* Pagination controls for multiple images */}
              {hasMultiple && (
                <div className="artwork-pagination">
                  <button
                    className="pagination-btn"
                    onClick={onPrev}
                    title="Previous"
                  >
                    ◀
                  </button>
                  <span className="pagination-info">
                    {currentIndex + 1} / {images.length}
                  </span>
                  <button
                    className="pagination-btn"
                    onClick={onNext}
                    title="Next"
                  >
                    ▶
                  </button>
                </div>
              )}
            </div>

            {/* Image metadata/caption */}
            <div className="overlay-caption">
              {renderCaption(currentImage, collection)}
            </div>
          </div>
      </div>
    </div>
  );
};

export default ImageGallery;
