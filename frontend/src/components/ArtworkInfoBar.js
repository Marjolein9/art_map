import { useState, useEffect } from 'react';
import { fetchArtworks } from '../services/api';

const ArtworkInfoBar = ({ countryISO, colors, mode }) => {
  const [artworksByType, setArtworksByType] = useState({});
  const [loading, setLoading] = useState(false);
  const [collapsedTypes, setCollapsedTypes] = useState({});
  const [currentImageIndex, setCurrentImageIndex] = useState({});

  // Fetch artworks from API when country changes
  useEffect(() => {
    if (!countryISO) {
      setArtworksByType({});
      return;
    }

    setLoading(true);
    fetchArtworks(countryISO)
      .then(data => {
        // Group artworks by type
        const grouped = data.reduce((acc, artwork) => {
          // Only include artworks with images
          if (!artwork.image_path) return acc;

          const type = artwork.type || 'Art';
          if (!acc[type]) {
            acc[type] = [];
          }
          acc[type].push(artwork);
          return acc;
        }, {});

        setArtworksByType(grouped);
        setLoading(false);

        // Initialize current image index for each type to 0
        const initialIndex = {};
        Object.keys(grouped).forEach(type => {
          initialIndex[type] = 0;
        });
        setCurrentImageIndex(initialIndex);

        console.log('🎨 Fetched artworks for', countryISO, ':', {
          types: Object.keys(grouped),
          counts: Object.entries(grouped).map(([type, items]) => `${type}: ${items.length}`)
        });
      })
      .catch(err => {
        console.error('Error fetching artworks:', err);
        setArtworksByType({});
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

  // Navigate to next image for a type
  const nextImage = (type) => {
    const artworks = artworksByType[type];
    if (!artworks) return;

    setCurrentImageIndex(prev => ({
      ...prev,
      [type]: (prev[type] + 1) % artworks.length
    }));
  };

  // Navigate to previous image for a type
  const prevImage = (type) => {
    const artworks = artworksByType[type];
    if (!artworks) return;

    setCurrentImageIndex(prev => ({
      ...prev,
      [type]: (prev[type] - 1 + artworks.length) % artworks.length
    }));
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
        Loading artwork...
      </div>
    );
  }

  if (!countryISO) {
    return (
      <div
        className="artwork-info-container artwork-waiting"
        style={{
          '--card-bg': colors.cardBg,
          '--glow-color': colors.glow,
          '--border-color': colors.border,
          '--text-color': colors.text
        }}
      >
        <h3 className="artwork-waiting-title">
          {mode === 'quiz' ? 'Waiting for quiz...' : 'Click a country to explore!'}
        </h3>
        <p className="artwork-waiting-subtitle">
          {mode === 'quiz' ? 'Find the country to see artwork!' : 'Select any country on the map'}
        </p>
      </div>
    );
  }

  const types = Object.keys(artworksByType);

  if (types.length === 0) {
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
        <h3 className="artwork-no-data-title">No artwork available</h3>
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
      <h3 className="artwork-info-title">
        {countryISO}
      </h3>

      <div className="artwork-types-list">
        {types.map(type => {
          const artworks = artworksByType[type];
          const isCollapsed = collapsedTypes[type];
          const currentIndex = currentImageIndex[type] || 0;
          const currentArtwork = artworks[currentIndex];
          const hasMultiple = artworks.length > 1;

          return (
            <div key={type} className="artwork-type-section">
              {/* Type Header - Collapsible */}
              <div
                className="artwork-type-header"
                onClick={() => toggleTypeCollapse(type)}
                style={{ cursor: 'pointer' }}
              >
                <h4 className="artwork-type-title">
                  {isCollapsed ? '▶' : '▼'} {type}
                  <span className="artwork-type-count"> ({artworks.length})</span>
                </h4>
              </div>

              {/* Type Content - Collapsible */}
              {!isCollapsed && (
                <div className="artwork-type-content">
                  <div className="artwork-item">
                    <div className="artwork-image-container">
                      <img
                        src={currentArtwork.image_path.startsWith('http')
                          ? currentArtwork.image_path
                          : `/${currentArtwork.image_path}`}
                        alt={currentArtwork.work_title || 'Artwork'}
                        className="artwork-image"
                        style={{ backgroundColor: '#ddd' }}
                        onError={(e) => {
                          console.log('Failed to load image:', currentArtwork.image_path);
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
                            onClick={() => prevImage(type)}
                            title="Previous"
                          >
                            ◀
                          </button>
                          <span className="pagination-info">
                            {currentIndex + 1} / {artworks.length}
                          </span>
                          <button
                            className="pagination-btn"
                            onClick={() => nextImage(type)}
                            title="Next"
                          >
                            ▶
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="artwork-details">
                      <div className="artwork-artist">
                        {currentArtwork.artist_name || 'Unknown Artist'}
                      </div>
                      <div className="artwork-title">
                        {currentArtwork.work_title || 'Untitled'}
                      </div>
                      {(currentArtwork.birth_date || currentArtwork.death_date) && (
                        <div className="artwork-dates">
                          {currentArtwork.birth_date?.split('-')[0] || '?'} – {currentArtwork.death_date?.split('-')[0] || 'living'}
                        </div>
                      )}
                      {currentArtwork.is_local === 'true' && (
                        <div className="artwork-local-badge">
                          Local
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="artwork-count-footer">
        Showing <strong>{types.length}</strong> type{types.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default ArtworkInfoBar;
