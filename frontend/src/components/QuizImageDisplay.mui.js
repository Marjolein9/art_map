import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Link,
  Button,
  Paper,
} from '@mui/material';
import COLOR_SCHEME from '../styles/colorSchemes';
import { API_BASE } from '../utils/apiConfig';
import {
  getSourceDisplayName,
  getSourceUrl
} from '../utils/sourceHelpers';

/**
 * QuizImageDisplay Component
 *
 * Displays a single random image from all available collections during quiz mode.
 * Shows only the image and caption, without collection headers.
 * Also displays a map section with neighboring countries.
 *
 * @param {Object} imagesByCollection - Object with collection names as keys and image arrays as values
 * @param {string} countryName - Name of the country
 * @param {string} countryISO - ISO3 code of the country
 * @param {Function} onShowAll - Callback to show all images in collections
 * @param {number} totalImagesAvailable - Total number of images available (from parent)
 * @param {boolean} showMap - Whether to show the map (default: true)
 * @param {boolean} hideNoImagesMessage - Whether to hide "No images available" message (default: false)
 */
const QuizImageDisplay = ({ imagesByCollection, countryName, countryISO, onShowAll, totalImagesAvailable = 0, showMap = true, hideNoImagesMessage = false }) => {
  const [randomImage, setRandomImage] = useState(null);
  const [collectionName, setCollectionName] = useState(null);
  const [mapError, setMapError] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Reset error state when country or image changes
  useEffect(() => {
    setMapError(false);
    setImageError(false);
  }, [countryISO, randomImage]);

  // Select a random image when imagesByCollection changes
  useEffect(() => {
    if (!imagesByCollection || Object.keys(imagesByCollection).length === 0) {
      setRandomImage(null);
      setCollectionName(null);
      return;
    }

    // Truly random selection: flatten all images from all collections
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
      return;
    }

    // Pick a truly random image from all collections
    const randomIndex = Math.floor(Math.random() * allImagesWithCollection.length);
    const selected = allImagesWithCollection[randomIndex];
    setRandomImage(selected.image);
    setCollectionName(selected.collection);
  }, [imagesByCollection]);

  const hasImages = randomImage && collectionName;

  // Source mapping functions imported from shared utility

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

  // Helper function to get image link URL based on collection type
  const getImageLinkUrl = () => {
    if (!randomImage || !collectionName) return null;

    switch(collectionName) {
      case 'Albert Kahn':
        return randomImage.page_url;
      case 'Children in Art':
        return randomImage.work_url;
      case 'Public Domain Review':
        return randomImage.source_url;
      case 'Met Museum':
      case 'Metropolitan Museum of Art':
        return randomImage.object_url;
      default:
        return null;
    }
  };

  const renderCaption = () => {
    const displayName = getCollectionDisplayName(collectionName);

    // Spec row: mono uppercase key on left, right-aligned value
    const SpecRow = ({ label, children, last }) => (
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: 1.5,
        py: 0.625,
        borderBottom: last ? 'none' : '1px dotted var(--rule, #cfc4a8)',
      }}>
        <Typography component="span" sx={{
          fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
          fontSize: '9px',
          letterSpacing: '.18em',
          textTransform: 'uppercase',
          color: 'var(--ink-3, #6c6356)',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          {label}
        </Typography>
        <Box sx={{ textAlign: 'right', fontSize: '11px', color: 'var(--ink-2, #3a322a)', lineHeight: 1.4, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
          {children}
        </Box>
      </Box>
    );

    // Italic serif title, optionally linked
    const ArtTitle = ({ href, children }) => (
      <Typography component="h3" sx={{
        fontFamily: '"Cormorant Garamond", Georgia, serif',
        fontSize: '1.2rem',
        fontStyle: 'italic',
        fontWeight: 500,
        color: 'var(--ink, #1a1612)',
        lineHeight: 1.15,
        mb: 0.75,
        mt: 0,
      }}>
        {href ? (
          <Link href={href} target="_blank" rel="noopener noreferrer" sx={{
            color: 'var(--accent, #b34727)',
            textDecoration: 'none',
            borderBottom: '1px solid rgba(179,71,39,.35)',
            transition: 'border-color .15s, color .15s',
            '&:hover': { borderColor: 'var(--accent, #b34727)', color: 'var(--link-hover, #7a2c14)' },
          }}>
            {children}<Box component="span" sx={{ fontSize: '0.7em', ml: '3px', opacity: 0.7, verticalAlign: 'middle' }}>↗</Box>
          </Link>
        ) : children}
      </Typography>
    );

    // "by Artist · nationality" line
    const ByLine = ({ artist, artistHref, nationality }) => {
      if (!artist) return null;
      return (
        <Typography sx={{
          fontFamily: 'var(--font-sans, "Manrope", sans-serif)',
          fontSize: '12px',
          lineHeight: 1.5,
          color: 'var(--ink-3, #6c6356)',
          mb: 1.25,
        }}>
            {artistHref ? (
            <Link href={artistHref} target="_blank" rel="noopener noreferrer" sx={{
              fontWeight: 600,
              color: 'var(--ink-2, #3a322a)',
              textDecoration: 'none',
              borderBottom: '1px solid var(--rule, #cfc4a8)',
              '&:hover': { borderColor: 'var(--accent, #b34727)' },
            }}>
              {artist}
            </Link>
          ) : (
            <Box component="b" sx={{ color: 'var(--ink-2, #3a322a)' }}>{artist}</Box>
          )}
          {nationality && (
            <Box component="span" sx={{ fontStyle: 'italic', color: 'var(--ink-3, #6c6356)' }}>
              {' · '}{nationality}
            </Box>
          )}
        </Typography>
      );
    };

    // Accent source link with arrow
    const SourceLink = ({ href, children }) => href ? (
      <Link href={href} target="_blank" rel="noopener noreferrer" sx={{
        color: 'var(--accent, #b34727)',
        textDecoration: 'none',
        borderBottom: '1px solid rgba(179,71,39,.3)',
        fontSize: '11px',
        '&:hover': { borderColor: 'var(--accent, #b34727)' },
      }}>
        {children} ↗
      </Link>
    ) : (
      <Box component="span" sx={{ fontSize: '11px', color: 'var(--ink-2, #3a322a)' }}>{children}</Box>
    );

    // Build metadata for each collection
    let title = null, titleHref = null, artist = null, artistHref = null,
        nationality = null, specs = [];

    switch(displayName) {
      case 'Albert Kahn':
        title = randomImage.title;
        titleHref = randomImage.page_url;
        if (randomImage.mission) specs.push({ label: 'Mission', value: randomImage.mission });
        if (randomImage.license) specs.push({ label: 'License', value: randomImage.license });
        specs.push({ label: 'Source', value: <SourceLink href="https://albert-kahn.hauts-de-seine.fr/en/">Musée Albert-Kahn</SourceLink> });
        break;

      case 'Metropolitan Museum of Art':
        title = randomImage.title;
        titleHref = randomImage.object_url || 'https://www.metmuseum.org/exhibitions';
        artist = randomImage.artist_name || randomImage.culture;
        if (randomImage.object_date) specs.push({ label: 'Date', value: randomImage.object_date });
        if (randomImage.medium) specs.push({ label: 'Medium', value: randomImage.medium });
        specs.push({ label: 'Source', value: <SourceLink href={titleHref}>Met Museum</SourceLink> });
        break;

      case 'Children in Art': {
        title = randomImage.title;
        titleHref = randomImage.work_url;
        artist = randomImage.artist_name;
        artistHref = randomImage.author_wikilink;
        nationality = randomImage.artist_nationality;
        const rawDate = randomImage.artwork_date || randomImage.object_date;
        const date = rawDate ? rawDate.replace(/^(\d{4})-\d{2}-\d{2}T.*$/, '$1') : null;
        if (date) specs.push({ label: 'Date', value: date });
        if (randomImage.tags) specs.push({ label: 'Medium', value: randomImage.tags });
        const licenseRaw = (randomImage.more_info || randomImage.license || '').trim();
        const isFree = /^(cc|public.domain|open)/i.test(licenseRaw);
        if (licenseRaw && !isFree) specs.push({ label: 'License', value: licenseRaw });
        const sourceUrl = randomImage.source && getSourceUrl(randomImage.source)
          ? getSourceUrl(randomImage.source)
          : randomImage.work_url || null;
        const sourceName = randomImage.source
          ? getSourceDisplayName(randomImage.source)
          : 'View work';
        if (sourceUrl) {
          specs.push({ label: 'Source', value: <SourceLink href={sourceUrl}>{sourceName}</SourceLink> });
        }
        break;
      }

      case 'Public Domain Review':
        title = randomImage.title;
        titleHref = randomImage.source_url;
        if (randomImage.description) specs.push({ label: 'Description', value: randomImage.description });
        specs.push({ label: 'License', value: 'Public Domain' });
        if (randomImage.source_link) specs.push({ label: 'Source', value: <SourceLink href={randomImage.source_link}>View image</SourceLink> });
        if (randomImage.source_url) specs.push({ label: 'Article', value: <SourceLink href={randomImage.source_url}>Public Domain Review</SourceLink> });
        break;

      default:
        return null;
    }

    return (
      <Box sx={{ pt: 2 }}>
        {title && <ArtTitle href={titleHref}>{title}</ArtTitle>}
        <ByLine artist={artist} artistHref={artistHref} nationality={nationality} />
        {specs.length > 0 && (
          <Box sx={{ borderTop: '1px dotted var(--rule, #cfc4a8)', mt: 1.25 }}>
            {specs.map(({ label, value }, i) => (
              <SpecRow key={i} label={label} last={i === specs.length - 1}>{value}</SpecRow>
            ))}
          </Box>
        )}
      </Box>
    );
  };

  const imageUrl = hasImages
    ? (randomImage.filepath.startsWith('http')
        ? randomImage.filepath
        : `${API_BASE}/${randomImage.filepath}`)
    : null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Map View Section - Only show if showMap prop is true */}
      {showMap && (
        <Paper
          elevation={0}
          sx={{
            backgroundColor: COLOR_SCHEME.cardBg,
            border: `1px solid ${COLOR_SCHEME.border}`,
            borderRadius: 2,
            p: 2,
          }}
        >
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2
          }}>
            {/* Map Box - Load pre-generated SVG from backend */}
            <Box sx={{
              position: 'relative',
              width: { xs: '100%', sm: 180 },
              maxWidth: 180,
              height: 130,
              overflow: 'hidden',
              borderRadius: 1
            }}>
              {!mapError ? (
                <img
                  src={`${API_BASE}/api/maps/${countryISO}`}
                  alt={`Map of ${countryName}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'block'
                  }}
                  onError={() => setMapError(true)}
                />
              ) : (
                <Box sx={{
                  display: 'flex',
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#e8f4f8',
                  border: `2px solid ${COLOR_SCHEME.border}`,
                  borderRadius: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  color: '#666'
                }}>
                  Map not available
                </Box>
              )}
            </Box>
        </Box>
      </Paper>
      )}

      {/* Image Section - Only show if images exist */}
      {hasImages ? (
        <Card
          sx={{
            backgroundColor: COLOR_SCHEME.cardBg,
            color: COLOR_SCHEME.text,
            border: `1px solid ${COLOR_SCHEME.border}`,
            boxShadow: 'none',
            borderRadius: 2,
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            {/* Show all button */}
            {onShowAll && (
              <Box sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                pb: 0.75,
                mb: 2,
                borderBottom: '1px solid var(--rule, #cfc4a8)',
              }}>
                {onShowAll ? (
                  <Button
                    variant="text"
                    size="small"
                    onClick={onShowAll}
                    sx={{
                      fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                      fontSize: '10px',
                      fontWeight: 400,
                      letterSpacing: '.1em',
                      color: 'var(--ink-3, #6c6356)',
                      textTransform: 'none',
                      minWidth: 'auto',
                      p: 0,
                      '&:hover': { color: 'var(--accent, #b34727)', background: 'none' },
                    }}
                  >
                    show all ({totalImagesAvailable})
                  </Button>
                ) : null}
              </Box>
            )}
            {/* Image — CSS animation handles fade-in reliably for both fresh and cached loads */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                mb: 2,
                maxHeight: '600px',
                overflow: 'hidden',
                '@keyframes imgFadeIn': { from: { opacity: 0 }, to: { opacity: 1 } },
                '& img': { animation: 'imgFadeIn 0.3s ease both' },
              }}
            >
              {!imageError ? (
                getImageLinkUrl() ? (
                  <Link
                    href={getImageLinkUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}
                  >
                    <img
                      src={imageUrl}
                      alt={randomImage.title || randomImage.description || 'Artwork'}
                      style={{
                        width: '100%',
                        height: 'auto',
                        maxHeight: '600px',
                        objectFit: 'contain',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                      onError={() => setImageError(true)}
                    />
                  </Link>
                ) : (
                  <img
                    src={imageUrl}
                    alt={randomImage.title || randomImage.description || 'Artwork'}
                    style={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: '600px',
                      objectFit: 'contain',
                      borderRadius: '4px',
                    }}
                    onError={() => setImageError(true)}
                  />
                )
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    minHeight: '200px',
                    backgroundColor: '#f5f5f5',
                    border: `2px solid ${COLOR_SCHEME.border}`,
                    borderRadius: '4px',
                    color: '#666',
                  }}
                >
                  Image unavailable
                </Box>
              )}
            </Box>

            {/* Caption */}
            {renderCaption()}
          </CardContent>
        </Card>
      ) : !hideNoImagesMessage ? (
        <Paper
          elevation={0}
          sx={{
            backgroundColor: COLOR_SCHEME.cardBg,
            border: `1px solid ${COLOR_SCHEME.border}`,
            borderRadius: 2,
            p: 3,
            textAlign: 'center'
          }}
        >
          <Typography variant="body1" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
            No images available for this country
          </Typography>
        </Paper>
      ) : null}
    </Box>
  );
};

export default QuizImageDisplay;
