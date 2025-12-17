import { useState, useEffect, useRef } from 'react';
import { fetchImages, fetchChildMortality, fetchExternalLinks } from '../services/api';
import ImageGallery from './ImageGallery';
import ChildMortalitySection from './ChildMortalitySection';
import ExternalLinks from './ExternalLinks';

// Get API base URL from environment variable
const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api', '');

const ArtworkInfoBar = ({
  countryISO,
  countryName,
  colors,
  mode,
  answerSubmitted,
  isCorrectAnswer,
  onClose,
  onNext
}) => {
  const [imagesByCollection, setImagesByCollection] = useState({});
  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const [mortalityData, setMortalityData] = useState(null);
  const [externalLinks, setExternalLinks] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  const imageRefs = useRef({});
  const containerRef = useRef(null);

  /* ------------------------------------------------------------
     START FADE IMMEDIATELY (NO DELAY)
     ------------------------------------------------------------ */
  useEffect(() => {
    if (!countryISO) return;

    // Start invisible, then fade in immediately via CSS transition
    setIsVisible(false);

    // Next tick ensures opacity: 0 is painted first
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, [countryISO]);

  /* ------------------------------------------------------------
     FETCH IMAGES
     ------------------------------------------------------------ */
  useEffect(() => {
    if (!countryISO) {
      setImagesByCollection({});
      return;
    }

    setLoading(true);

    fetchImages(countryISO)
      .then(data => {
        const filtered = {};
        Object.entries(data || {}).forEach(([collection, images]) => {
          if (images && images.length > 0) {
            filtered[collection] = images;
          }
        });

        setImagesByCollection(filtered);

        const initialIndex = {};
        Object.keys(filtered).forEach(c => {
          initialIndex[c] = 0;
        });
        setCurrentImageIndex(initialIndex);
      })
      .catch(() => {
        setImagesByCollection({});
      })
      .finally(() => {
        setLoading(false);
      });
  }, [countryISO]);

  /* ------------------------------------------------------------
     FETCH CHILD MORTALITY
     ------------------------------------------------------------ */
  useEffect(() => {
    if (!countryISO) {
      setMortalityData(null);
      return;
    }

    fetchChildMortality(countryISO)
      .then(setMortalityData)
      .catch(() => setMortalityData(null));
  }, [countryISO]);

  /* ------------------------------------------------------------
     FETCH EXTERNAL LINKS
     ------------------------------------------------------------ */
  useEffect(() => {
    if (!countryISO) {
      setExternalLinks(null);
      return;
    }

    fetchExternalLinks(countryISO)
      .then(setExternalLinks)
      .catch(() => setExternalLinks(null));
  }, [countryISO]);

  /* ------------------------------------------------------------
     IMAGE NAVIGATION
     ------------------------------------------------------------ */
  const nextImage = (collection) => {
    const images = imagesByCollection[collection];
    if (!images) return;

    setCurrentImageIndex(prev => ({
      ...prev,
      [collection]: (prev[collection] + 1) % images.length
    }));
  };

  const prevImage = (collection) => {
    const images = imagesByCollection[collection];
    if (!images) return;

    setCurrentImageIndex(prev => ({
      ...prev,
      [collection]: (prev[collection] - 1 + images.length) % images.length
    }));
  };

  /* ------------------------------------------------------------
     CLEANUP IMAGE REFS
     ------------------------------------------------------------ */
  useEffect(() => {
    return () => {
      Object.values(imageRefs.current).forEach(img => {
        if (img) {
          img.src = '';
          img.removeAttribute('src');
        }
      });
      imageRefs.current = {};
    };
  }, [countryISO]);

  if (!countryISO) return null;

  const collections = Object.keys(imagesByCollection);

  return (
    <div
      ref={containerRef}
      className="artwork-info-container"
      style={{
        '--card-bg': colors.cardBg,
        '--glow-color': colors.glow,
        '--border-color': colors.border,
        '--text-color': colors.text,
        '--background-color': colors.background,

        opacity: isVisible ? 1 : 0,
     transition: 'opacity 5s cubic-bezier(0.4, 0.0, 0.2, 1)',

        pointerEvents: isVisible ? 'auto' : 'none'
      }}
    >
      {loading && (
        <div className="artwork-info-loading">
          <p>Loading images…</p>
        </div>
      )}

      {!loading && (
        <>
          <div className="artwork-info-header">
            <h3 className="artwork-info-title">
              {mode === 'quiz' && answerSubmitted
                ? isCorrectAnswer
                  ? `Correct: ${countryName || countryISO}`
                  : `Incorrect: ${countryName || countryISO}`
                : countryName || countryISO}
            </h3>

            {mode === 'quiz' && answerSubmitted && isCorrectAnswer && onNext ? (
              <button className="artwork-next-btn" onClick={onNext}>
                Next →
              </button>
            ) : onClose ? (
              <button className="artwork-close-btn" onClick={onClose}>
                ✕
              </button>
            ) : null}
          </div>

          {collections.length > 0 && (
            <div className="artwork-types-list">
              {collections.map(collection => (
                <ImageGallery
                  key={collection}
                  collection={collection}
                  images={imagesByCollection[collection]}
                  countryName={countryName}
                  currentIndex={currentImageIndex[collection] || 0}
                  onPrev={() => prevImage(collection)}
                  onNext={() => nextImage(collection)}
                  imageRef={el => (imageRefs.current[collection] = el)}
                />
              ))}
            </div>
          )}

          <ExternalLinks externalLinks={externalLinks} countryName={countryName} />
          <ChildMortalitySection mortalityData={mortalityData} />
        </>
      )}
    </div>
  );
};

export default ArtworkInfoBar;
