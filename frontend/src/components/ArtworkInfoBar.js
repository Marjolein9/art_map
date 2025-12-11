import { useState, useEffect, useRef } from 'react';
import { fetchImages } from '../services/api';

const ArtworkInfoBar = ({ countryISO, countryName, colors, mode, answerSubmitted, isCorrectAnswer, onClose, onNext }) => {
  const [imagesByCollection, setImagesByCollection] = useState({});
  const [loading, setLoading] = useState(false);
  const [collapsedTypes, setCollapsedTypes] = useState({});
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const imageRefs = useRef({});

  // Fetch images from API when country changes
  useEffect(() => {
    if (!countryISO || countryISO === null) {
      setImagesByCollection({});
      return;
    }

    setLoading(true);
    fetchImages(countryISO)
      .then(data => {
        // Data is already grouped by collection type from backend
        // Filter out empty collections
        const filtered = {};
        Object.entries(data).forEach(([collection, images]) => {
          if (images && images.length > 0) {
            filtered[collection] = images;
          }
        });

        setImagesByCollection(filtered);
        setLoading(false);

        // Initialize current image index for each collection to 0
        const initialIndex = {};
        Object.keys(filtered).forEach(collection => {
          initialIndex[collection] = 0;
        });
        setCurrentImageIndex(initialIndex);

        console.log('🖼️  Fetched images for', countryISO, ':', {
          collections: Object.keys(filtered),
          counts: Object.entries(filtered).map(([type, items]) => `${type}: ${items.length}`)
        });
      })
      .catch(err => {
        console.error('Error fetching images:', err);
        setImagesByCollection({});
        setLoading(false);
      });
  }, [countryISO]);

  // Toggle type collapse
  const toggleTypeCollapse = (type) => {
    setCollapsedTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  // Navigate to next image for a collection
  const nextImage = (collection) => {
    const images = imagesByCollection[collection];
    if (!images) return;

    // Cleanup current image before switching
    if (imageRefs.current[collection]) {
      const img = imageRefs.current[collection];
      img.src = '';
    }

    setCurrentImageIndex(prev => ({
      ...prev,
      [collection]: (prev[collection] + 1) % images.length
    }));
  };

  // Navigate to previous image for a collection
  const prevImage = (collection) => {
    const images = imagesByCollection[collection];
    if (!images) return;

    // Cleanup current image before switching
    if (imageRefs.current[collection]) {
      const img = imageRefs.current[collection];
      img.src = '';
    }

    setCurrentImageIndex(prev => ({
      ...prev,
      [collection]: (prev[collection] - 1 + images.length) % images.length
    }));
  };

  // Cleanup all images when country changes
  useEffect(() => {
    return () => {
      // Force cleanup of all images to prevent memory leaks
      Object.keys(imageRefs.current).forEach(collection => {
        if (imageRefs.current[collection]) {
          const img = imageRefs.current[collection];
          img.src = '';
          img.removeAttribute('src');
        }
      });
      imageRefs.current = {};
    };
  }, [countryISO]);

  // Helper function to generate caption based on collection type
  const generateCaption = (collection, image) => {
    switch(collection) {
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
            {image.title && image.public_domain_url ? (
              <div className="artwork-title">
                <a href={image.public_domain_url} target="_blank" rel="noopener noreferrer">
                  {image.title}
                </a>
              </div>
            ) : image.title ? (
              <div className="artwork-title">{image.title}</div>
            ) : null}
            {image.image_info && image.source_link ? (
              <div className="artwork-location">
                <a href={image.source_link} target="_blank" rel="noopener noreferrer">
                  {image.image_info}
                </a>
              </div>
            ) : image.image_info ? (
              <div className="artwork-location">{image.image_info}</div>
            ) : null}
          </>
        );
      default:
        return <div className="artwork-title">{image.title || 'Untitled'}</div>;
    }
  };

  // Helper function to get collection subtitle with link
  const getCollectionSubtitle = (collection) => {
    switch(collection) {
      case 'Albert Kahn':
        return (
          <a
            href="https://collections.albert-kahn.hauts-de-seine.fr/"
            target="_blank"
            rel="noopener noreferrer"
            className="collection-subtitle"
          >
            Albert Kahn Museum
          </a>
        );
      case 'Public Domain Review':
        return (
          <a
            href="https://publicdomainreview.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="collection-subtitle"
          >
            Public Domain Review
          </a>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div
        className="artwork-info-container artwork-loading"
        style={{
          '--card-bg': colors.cardBg,
          '--glow-color': colors.glow,
          '--border-color': colors.border,
          '--text-color': colors.text
        }}
      >
        {onClose && (
          <button className="artwork-close-btn" onClick={onClose} title="Close">
            ✕
          </button>
        )}
        Loading artwork...
      </div>
    );
  }

  if (!countryISO) {
    return null; // Don't show the info bar when no country is selected
  }

  if (countryISO === null) {
    return (
      <div
        className="artwork-info-container artwork-no-data"
        style={{
          '--card-bg': colors.cardBg,
          '--glow-color': colors.glow,
          '--border-color': colors.border,
          '--text-color': colors.text
        }}
      >
        {onClose && (
          <button className="artwork-close-btn" onClick={onClose} title="Close">
            ✕
          </button>
        )}
        <h3 className="artwork-no-data-title">Territory Not Recognized</h3>
        <p className="artwork-no-data-subtitle">
          This territory is not in our database. We only include UN-recognized countries.
        </p>
      </div>
    );
  }

  const collections = Object.keys(imagesByCollection);

  if (collections.length === 0) {
    return (
      <div
        className="artwork-info-container artwork-no-data"
        style={{
          '--card-bg': colors.cardBg,
          '--glow-color': colors.glow,
          '--border-color': colors.border,
          '--text-color': colors.text
        }}
      >
        {onClose && (
          <button className="artwork-close-btn" onClick={onClose} title="Close">
            ✕
          </button>
        )}
        <h3 className="artwork-no-data-title">No images available</h3>
        <p className="artwork-no-data-subtitle">Country: {countryISO}</p>
      </div>
    );
  }

  return (
    <div
      className="artwork-info-container"
      style={{
        '--card-bg': colors.cardBg,
        '--glow-color': colors.glow,
        '--border-color': colors.border,
        '--text-color': colors.text,
        '--background-color': colors.background
      }}
    >
      <div className="artwork-info-header">
        <h3 className="artwork-info-title">
          {mode === 'quiz' && answerSubmitted && isCorrectAnswer ? (
            `✓ Correct: ${countryName || countryISO}`
          ) : mode === 'quiz' && answerSubmitted && !isCorrectAnswer ? (
            `✗ Incorrect: ${countryName || countryISO}`
          ) : (
            countryName || countryISO
          )}
        </h3>
        {mode === 'quiz' && answerSubmitted && isCorrectAnswer && onNext ? (
          <button
            className="artwork-next-btn"
            onClick={onNext}
            title="Next Country"
            aria-label="Go to next country"
          >
            Next →
          </button>
        ) : mode === 'quiz' && answerSubmitted && !isCorrectAnswer && onClose ? (
          <button
            className="artwork-try-again-btn"
            onClick={onClose}
            title="Try Again"
            aria-label="Try again"
          >
            Try Again
          </button>
        ) : onClose ? (
          <button
            className="artwork-close-btn"
            onClick={onClose}
            title="Close"
            aria-label="Close artwork panel"
          >
            ✕
          </button>
        ) : null}
      </div>

      <div className="artwork-types-list">
        {collections.map(collection => {
          const images = imagesByCollection[collection];
          const isCollapsed = collapsedTypes[collection];
          const currentIndex = currentImageIndex[collection] || 0;
          const currentImage = images[currentIndex];
          const hasMultiple = images.length > 1;

          return (
            <div key={collection} className="artwork-type-section">
              {/* Collection Header - Collapsible */}
              <div
                className="artwork-type-header"
                onClick={() => toggleTypeCollapse(collection)}
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
                        ref={el => imageRefs.current[collection] = el}
                        src={currentImage.filepath.startsWith('http')
                          ? currentImage.filepath
                          : `http://localhost:5000/${currentImage.filepath}`}
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
                            onClick={() => prevImage(collection)}
                            title="Previous"
                          >
                            ◀
                          </button>
                          <span className="pagination-info">
                            {currentIndex + 1} / {images.length}
                          </span>
                          <button
                            className="pagination-btn"
                            onClick={() => nextImage(collection)}
                            title="Next"
                          >
                            ▶
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="artwork-details">
                      {generateCaption(collection, currentImage)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="artwork-count-footer">
        Showing <strong>{collections.length}</strong> collection{collections.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default ArtworkInfoBar;
