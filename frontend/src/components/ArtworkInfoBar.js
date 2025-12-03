import React, { useState, useEffect } from 'react';
import { fetchArtworks } from '../services/api';

const ArtworkInfoBar = ({ countryISO, colors }) => {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch artworks from API when country changes
  useEffect(() => {
    if (!countryISO) {
      setArtworks([]);
      return;
    }

    setLoading(true);
    fetchArtworks(countryISO)
      .then(data => {
        const artworksWithImages = data.filter(artwork => artwork.image_path);
        setArtworks(artworksWithImages);
        setLoading(false);

        console.log('🎨 Fetched artworks for', countryISO, ':', {
          total: data.length,
          withImages: artworksWithImages.length,
          imagePaths: artworksWithImages.map(a => a.image_path).slice(0, 3)
        });
      })
      .catch(err => {
        console.error('Error fetching artworks:', err);
        setArtworks([]);
        setLoading(false);
      });
  }, [countryISO]);

  if (loading) {
    return (
      <div style={{
        backgroundColor: colors.cardBg,
        borderRadius: '8px',
        boxShadow: `0 0 20px ${colors.glow}, 0 4px 6px rgba(0, 0, 0, 0.3)`,
        padding: '20px',
        border: `5px solid ${colors.border}`,
        backdropFilter: 'blur(10px)',
        color: colors.text,
        textAlign: 'center',
        fontFamily: "'Roboto', Helvetica, sans-serif"
      }}>
        Loading artwork...
      </div>
    );
  }

  if (!countryISO) {
    return (
      <div style={{
        backgroundColor: colors.cardBg,
        borderRadius: '8px',
        boxShadow: `0 0 20px ${colors.glow}, 0 4px 6px rgba(0, 0, 0, 0.3)`,
        padding: '20px',
        border: `5px solid ${colors.border}`,
        backdropFilter: 'blur(10px)',
        color: colors.text,
        textAlign: 'center',
        fontFamily: "'Roboto', Helvetica, sans-serif"
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: colors.glow }}>Waiting for quiz...</h3>
        <p style={{ margin: 0, opacity: 0.7 }}>Find the country to see artwork!</p>
      </div>
    );
  }

  if (artworks.length === 0) {
    return (
      <div style={{
        backgroundColor: colors.cardBg,
        borderRadius: '8px',
        boxShadow: `0 0 20px ${colors.glow}, 0 4px 6px rgba(0, 0, 0, 0.3)`,
        padding: '20px',
        border: `5px solid ${colors.border}`,
        backdropFilter: 'blur(10px)',
        color: colors.text,
        textAlign: 'center',
        fontFamily: "'Roboto', Helvetica, sans-serif"
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: colors.glow }}>No artwork available</h3>
        <p style={{ margin: 0, opacity: 0.7 }}>Country: {countryISO}</p>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: colors.cardBg,
      borderRadius: '8px',
      boxShadow: `0 0 20px ${colors.glow}, 0 4px 6px rgba(0, 0, 0, 0.3)`,
      padding: '20px',
      border: `5px solid ${colors.border}`,
      backdropFilter: 'blur(10px)',
      animation: 'slideIn 0.25s ease-in-out',
      fontFamily: "'Roboto', Helvetica, sans-serif"
    }}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@300;400;700&family=Roboto:wght@100;300;400;700;900&display=swap');

          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>

      <h3 style={{
        color: colors.text,
        marginBottom: '15px',
        fontSize: '18pt',
        textTransform: 'uppercase',
        fontFamily: "'Roboto Condensed', Helvetica, sans-serif",
        fontWeight: '300',
        textAlign: 'center',
        letterSpacing: '1.5px'
      }}>
        Artworks
      </h3>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
      }}>
        {artworks.map((artwork, index) => (
          <div
            key={index}
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              borderRadius: '8px',
              overflow: 'hidden',
              border: `2px solid ${colors.border}`,
              transition: 'transform 0.25s ease-in-out, box-shadow 0.25s ease-in-out, opacity 0.25s ease-in-out',
              cursor: 'pointer',
              opacity: 0.8,
              boxSizing: 'border-box'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = `0 0 20px ${colors.glow}, 0 4px 12px rgba(0, 0, 0, 0.5)`;
              e.currentTarget.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.opacity = '0.8';
            }}
          >
            <div style={{
              padding: '10px',
              backgroundColor: 'rgba(0, 0, 0, 0.2)'
            }}>
              <img
                src={artwork.image_path.startsWith('http') ? artwork.image_path : `/${artwork.image_path}`}
                alt={artwork.work_title || 'Artwork'}
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  backgroundColor: '#ddd',
                  borderRadius: '4px'
                }}
                onError={(e) => {
                  console.log('Failed to load image:', artwork.image_path);
                  // Use inline SVG as fallback instead of external URL
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
            </div>
            <div style={{
              padding: '15px',
              color: colors.text,
              fontFamily: "'Roboto', Helvetica, sans-serif"
            }}>
              <div style={{
                fontWeight: '700',
                fontSize: '1.1em',
                marginBottom: '5px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: colors.text,
                fontFamily: "'Roboto Condensed', Helvetica, sans-serif"
              }}>
                {artwork.artist_name || 'Unknown Artist'}
              </div>
              <div style={{
                fontSize: '0.95em',
                color: 'rgba(229, 229, 229, 0.7)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                marginBottom: '10px'
              }}>
                {artwork.work_title || 'Untitled'}
              </div>
              {(artwork.birth_date || artwork.death_date) && (
                <div style={{
                  fontSize: '0.85em',
                  color: 'rgba(229, 229, 229, 0.5)',
                  marginTop: '5px'
                }}>
                  {artwork.birth_date?.split('-')[0] || '?'} – {artwork.death_date?.split('-')[0] || 'living'}
                </div>
              )}
              {artwork.is_local === 'true' && (
                <div style={{
                  display: 'inline-block',
                  backgroundColor: colors.glow,
                  color: colors.background,
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '0.75em',
                  marginTop: '8px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Local
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        textAlign: 'center',
        marginTop: '20px',
        paddingTop: '20px',
        borderTop: `1px solid rgba(175, 225, 250, 0.3)`,
        color: 'rgba(229, 229, 229, 0.7)',
        fontSize: '12pt',
        fontFamily: "'Roboto', Helvetica, sans-serif"
      }}>
        Showing <strong style={{ color: colors.glow }}>{artworks.length}</strong> artwork{artworks.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default ArtworkInfoBar;
