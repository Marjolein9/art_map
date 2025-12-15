import { useState, useEffect, useRef } from 'react';
import { fetchImages, fetchChildMortality, fetchExternalLinks } from '../services/api';
import ImageGallery from './ImageGallery';
import ChildMortalitySection from './ChildMortalitySection';

/**
 * ArtworkInfoBar Component
 *
 * Displays artwork collections and child mortality data for a selected country.
 * Manages state for image collections, pagination, and data fetching.
 */
const ArtworkInfoBar = ({ countryISO, countryName, colors, mode, answerSubmitted, isCorrectAnswer, onClose, onNext }) => {
  const [imagesByCollection, setImagesByCollection] = useState({});
  const [loading, setLoading] = useState(false);
  const [collapsedTypes, setCollapsedTypes] = useState({});
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const [mortalityData, setMortalityData] = useState(null);
  const [externalLinks, setExternalLinks] = useState(null);
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
      })
      .catch(err => {
        console.error('Error fetching images:', err);
        setImagesByCollection({});
        setLoading(false);
      });
  }, [countryISO]);

  // Fetch child mortality data when country changes
  useEffect(() => {
    if (!countryISO || countryISO === null) {
      setMortalityData(null);
      return;
    }

    fetchChildMortality(countryISO)
      .then(data => {
        setMortalityData(data);
      })
      .catch(err => {
        setMortalityData(null);
      });
  }, [countryISO]);

  // Fetch external links when country changes
  useEffect(() => {
    if (!countryISO || countryISO === null) {
      setExternalLinks(null);
      return;
    }

    fetchExternalLinks(countryISO)
      .then(data => {
        setExternalLinks(data);
      })
      .catch(err => {
        setExternalLinks(null);
      });
  }, [countryISO]);

  // Toggle collection collapse
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
      imageRefs.current[collection].src = '';
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
      imageRefs.current[collection].src = '';
    }

    setCurrentImageIndex(prev => ({
      ...prev,
      [collection]: (prev[collection] - 1 + images.length) % images.length
    }));
  };

  // Cleanup all images when country changes
  useEffect(() => {
    return () => {
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

  // Get all available collections
  const collections = Object.keys(imagesByCollection);

  // Show loading state
  if (loading) {
    return (
      <div className="artwork-info-container loading">
        <p>Loading images...</p>
      </div>
    );
  }

  // Show "no images" message (but still show country info and external links)
  if (collections.length === 0) {
    return (
      <div
        className="artwork-info-container"
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
        <h3 className="artwork-no-data-title">{countryName || countryISO}</h3>
        <p className="artwork-no-data-subtitle">No images available for this country</p>

        {/* Show child mortality data if available */}
        {mortalityData && (
          <ChildMortalitySection mortalityData={mortalityData} colors={colors} />
        )}

        {/* Show external links if available */}
        {externalLinks && (externalLinks.gapminder_url || externalLinks.tasteatlas_url) && (
          <div className="artwork-external-links" style={{ marginTop: '20px' }}>
            <h4 style={{ color: colors.text, marginBottom: '10px' }}>Explore More</h4>
            {externalLinks.gapminder_url && (
              <a
                href={externalLinks.gapminder_url}
                target="_blank"
                rel="noopener noreferrer"
                className="external-link-btn"
              >
                🏠 Gapminder Dollar Street
              </a>
            )}
            {externalLinks.tasteatlas_url && (
              <a
                href={externalLinks.tasteatlas_url}
                target="_blank"
                rel="noopener noreferrer"
                className="external-link-btn"
              >
                🍽️ TasteAtlas
              </a>
            )}
          </div>
        )}
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

        {/* Action buttons */}
        {mode === 'quiz' && answerSubmitted && isCorrectAnswer && onNext ? (
          <button
            className="artwork-next-btn"
            onClick={onNext}
            title="Next Country"
            aria-label="Next country"
          >
            Next →
          </button>
        ) : mode === 'quiz' && answerSubmitted && !isCorrectAnswer && onClose ? (
          <button
            className="artwork-next-btn"
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

      {/* Image collections */}
      <div className="artwork-types-list">
        {collections.map(collection => (
          <ImageGallery
            key={collection}
            collection={collection}
            images={imagesByCollection[collection]}
            isCollapsed={collapsedTypes[collection]}
            onToggle={() => toggleTypeCollapse(collection)}
            currentIndex={currentImageIndex[collection] || 0}
            onPrev={() => prevImage(collection)}
            onNext={() => nextImage(collection)}
            imageRef={(el) => imageRefs.current[collection] = el}
          />
        ))}
      </div>

      <div className="artwork-count-footer">
        Showing <strong>{collections.length}</strong> collection{collections.length !== 1 ? 's' : ''}
      </div>

      {/* Child Mortality Section */}
      <ChildMortalitySection mortalityData={mortalityData} />

      {/* External Links Section */}
      {externalLinks && (externalLinks.gapminder_url?.trim() || externalLinks.tasteatlas_url?.trim() || externalLinks.extra_links?.trim()) && (
        <div className="external-links-section">
          <h4 className="external-links-title">External Resources</h4>
          <div className="external-links-list">
            {externalLinks.gapminder_url?.trim() && (
              <a
                href={externalLinks.gapminder_url}
                target="_blank"
                rel="noopener noreferrer"
                className="external-link"
              >
                Gapminder Dollar Street
              </a>
            )}
            {externalLinks.tasteatlas_url?.trim() && (
              <a
                href={externalLinks.tasteatlas_url}
                target="_blank"
                rel="noopener noreferrer"
                className="external-link"
              >
                Food Atlas
              </a>
            )}
            {externalLinks.extra_links?.trim() && (
              <a
                href={externalLinks.extra_links}
                target="_blank"
                rel="noopener noreferrer"
                className="external-link"
              >
                Additional Links
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtworkInfoBar;
