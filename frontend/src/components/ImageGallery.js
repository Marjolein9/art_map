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
 * @param {boolean} isCollapsed - Whether the collection is collapsed
 * @param {Function} onToggle - Handler for collapse/expand
 * @param {number} currentIndex - Current image index
 * @param {Function} onPrev - Handler for previous image
 * @param {Function} onNext - Handler for next image
 * @param {Function} imageRef - Ref callback for image element
 */
const ImageGallery = ({
  collection,
  images,
  isCollapsed,
  onToggle,
  currentIndex,
  onPrev,
  onNext,
  imageRef
}) => {
  if (!images || images.length === 0) return null;

  const currentImage = images[currentIndex] || images[0];
  const hasMultiple = images.length > 1;

  // Helper function to render collection-specific caption
  const renderCaption = (image, collectionType) => {
    switch(collectionType) {
      case 'Albert Kahn':
        return (
          <>
            {image.title && image.page_url ? (
              <div className="artwork-title">
                <a href={image.page_url} target="_blank" rel="noopener noreferrer">
                  {image.title}
                </a>
              </div>
            ) : image.title ? (
              <div className="artwork-title">{image.title}</div>
            ) : null}
            {image.location && <div className="artwork-location">{image.location}</div>}
            {image.date && <div className="artwork-date">{image.date}</div>}
          </>
        );
      case 'Children in Art':
        return (
          <>
            {image.title && image.work_url ? (
              <div className="artwork-title">
                <a href={image.work_url} target="_blank" rel="noopener noreferrer">
                  {image.title}
                </a>
              </div>
            ) : image.title ? (
              <div className="artwork-title">{image.title}</div>
            ) : null}
            {image.artist_name && (
              <div className="artwork-artist">
                by {image.author_wikilink ? (
                  <a href={image.author_wikilink} target="_blank" rel="noopener noreferrer">
                    {image.artist_name}
                  </a>
                ) : image.artist_name}
                {image.artist_nationality && ` (${image.artist_nationality})`}
              </div>
            )}
          </>
        );
      case 'Public Domain Review':
        return (
          <>
            {image.title && image.source_url ? (
              <div className="artwork-title">
                <a href={image.source_url} target="_blank" rel="noopener noreferrer">
                  {image.title}
                </a>
              </div>
            ) : image.title ? (
              <div className="artwork-title">{image.title}</div>
            ) : null}
            {image.description && image.source_link ? (
              <div className="artwork-location">
                <a href={image.source_link} target="_blank" rel="noopener noreferrer">
                  {image.description}
                </a>
              </div>
            ) : image.description ? (
              <div className="artwork-location">{image.description}</div>
            ) : null}
          </>
        );
      case 'Met Museum':
        return (
          <>
            {image.title && image.object_url ? (
              <div className="artwork-title">
                <a href={image.object_url} target="_blank" rel="noopener noreferrer">
                  {image.title}
                </a>
              </div>
            ) : image.title ? (
              <div className="artwork-title">{image.title}</div>
            ) : null}
            {image.artist_name && <div className="artwork-artist">by {image.artist_name}</div>}
            {image.object_date && <div className="artwork-date">{image.object_date}</div>}
            {image.medium && <div className="artwork-location">{image.medium}</div>}
          </>
        );
      default:
        return <div className="artwork-title">{image.title || 'Untitled'}</div>;
    }
  };

  // Helper function to get collection subtitle with link
  const getCollectionSubtitle = (collectionType) => {
    switch(collectionType) {
      case 'Albert Kahn':
        return (
          <a
            href="https://collections.albert-kahn.hauts-de-seine.fr/"
            target="_blank"
            rel="noopener noreferrer"
            className="collection-subtitle"
          >
            Early 20th century photography collection
          </a>
        );
      case 'Children in Art':
        return (
          <span className="collection-subtitle">
            Historical paintings featuring children
          </span>
        );
      case 'Public Domain Review':
        return (
          <a
            href="https://publicdomainreview.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="collection-subtitle"
          >
            Curated public domain works
          </a>
        );
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
    <div className="artwork-type-section">
      {/* Collection Header - Collapsible */}
      <div
        className="artwork-type-header"
        onClick={onToggle}
        style={{ cursor: 'pointer' }}
      >
        <div>
          <h4 className="artwork-type-title">
            {isCollapsed ? '▶' : '▼'} {collection}
            <span className="artwork-type-count"> ({images.length})</span>
          </h4>
          {getCollectionSubtitle(collection)}
        </div>
      </div>

      {/* Collection Content - Collapsible */}
      {!isCollapsed && (
        <div className="artwork-type-content">
          <div className="artwork-item">
            <div className="artwork-image-container">
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
                  if (img.naturalWidth > 2000 || img.naturalHeight > 2000) {
                    console.warn('Large image detected:', currentImage.filepath,
                      `${img.naturalWidth}x${img.naturalHeight}`);
                  }
                }}
                onError={(e) => {
                  console.log('Failed to load image:', currentImage.filepath);
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
            <div className="artwork-caption">
              {renderCaption(currentImage, collection)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
