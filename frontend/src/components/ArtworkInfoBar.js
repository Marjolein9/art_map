import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Box,
  CircularProgress,
  Typography
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { fetchImages, fetchChildMortality, fetchExternalLinks } from '../services/api';
import ImageGallery from './ImageGallery.mui';
import ChildMortalitySection from './ChildMortalitySection.mui';
import ExternalLinks from './ExternalLinks.mui';
import muiTheme from '../theme/muiTheme';

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

  const handleBackdropClick = (event, reason) => {
    if (reason === 'backdropClick' && onClose) {
      onClose();
    }
  };

  return (
    <ThemeProvider theme={muiTheme}>
      <Dialog
        open={true}
        onClose={handleBackdropClick}
        maxWidth="sm"
        fullWidth
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              backdropFilter: 'blur(3px)',
            }
          }
        }}
        sx={{
          '& .MuiBackdrop-root': {
            top: '5px',
            left: '5px',
            right: '5px',
            bottom: '5px',
          },
          '& .MuiDialog-paper': {
            opacity: isVisible ? 1 : 0,
            transition: 'opacity 5s cubic-bezier(0.4, 0.0, 0.2, 1)',
            pointerEvents: isVisible ? 'auto' : 'none',
      
          }
        }}
      >
        {/* Dialog Header */}
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Typography variant="h6" component="div" sx={{ fontWeight: 600, flex: 1, textAlign: 'center' }}>
            {mode === 'quiz' && answerSubmitted
              ? isCorrectAnswer
                ? `Correct: ${countryName || countryISO}`
                : `Incorrect: ${countryName || countryISO}`
              : countryName || countryISO}
          </Typography>

          <Box sx={{ display: 'flex', gap: 1 }}>
            {mode === 'quiz' && answerSubmitted && isCorrectAnswer && onNext ? (
              <Button
                variant="contained"
                onClick={onNext}
                size="small"
              >
                Next
              </Button>
            ) : onClose ? (
              <Button
                variant="outlined"
                onClick={onClose}
                size="small"
                sx={{
                  minWidth: 'auto',
                  padding: '4px 8px'
                }}
              >
                {mode === 'quiz' && answerSubmitted && !isCorrectAnswer ? 'Try Again' : '✕'}
              </Button>
            ) : null}
          </Box>
        </DialogTitle>

        {/* Dialog Content */}
        <DialogContent>
          {loading && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <CircularProgress size={40} />
              <Typography variant="body2" sx={{ mt: 2 }}>
                Loading images…
              </Typography>
            </Box>
          )}

          {!loading && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {collections.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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
                </Box>
              )}

              <ExternalLinks externalLinks={externalLinks} countryName={countryName} />
              <ChildMortalitySection mortalityData={mortalityData} />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </ThemeProvider>
  );
};

export default ArtworkInfoBar;
